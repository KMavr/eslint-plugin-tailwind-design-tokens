import type { Rule } from 'eslint';

type StringCheck = (node: Rule.Node, text: string, start: number) => void;

export const visitStrings = (check: StringCheck): Rule.RuleListener => ({
  Literal(node) {
    if (typeof node.value === 'string') check(node, node.raw!.slice(1, -1), node.range![0] + 1);
  },
  TemplateLiteral(node) {
    node.quasis.forEach((q) => check(node, q.value.raw, q.range![0] + 1));
  },
});
