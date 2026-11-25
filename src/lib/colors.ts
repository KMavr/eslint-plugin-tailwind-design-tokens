const HEX_REGEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTIONS = 'rgba?|hsla?|hwb|lab|lch|oklab|oklch';
const COLOR_FUNC_REGEX = new RegExp(`^(?:${COLOR_FUNCTIONS})\\(`, 'i');
const COLOR_HINT = new RegExp(`#|${COLOR_FUNCTIONS}`, 'i');
const COLOR_SCAN = new RegExp(
  `#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\\b|(?:${COLOR_FUNCTIONS})\\([^)]*\\)`,
  'gi',
);
// Hex is only trusted inside an open Tailwind bracket or after a CSS `property:`.
const OPEN_BRACKET = /\[[^\s\]]*$/;
const CSS_DECLARATION = /(?:^|[;{\s])[a-z-]+\s*:[^;{}\n]*$/;

const isHexContext = (text: string, raw: string, index: number) => {
  const before = text.slice(0, index);
  return text.trim() === raw || OPEN_BRACKET.test(before) || CSS_DECLARATION.test(before);
};

export const normalizeColor = (raw: string): string | null => {
  if (HEX_REGEX.test(raw)) {
    const expanded =
      raw.length < 6 ? raw.toLowerCase().replace(/[0-9a-f]/gi, (c) => c + c) : raw.toLowerCase();
    return expanded.length === 9 && expanded.slice(7, 9) === 'ff' ? expanded.slice(0, 7) : expanded;
  }
  if (COLOR_FUNC_REGEX.test(raw)) {
    return raw
      .toLowerCase()
      .replace(/[_,\s]+/g, ' ')
      .trim();
  }
  return null;
};

export const findColors = (text: string) => {
  if (!COLOR_HINT.test(text)) {
    return [];
  }

  return [...text.matchAll(COLOR_SCAN)].flatMap((m) => {
    if (m[0].startsWith('#') && !isHexContext(text, m[0], m.index)) return [];
    const normalized = normalizeColor(m[0]);
    return normalized ? [{ raw: m[0], normalized, index: m.index }] : [];
  });
};
