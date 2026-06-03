const TAILWIND_COLOR_PREFIXES = [
  'text-',
  'bg-',
  'border-',
  'border-l-',
  'border-r-',
  'border-t-',
  'border-b-',
  'border-x-',
  'border-y-',
  'border-s-',
  'border-e-',
  'ring-',
  'outline-',
  'fill-',
  'stroke-',
  'shadow-',
  'accent-',
  'decoration-',
  'divide-',
  'from-',
  'to-',
  'via-',
  'placeholder-',
  'caret-',
  'ring-offset-',
];

// Default Tailwind palette color families
const DEFAULT_PALETTE = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];

// Matches default palette usage like "red-50", "gray-400", "blue-950"
const PALETTE_SHADE_REGEX = new RegExp(`^(${DEFAULT_PALETTE.join('|')})-(50|[1-9]00|950)$`);

export const isDefaultPaletteClass = (className: string): string | null => {
  const sanitized = className.replace(/^!/, '').replace(/!$/, '').replace(/\/.*$/, '');
  const colorPart = TAILWIND_COLOR_PREFIXES.filter((prefix) => sanitized.startsWith(prefix))
    .map((prefix) => sanitized.slice(prefix.length))
    .find((part) => PALETTE_SHADE_REGEX.test(part));

  return colorPart ?? null;
};
