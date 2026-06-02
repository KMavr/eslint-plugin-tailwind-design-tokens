const HEX_REGEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/i;
const RGB_HSL_REGEX = /(?:rgb|hsl)a?\(/i;
const OKLCH_REGEX = /oklch\(/i;
const COLOR_SCAN =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|(?:rgb|hsl)a?\([^)]*\)|oklch\([^)]*\)/gi;

export const normalizeColor = (raw: string): string | null => {
  if (HEX_REGEX.test(raw)) {
    const expanded =
      raw.length < 6 ? raw.toLowerCase().replace(/[0-9a-f]/gi, (c) => c + c) : raw.toLowerCase();
    return expanded.length === 9 && expanded.slice(7, 9) === 'ff' ? expanded.slice(0, 7) : expanded;
  }
  if (RGB_HSL_REGEX.test(raw) || OKLCH_REGEX.test(raw)) {
    return raw
      .toLowerCase()
      .replace(/[_,\s]+/g, ' ')
      .trim();
  }
  return null;
};

export const findColors = (text: string) => {
  if (!/[#(]/.test(text) || !/#|rgb|hsl|oklch/i.test(text)) {
    return [];
  }

  return [...text.matchAll(COLOR_SCAN)].flatMap((m) => {
    const normalized = normalizeColor(m[0]);
    return normalized ? [{ raw: m[0], normalized, index: m.index }] : [];
  });
};
