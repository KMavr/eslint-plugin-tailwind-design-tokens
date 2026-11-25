import type { Rule } from 'eslint';
import { isDefaultPaletteClass, splitClasses } from '../lib/tailwind';
import { makeAllowMatcher } from '../lib/allow';
import { visitStrings } from '../lib/visit';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow default Tailwind palette colors; use design-system tokens',
      url: 'https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/blob/main/docs/rules/no-default-palette.md',
    },
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
    const isAllowed = makeAllowMatcher(context.options[0]?.allow ?? []);

    const checkString = (node: Rule.Node, text: string) => {
      splitClasses(text).forEach(({ className: token }) => {
        const colorPart = isDefaultPaletteClass(token);
        if (colorPart && !isAllowed(colorPart) && !isAllowed(token)) {
          context.report({
            node,
            messageId: 'noDefaultPalette',
            data: { className: token, color: colorPart },
          });
        }
      });
    };

    return visitStrings(checkString);
  },
};

export default rule;
