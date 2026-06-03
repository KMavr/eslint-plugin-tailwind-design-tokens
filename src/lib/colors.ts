const HEX_REGEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/i;
const COLOR_FUNCTIONS = 'rgba?|hsla?|hwb|lab|lch|oklab|oklch';
const COLOR_FUNC_REGEX = new RegExp(`^(?:${COLOR_FUNCTIONS})\\(`, 'i');
const COLOR_SCAN = new RegExp(
  `#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\\b|(?:${COLOR_FUNCTIONS})\\([^)]*\\)`,
  'gi',
);

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
  if (!/[#(]/.test(text) || !/#|rgb|hsl|hwb|lab|lch|oklab|oklch/i.test(text)) {
    return [];
  }

  return [...text.matchAll(COLOR_SCAN)].flatMap((m) => {
    const normalized = normalizeColor(m[0]);
    return normalized ? [{ raw: m[0], normalized, index: m.index }] : [];
  });
};
