import type { Rule } from 'eslint';

type StringCheck = (node: Rule.Node, value: string, isTemplate: boolean) => void;

export const visitStrings = (check: StringCheck): Rule.RuleListener => ({
  Literal(node) {
    if (typeof node.value === 'string') check(node, node.value, false);
  },
  TemplateLiteral(node) {
    node.quasis.forEach((q) => check(node, q.value.raw, true));
  },
});
