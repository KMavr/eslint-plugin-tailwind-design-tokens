import type { Rule } from 'eslint';
import { isDefaultPaletteClass } from '../lib/tailwind';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow default Tailwind palette colors; use design-system tokens' },
    messages: {
      noDefaultPalette:
        'Avoid default Tailwind color "{{ className }}" ({{ color }}). Use a design-system token instead.',
    },
    schema: [
      {
        type: 'object',
        properties: { allow: { type: 'array', items: { type: 'string' } } },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const allow = new Set(context.options[0]?.allow ?? []);

    const checkString = (node: Rule.Node, value: string) => {
      const tokens = value.split(' ');

      tokens.forEach((token) => {
        const colorPart = isDefaultPaletteClass(token);
        if (colorPart && !allow.has(colorPart) && !allow.has(token)) {
          context.report({
            node,
            messageId: 'noDefaultPalette',
            data: { className: token, color: colorPart },
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
