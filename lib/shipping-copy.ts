import type { ShippingSettings } from './db-commerce';

/**
 * Single source of truth for shipping wording shown across the storefront.
 *
 * These strings used to be hardcoded as "Free U.S. shipping over $50" in six
 * different files, so editing the threshold in admin changed the checkout math
 * but none of the copy customers actually read.
 */

const FALLBACK: ShippingSettings = { freeThreshold: 50, flatRate: 6.99 };

/** "Free U.S. shipping over $50" — or the right phrasing when it's always free. */
export function shippingBlurb(s: ShippingSettings = FALLBACK): string {
  if (s.flatRate <= 0) return 'Free U.S. shipping on every order';
  if (s.freeThreshold <= 0) return 'Free U.S. shipping';
  return `Free U.S. shipping over $${formatAmount(s.freeThreshold)}`;
}

/** Short form for badges: "Orders over $50" */
export function shippingSubLabel(s: ShippingSettings = FALLBACK): string {
  if (s.flatRate <= 0 || s.freeThreshold <= 0) return 'On every order';
  return `Orders over $${formatAmount(s.freeThreshold)}`;
}

/**
 * "Add $12.50 more for free shipping" — returns null when it doesn't apply,
 * so callers can render nothing.
 */
export function freeShippingNudge(
  subtotal: number,
  s: ShippingSettings = FALLBACK
): string | null {
  if (s.flatRate <= 0 || s.freeThreshold <= 0) return null;
  if (subtotal >= s.freeThreshold) return null;
  const remaining = s.freeThreshold - subtotal;
  return `Add $${remaining.toFixed(2)} more for free shipping`;
}

/** Drop trailing ".00" so we show "$50" not "$50.00", but keep "$49.50". */
function formatAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
