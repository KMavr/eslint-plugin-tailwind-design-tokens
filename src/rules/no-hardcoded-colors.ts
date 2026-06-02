import type { Rule } from 'eslint';
import { loadTokens, TokenOptions } from '../lib/tokens';
import { findColors } from '../lib/colors';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded color values (hex, rgb, hsl, oklch); use design-system tokens',
      url: 'https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/blob/main/docs/rules/no-hardcoded-colors.md',
    },
    messages: {
      noHardcodedColor:
        'Unexpected hardcoded color "{{ color }}". Use a design-system token instead.',
      useDesignToken: 'Replace hardcoded color "{{ color }}" with the design token "{{ token }}".',
    },
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
    const allow = new Set(options.allow ?? []);

    const checkString = (node: Rule.Node, value: string) => {
      findColors(value).forEach(({ raw, normalized }) => {
        if (allow.has(raw) || allow.has(normalized)) return;

        const token = tokens[normalized];
        if (token) {
          context.report({
            node,
            messageId: 'useDesignToken',
            data: { color: raw, token },
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
        if (typeof node.value === 'string') checkString(node, node.value);
      },
      TemplateLiteral(node) {
        node.quasis.forEach((q) => checkString(node, q.value.raw));
      },
    };
  },
};

export default rule;
