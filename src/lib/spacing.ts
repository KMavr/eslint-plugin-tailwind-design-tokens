const SIDES = ['', 'x', 'y', 't', 'r', 'b', 'l', 's', 'e'];

const SPACING_UTILITIES = [
  ...SIDES.map((side) => `p${side}`),
  ...SIDES.map((side) => `m${side}`),
  'gap',
  'gap-x',
  'gap-y',
  'space-x',
  'space-y',
  'w',
  'h',
  'size',
  'min-w',
  'min-h',
  'max-w',
  'max-h',
  'inset',
  'inset-x',
  'inset-y',
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
];

const UTILITY_ALTERNATION = SPACING_UTILITIES.join('|');

const ARBITRARY_SPACING_REGEX = new RegExp(`^(-)?(${UTILITY_ALTERNATION})-\\[(-)?([^\\]]+)\\]$`);

const LENGTH_REGEX = /^(\d*\.?\d+)(px|rem)$/;

export interface ArbitrarySpacing {
  prefix: string;
  negative: boolean;
  utility: string;
  value: string;
  suffix: string;
}

export const parseArbitrarySpacing = (className: string): ArbitrarySpacing | null => {
  const variantEnd = className.lastIndexOf(':') + 1;
  const rest = className.slice(variantEnd);
  const leading = rest.startsWith('!') ? '!' : '';
  const suffix = rest.endsWith('!') ? '!' : '';
  const match = rest
    .slice(leading.length, rest.length - suffix.length)
    .match(ARBITRARY_SPACING_REGEX);
  if (!match) return null;

  const [, leadingMinus, utility, innerMinus, value] = match;
  return {
    prefix: className.slice(0, variantEnd) + leading,
    negative: Boolean(leadingMinus || innerMinus),
    utility,
    value,
    suffix,
  };
};

export const toPx = (value: string, rootFontSize: number): number | null => {
  const match = value.match(LENGTH_REGEX);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2] === 'rem' ? amount * rootFontSize : amount;
};

export const toScaleStep = (px: number, basePx: number, increment = 0.25): string | null => {
  if (basePx <= 0) return null;
  const units = px / basePx / increment;
  const rounded = Math.round(units);
  return Math.abs(units - rounded) < 1e-9 ? String(rounded * increment) : null;
};
