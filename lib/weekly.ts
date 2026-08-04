import type { Product } from './types';
import { featuredScore } from './featured';

/**
 * Deterministic weekly product rotation.
 *
 * "Most loved this week" needs to feel fresh without anyone curating it, but it
 * must NOT be random per request — that would reshuffle on every page load and
 * between server renders, causing hydration mismatches and a jittery grid.
 *
 * Instead we seed a small PRNG with the ISO week number: every visitor sees the
 * same selection all week, and it changes automatically each Monday.
 */

/** ISO-8601 week key, e.g. "2026-W31". Weeks start Monday. */
export function isoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Thursday of the current week decides the year (ISO-8601 rule)
  const dayNum = d.getUTCDay() || 7; // Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Cheap string hash → 32-bit seed. */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — tiny, fast, deterministic PRNG. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pick this week's "most loved" products.
 *
 * Quality first, variety second: we take the strongest candidates by
 * featuredScore, then shuffle *within* that pool using the week seed. That way
 * the rotation never surfaces a weak product just for the sake of change, but
 * the line-up still moves every week.
 */
export function getWeeklyPicks(
  products: Product[],
  count = 8,
  weekKey = isoWeekKey()
): Product[] {
  const eligible = products.filter((p) => p.id !== 'mc-test' && p.inStock && p.image);
  if (eligible.length <= count) return eligible;

  // Candidate pool: roughly 2.5x what we need, so there's real variety to draw
  // from without dipping into the weakest half of the catalogue.
  const poolSize = Math.min(eligible.length, Math.max(count * 2, Math.ceil(count * 2.5)));
  const pool = [...eligible]
    .sort((a, b) => featuredScore(b) - featuredScore(a))
    .slice(0, poolSize);

  const rand = mulberry32(hashSeed(weekKey));
  const picked = seededShuffle(pool, rand).slice(0, count);

  // Present the chosen set best-first so the strongest product leads the grid
  return picked.sort((a, b) => featuredScore(b) - featuredScore(a));
}

/** "Aug 3 – Aug 9" — shown under the heading so the rotation feels intentional. */
export function currentWeekRange(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (x: Date) =>
    x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}
