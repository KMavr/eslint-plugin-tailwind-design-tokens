import type { Rule } from 'eslint';
import { makeAllowMatcher } from '../lib/allow';
import { parseArbitrarySpacing, toPx, toScaleStep } from '../lib/spacing';
import { loadSpacingTokens } from '../lib/tokens';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    hasSuggestions: true,
    docs: {
      description:
        'Disallow arbitrary spacing values; use the spacing scale or design-system tokens',
      url: 'https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/blob/main/docs/rules/no-arbitrary-spacing.md',
    },
    messages: {
      useScale: 'Use "{{ suggestion }}" instead of arbitrary "{{ className }}".',
      offScale: 'Arbitrary spacing "{{ className }}" is off the spacing scale.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          cssFile: { type: 'string' },
          allow: { type: 'array', items: { type: 'string' } },
          rootFontSize: { type: 'number', exclusiveMinimum: true, minimum: 0 },
          stepIncrement: { enum: [0.25, 0.5, 1] },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {};
    const rootFontSize = options.rootFontSize ?? 16;
    const stepIncrement = options.stepIncrement ?? 0.25;
    const isAllowed = makeAllowMatcher(context.options[0]?.allow ?? []);

    const { base, named } = loadSpacingTokens(options.cssFile, context.cwd);
    const basePx = base ? toPx(base, rootFontSize) : null;

    const replacementsFor = (className: string): string[] | null => {
      const parsed = parseArbitrarySpacing(className);
      if (!parsed || isAllowed(className)) {
        return null;
      }

      const px = toPx(parsed.value, rootFontSize);
      if (px === null) {
        return null;
      }

      const step = basePx === null ? null : toScaleStep(px, basePx, stepIncrement);
      const tokenNames = Object.entries(named)
        .filter(([, value]) => toPx(value, rootFontSize) === px)
        .map(([name]) => name);

      const { prefix, negative, utility, suffix } = parsed;

      return [...(step ? [step] : []), ...tokenNames].map(
        (candidate) => `${prefix}${negative ? '-' : ''}${utility}-${candidate}${suffix}`,
      );
    };

    const checkString = (node: Rule.Node, value: string) => {
      const tokens = value.split(/\s+/);
      tokens.forEach((token) => {
        const replacements = replacementsFor(token);
        if (!replacements) return;

        if (replacements.length === 0) {
          context.report({
            node,
            messageId: 'offScale',
            data: { className: token },
          });
          return;
        }

        const fixTo = (replacement: string) => (fixer: Rule.RuleFixer) =>
          fixer.replaceText(node, context.sourceCode.getText(node).replaceAll(token, replacement));

        context.report({
          node,
          messageId: 'useScale',
          data: { className: token, suggestion: replacements[0] },
          ...(replacements.length === 1
            ? { fix: fixTo(replacements[0]) }
            : {
                suggest: replacements.map((replacement) => ({
                  messageId: 'useScale',
                  data: { className: token, suggestion: replacement },
                  fix: fixTo(replacement),
                })),
              }),
        });
      });
    };

    return {
      Literal(node) {
        if (typeof node.value === 'string') checkString(node, node.value);
      },
      TemplateLiteral(node) {
        node.quasis.forEach((q) => checkString(node, q.value.raw));
      },
    };
  },
};

export default rule;
