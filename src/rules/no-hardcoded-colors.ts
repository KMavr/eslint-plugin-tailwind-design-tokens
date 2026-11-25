import type { Rule } from 'eslint';
import { loadColorTokens, ColorTokenOptions } from '../lib/tokens';
import { findColors } from '../lib/colors';
import { makeAllowMatcher } from '../lib/allow';
import { visitStrings } from '../lib/visit';

type JSXParent = { type: string; parent?: JSXParent; name?: { name?: unknown } };

// <a href="#add"> and <a href={'#add'}> are anchors, never colors.
const isHrefValue = (node: Rule.Node) => {
  const parent = node.parent as unknown as JSXParent | undefined;
  const attr = parent?.type === 'JSXExpressionContainer' ? parent.parent : parent;
  return attr?.type === 'JSXAttribute' && attr.name?.name === 'href';
};

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
    const options = (context.options[0] ?? {}) as ColorTokenOptions & { allow?: string[] };
    const tokens = loadColorTokens(options, context.cwd);
    const isAllowed = makeAllowMatcher(options.allow);

    const checkString = (node: Rule.Node, text: string, start: number) => {
      if (isHrefValue(node)) return;
      findColors(text).forEach(({ raw, normalized, index }) => {
        if (isAllowed(raw) || isAllowed(normalized)) return;

        const token = tokens[normalized];
        if (token) {
          const before = text[index - 1];
          const after = text[index + raw.length];
          const bracketed = before === '[' && after === ']';

          const applyFix = (fixer: Rule.RuleFixer) => {
            const from = start + index - (bracketed ? 1 : 0);
            const length = raw.length + (bracketed ? 2 : 0);
            return fixer.replaceTextRange([from, from + length], token);
          };

          context.report({
            node,
            messageId: 'useDesignToken',
            data: { color: raw, token },
            ...(bracketed ? { fix: applyFix } : {}),
            suggest: [
              {
                messageId: 'replaceWithToken',
                data: { token },
                fix: applyFix,
              },
            ],
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

    return visitStrings(checkString);
  },
};

export default rule;
