/** Maps common color names (case-insensitive) to CSS values for swatch display. */
const COLOR_MAP: Record<string, string> = {
  black: '#1a1a1a',
  white: '#f8f8f8',
  'off-white': '#f5f0e8',
  'off white': '#f5f0e8',
  cream: '#fef3c7',
  ivory: '#fffff0',
  beige: '#e8d5b7',
  tan: '#d4a574',
  brown: '#8b4513',
  chocolate: '#7b3f00',
  red: '#ef4444',
  crimson: '#dc143c',
  burgundy: '#800020',
  maroon: '#800000',
  wine: '#722f37',
  pink: '#f9a8d4',
  'hot pink': '#ff69b4',
  rose: '#fb7185',
  blush: '#fecdd3',
  coral: '#ff6f61',
  salmon: '#fa8072',
  peach: '#ffb347',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  gold: '#d4a017',
  olive: '#6b7a3c',
  green: '#22c55e',
  sage: '#87a878',
  mint: '#3eb489',
  teal: '#14b8a6',
  turquoise: '#40e0d0',
  cyan: '#06b6d4',
  sky: '#38bdf8',
  'light blue': '#93c5fd',
  blue: '#3b82f6',
  navy: '#1e3a5f',
  cobalt: '#0047ab',
  'royal blue': '#4169e1',
  indigo: '#6366f1',
  purple: '#a855f7',
  violet: '#8b5cf6',
  lavender: '#c4b5fd',
  lilac: '#c8b2d8',
  plum: '#8b4c8c',
  gray: '#9ca3af',
  grey: '#9ca3af',
  'light gray': '#d1d5db',
  'light grey': '#d1d5db',
  charcoal: '#374151',
  silver: '#c0c0c0',
  taupe: '#b09080',
  mauve: '#c0808c',
  camel: '#c19a6b',
  khaki: '#c3b091',
  nude: '#f0d5b0',
  multicolor: '',
  multi: '',
  multicolour: '',
  mixed: '',
};

const RAINBOW = 'linear-gradient(135deg,#ef4444 0%,#f97316 20%,#eab308 40%,#22c55e 60%,#3b82f6 80%,#a855f7 100%)';

/**
 * Returns a CSS color string (hex or linear-gradient) for a color name,
 * or null if the name is not recognized.
 */
export function colorToCss(name: string): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (lower in COLOR_MAP) {
    return COLOR_MAP[lower] || RAINBOW;
  }
  return null;
}

/**
 * Returns inline style for a color swatch element.
 * If the color name resolves to a gradient, uses backgroundImage.
 * Falls back to a neutral gray if unrecognized.
 */
export function colorSwatchStyle(name: string): Record<string, string> {
  const css = colorToCss(name);
  if (!css) return { backgroundColor: '#e5e7eb' };
  if (css.startsWith('linear-gradient')) return { backgroundImage: css };
  return { backgroundColor: css };
}
