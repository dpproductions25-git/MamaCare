import { getShippingSettings, validateCoupon, DbCoupon } from './db-commerce';
import { findCoupon as findStaticCoupon } from './coupons';

/**
 * Authoritative, server-side order math.
 *
 * This is the ONLY function that should decide what a customer is charged.
 * The client-side calculateTotals() in lib/coupons.ts is a preview and can be
 * tampered with; everything here is recomputed from the database.
 */

export type ResolvedTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  /** Normalised code that was actually applied, or null */
  appliedCode: string | null;
  couponDescription: string | null;
  /** Set when a submitted code was rejected — safe to show the customer */
  couponError: string | null;
};

function discountFor(
  subtotal: number,
  type: string,
  value: number | null | undefined
): number {
  if (type === 'percent' && value) return +(subtotal * (Number(value) / 100)).toFixed(2);
  if (type === 'fixed' && value) return Math.min(Number(value), subtotal);
  return 0;
}

export async function resolveTotals(
  subtotal: number,
  couponCode?: string | null
): Promise<ResolvedTotals> {
  const settings = await getShippingSettings();

  let discount = 0;
  let shippingFree = false;
  let appliedCode: string | null = null;
  let couponDescription: string | null = null;
  let couponError: string | null = null;

  if (couponCode && couponCode.trim()) {
    let coupon: DbCoupon | null = null;

    // 1) Database coupons (admin-created + generated single-use codes)
    const check = await validateCoupon(couponCode, subtotal);
    if (check.ok) {
      coupon = check.coupon;
    } else {
      couponError = check.reason;
    }

    // 2) Fall back to the legacy hard-coded list in lib/coupons.ts so existing
    //    printed codes keep working after this migration.
    if (!coupon) {
      const legacy = findStaticCoupon(couponCode);
      if (legacy) {
        coupon = {
          code: legacy.code,
          type: legacy.type,
          value: legacy.value ?? null,
          description: legacy.description,
        } as DbCoupon;
        couponError = null;
      }
    }

    if (coupon) {
      appliedCode = coupon.code;
      couponDescription = coupon.description;
      if (coupon.type === 'free-shipping') shippingFree = true;
      else discount = discountFor(subtotal, coupon.type, coupon.value);
    }
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = shippingFree
    ? 0
    : afterDiscount >= settings.freeThreshold
      ? 0
      : settings.flatRate;

  const total = +(afterDiscount + shipping).toFixed(2);

  return {
    subtotal: +subtotal.toFixed(2),
    discount: +discount.toFixed(2),
    shipping: +shipping.toFixed(2),
    total,
    appliedCode,
    couponDescription,
    couponError,
  };
}
