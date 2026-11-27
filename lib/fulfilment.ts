/**
 * Turning a paid order into CJ order lines. Shared by the Stripe webhook and
 * PayPal capture so both ship the same thing.
 *
 * The rule: send the exact variant the shopper chose. If that can't be known
 * for certain, send nothing for that line and tell the owner — shipping a
 * guessed size or colour costs a wrong parcel, a return and a refund.
 */
import type { Product } from './types';

export type OrderLine = { productId: string; qty: number; variantId?: string };
export type CjLine = { vid: string; quantity: number };
export type PlannedLine = { productId: string; name: string; qty: number; variant?: string };
export type ManualLine = PlannedLine & { reason: string };

/**
 * Variant ids this site makes up itself: `mc-…` (code catalog), `custom-…`
 * (added by hand in admin) and `v-…` (CJ import that returned no id). CJ knows
 * none of them.
 */
const PLACEHOLDER_VID = /^(mc-|custom-|v-)/i;

export function isCjVariantId(vid?: string | null): vid is string {
  return !!vid && !!vid.trim() && !PLACEHOLDER_VID.test(vid.trim());
}

/** `planned` describes `cjItems` line for line, for messages to the owner. */
export function planCjFulfilment(
  lines: OrderLine[],
  catalog: Product[]
): { cjItems: CjLine[]; planned: PlannedLine[]; manual: ManualLine[] } {
  const cjItems: CjLine[] = [];
  const planned: PlannedLine[] = [];
  const manual: ManualLine[] = [];

  for (const line of lines) {
    const product = catalog.find((p) => p.id === line.productId);
    const variants = product?.variants ?? [];
    const chosen = line.variantId ? variants.find((v) => v.vid === line.variantId) : undefined;
    const described: PlannedLine = {
      productId: line.productId,
      name: product?.name ?? line.productId,
      qty: line.qty,
      variant: chosen?.name || line.variantId,
    };
    const send = (vid: string) => {
      cjItems.push({ vid: vid.trim(), quantity: line.qty });
      planned.push(described);
    };
    const hold = (reason: string) => manual.push({ ...described, reason });

    if (!product) {
      hold('Product could not be found in the catalog.');
    } else if (line.variantId) {
      if (isCjVariantId(line.variantId)) send(line.variantId);
      // With only one option there is nothing to get wrong.
      else if (variants.length <= 1 && isCjVariantId(product.cjVariantId)) send(product.cjVariantId);
      else hold('The chosen size/colour has no CJ variant ID.');
    } else if (variants.length > 1) {
      hold('This product has options but the order does not record which one was chosen.');
    } else if (isCjVariantId(variants[0]?.vid)) {
      send(variants[0].vid);
    } else if (isCjVariantId(product.cjVariantId)) {
      send(product.cjVariantId);
    } else {
      hold('This product has no CJ variant ID.');
    }
  }

  return { cjItems, planned, manual };
}

/** Stripe caps each metadata value at 500 characters. */
const CHUNK = 490;

/**
 * The order lines as Stripe session metadata, split across as many keys as
 * needed. Cutting the JSON off at one value's limit (as this used to) made
 * larger carts unreadable after payment.
 */
export function encodeProductSnapshot(items: OrderLine[]): Record<string, string> {
  const json = JSON.stringify(
    items.map((i) => ({
      productId: i.productId,
      qty: i.qty,
      ...(i.variantId ? { variantId: i.variantId } : {}),
    }))
  );
  const out: Record<string, string> = {};
  for (let n = 0; n * CHUNK < json.length; n++) {
    out[n === 0 ? 'productSnapshot' : `productSnapshot_${n}`] = json.slice(n * CHUNK, (n + 1) * CHUNK);
  }
  return out;
}

/** Throws if the stored list is damaged. */
export function decodeProductSnapshot(
  metadata: Record<string, string> | null | undefined
): OrderLine[] {
  let json = metadata?.productSnapshot || '';
  for (let n = 1; metadata?.[`productSnapshot_${n}`]; n++) json += metadata[`productSnapshot_${n}`];
  return JSON.parse(json || '[]');
}
