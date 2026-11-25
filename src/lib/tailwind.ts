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
  'border-bs-',
  'border-be-',
  'inset-shadow-',
  'inset-ring-',
  'text-shadow-',
  'drop-shadow-',
  'scrollbar-thumb-',
  'scrollbar-track-',
  // Mask gradient stops: mask-linear-from-, mask-t-to-, ...
  ...['linear', 'radial', 'conic', 'x', 'y', 't', 'r', 'b', 'l'].flatMap((mask) => [
    `mask-${mask}-from-`,
    `mask-${mask}-to-`,
  ]),
];

// Default Tailwind palette color families
const DEFAULT_PALETTE = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'mauve',
  'olive',
  'mist',
  'taupe',
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
  const sanitized = className
    .slice(className.lastIndexOf(':') + 1)
    .replace(/^!/, '')
    .replace(/!$/, '')
    .replace(/\/.*$/, '');
  const colorPart = TAILWIND_COLOR_PREFIXES.filter((prefix) => sanitized.startsWith(prefix))
    .map((prefix) => sanitized.slice(prefix.length))
    .find((part) => PALETTE_SHADE_REGEX.test(part));

  return colorPart ?? null;
};

// Splits raw source text into classes. Escaped whitespace (\n, \t, ...) separates
// classes too, since the raw text holds the escape, not the whitespace itself.
const CLASS_REGEX = /\\[nrtfv]|((?:[^\s\\]|\\[^nrtfv])+)/g;

export const splitClasses = (text: string) =>
  [...text.matchAll(CLASS_REGEX)]
    .filter((m) => m[1])
    .map((m) => ({ className: m[1], index: m.index }));
