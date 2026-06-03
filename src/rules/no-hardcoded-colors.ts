import type { Rule } from 'eslint';
import { loadTokens, TokenOptions } from '../lib/tokens';
import { findColors } from '../lib/colors';
import { makeAllowMatcher } from '../lib/allow';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded color values (hex, rgb, hsl, hwb, lab, lch, oklab, oklch); use design-system tokens',
      url: 'https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/blob/main/docs/rules/no-hardcoded-colors.md',
    },
    messages: {
      noHardcodedColor:
        'Unexpected hardcoded color "{{ color }}". Use a design-system token instead.',
      useDesignToken: 'Replace hardcoded color "{{ color }}" with the design token "{{ token }}".',
      replaceWithToken: 'Replace with design token "{{ token }}".',
    },
    hasSuggestions: true,
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          cssFile: { type: 'string' },
          configFile: { type: 'string' },
          tokens: { type: 'object', additionalProperties: { type: 'string' } },
          allow: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = (context.options[0] ?? {}) as TokenOptions & { allow?: string[] };
    const tokens = loadTokens(options, context.cwd);
    const isAllowed = makeAllowMatcher(options.allow);

    const checkString = (node: Rule.Node, value: string, fixable: boolean) => {
      findColors(value).forEach(({ raw, normalized, index }) => {
        if (isAllowed(raw) || isAllowed(normalized)) return;

        const token = tokens[normalized];
        if (token) {
          const before = value[index - 1];
          const after = value[index + raw.length];
          const bracketed = before === '[' && after === ']';

          const applyFix = (fixer: Rule.RuleFixer) => {
            const start = node.range![0] + 1 + index - (bracketed ? 1 : 0);
            const length = raw.length + (bracketed ? 2 : 0);
            return fixer.replaceTextRange([start, start + length], token);
          };

          context.report({
            node,
            messageId: 'useDesignToken',
            data: { color: raw, token },
            ...(fixable && bracketed ? { fix: applyFix } : {}),
            suggest: fixable
              ? [
                  {
                    messageId: 'replaceWithToken',
                    data: { token },
                    fix: applyFix,
                  },
                ]
              : [],
          });
        } else {
          context.report({
            node,
            messageId: 'noHardcodedColor',
            data: { color: raw },
          });
        }
      });
    };

    return {
      Literal(node) {
        if (typeof node.value === 'string') checkString(node, node.value, true);
      },
      TemplateLiteral(node) {
        node.quasis.forEach((q) => checkString(node, q.value.raw, false));
      },
    };
  },
};

export default rule;
