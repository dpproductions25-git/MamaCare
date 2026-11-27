/**
 * Ties a PayPal order to the cart it was priced from.
 *
 * Capture is called by the shopper's browser, which also sends the item list
 * that gets saved and ordered from CJ. Without a check, someone could pay for a
 * cheap cart (or create their own $0.01 order in the browser) and have any
 * items shipped. So when the server creates the order it puts a keyed signature
 * of the items, amount and coupon in PayPal's `custom_id`, and capture refuses
 * anything that doesn't match — before money is taken.
 */
import { createHmac, timingSafeEqual } from 'crypto';

type SealedLine = { productId: string; qty: number; variantId?: string };

/** Order-independent, and ignores cart extras such as registry ids. */
function canonical(items: SealedLine[]): string[] {
  return items.map((i) => JSON.stringify([i.productId, i.variantId || '', i.qty])).sort();
}

function mac(items: SealedLine[], amount: string, coupon: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(JSON.stringify([canonical(items), Number(amount).toFixed(2), coupon]))
    .digest('hex');
}

/** The `custom_id` for a new order. PayPal allows 127 characters. */
export function sealPayPalOrder(
  items: SealedLine[],
  amount: string,
  coupon: string,
  secret: string
): string {
  if (!secret) throw new Error('PayPal is not configured.');
  return `v1.${mac(items, amount, coupon, secret)}.${coupon}`;
}

/**
 * Checks what the browser sent against the seal read back from PayPal. The
 * coupon comes out of the seal, so the browser can't swap or drop it.
 */
export function openPayPalSeal(
  customId: string | undefined,
  items: unknown,
  amount: string | undefined,
  secret: string
): { ok: true; coupon: string; items: SealedLine[] } | { ok: false } {
  const parts = /^v1\.([0-9a-f]{64})\.(.*)$/.exec(customId || '');
  if (!parts || !secret || !amount || !isCartLines(items)) return { ok: false };
  const [, given, coupon] = parts;
  const expected = mac(items, amount, coupon, secret);
  if (!timingSafeEqual(Buffer.from(given, 'hex'), Buffer.from(expected, 'hex'))) return { ok: false };
  return { ok: true, coupon, items };
}

export function isCartLines(items: unknown): items is SealedLine[] {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.every(
      (i: any) =>
        !!i &&
        typeof i.productId === 'string' &&
        Number.isInteger(i.qty) &&
        i.qty > 0 &&
        (i.variantId === undefined || i.variantId === null || typeof i.variantId === 'string')
    )
  );
}
