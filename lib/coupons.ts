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

export const COUPONS: Coupon[] = [
  {
    code: 'DAVID',
    type: 'free-shipping',
    description: 'Free shipping'
  }
  // Add more codes here, e.g.
  // { code: 'WELCOME10',  type: 'percent', value: 10, description: '10% off your order' },
  // { code: 'NEWBABY5',   type: 'fixed',   value: 5,  description: '$5 off' }
];

export function findCoupon(input?: string | null): Coupon | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase();
  const found = COUPONS.find((c) => c.code === normalized) || null;
  if (!found) return null;
  if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) return null;
  return found;
}

/** Standard shipping when no coupon is applied. */
export function baseShipping(subtotal: number): number {
  return subtotal >= 50 ? 0 : 6.99;
}

/** Final shipping after applying coupon. */
export function calculateShipping(subtotal: number, coupon: Coupon | null): number {
  if (coupon?.type === 'free-shipping') return 0;
  return baseShipping(subtotal);
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

/** Convenience: full order math in one call. */
export function calculateTotals(subtotal: number, couponCode?: string | null) {
  const coupon = findCoupon(couponCode);
  const discount = calculateDiscount(subtotal, coupon);
  const shipping = calculateShipping(subtotal - discount, coupon);
  const total = +(subtotal - discount + shipping).toFixed(2);
  return { coupon, subtotal, discount, shipping, total };
}
