/**
 * Promo / discount code system.
 *
 * Add new codes to the COUPONS array below. Codes are case-insensitive on input
 * (stored uppercase). Types:
 *
 *   - 'free-shipping'    : free shipping regardless of cart total
 *   - 'percent'          : percent off subtotal (e.g. value=10 → 10% off)
 *   - 'fixed'            : fixed-dollar discount off subtotal (e.g. value=5 → $5 off)
 *
 * Standard shipping rule (when no coupon applied):
 *   subtotal >= $50  →  free
 *   subtotal <  $50  →  $6.99 flat
 */

export type CouponType = 'free-shipping' | 'percent' | 'fixed';

export type Coupon = {
  code: string;          // uppercase storage
  type: CouponType;
  value?: number;        // required for 'percent' / 'fixed'
  description: string;
  expiresAt?: string;    // ISO date; null/missing = no expiry
};

/**
 * Legacy hard-coded codes. These still work, but prefer creating codes in the
 * admin panel (/admin/marketing) — those support expiry, usage limits,
 * minimum order values and can be switched off without a deploy.
 */
export const COUPONS: Coupon[] = [
  {
    code: 'DAVID',
    type: 'free-shipping',
    description: 'Free shipping'
  },
  {
    // Safety net: the signup flow issues a unique single-use code per customer,
    // but falls back to this one if the database is briefly unreachable.
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    description: '10% off your first order'
  }
];

export function findCoupon(input?: string | null): Coupon | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase();
  const found = COUPONS.find((c) => c.code === normalized) || null;
  if (!found) return null;
  if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) return null;
  return found;
}

/**
 * Standard shipping when no coupon is applied.
 *
 * The threshold/rate are editable in the admin panel; pass the live settings in
 * where you have them. The defaults here match the original hard-coded rule and
 * are only used as a fallback when the DB is unreachable.
 */
export function baseShipping(
  subtotal: number,
  settings: { freeThreshold: number; flatRate: number } = { freeThreshold: 50, flatRate: 6.99 }
): number {
  return subtotal >= settings.freeThreshold ? 0 : settings.flatRate;
}

/** Final shipping after applying coupon. */
export function calculateShipping(
  subtotal: number,
  coupon: Coupon | null,
  settings?: { freeThreshold: number; flatRate: number }
): number {
  if (coupon?.type === 'free-shipping') return 0;
  return baseShipping(subtotal, settings);
}

/** Discount off subtotal after applying coupon. Returns dollars. */
export function calculateDiscount(subtotal: number, coupon: Coupon | null): number {
  if (!coupon) return 0;
  if (coupon.type === 'percent' && coupon.value) {
    return +(subtotal * (coupon.value / 100)).toFixed(2);
  }
  if (coupon.type === 'fixed' && coupon.value) {
    return Math.min(coupon.value, subtotal);
  }
  return 0;
}

/**
 * Convenience: full order math in one call.
 *
 * NOTE: this is the *client-side preview* only — it reads the hard-coded
 * COUPONS list and default shipping. The authoritative numbers are always
 * recomputed on the server via resolveTotals() in lib/pricing.ts before a
 * payment is created. Never rely on this for what a customer is charged.
 */
export function calculateTotals(
  subtotal: number,
  couponCode?: string | null,
  settings?: { freeThreshold: number; flatRate: number }
) {
  const coupon = findCoupon(couponCode);
  const discount = calculateDiscount(subtotal, coupon);
  const shipping = calculateShipping(subtotal - discount, coupon, settings);
  const total = +(subtotal - discount + shipping).toFixed(2);
  return { coupon, subtotal, discount, shipping, total };
}
