import type { Product } from './types';

/**
 * Black Friday sale — automatic, time-boxed, profit-guarded.
 *
 * HOW IT WORKS
 *  - Between `startsAt` and `endsAt` the listed products are priced at
 *    `pct`% off. The regular price becomes the struck-through "was" price, so
 *    the storefront shows Sale badges / % OFF with no other changes.
 *  - It is applied in getMergedProducts() (lib/product-overrides.ts), which is
 *    what the storefront, cart, Stripe and PayPal all read — so the price a
 *    customer sees is the price they are charged. The admin editor does NOT go
 *    through it, so saving a product never bakes the sale price into the data.
 *  - When the window closes the products go back to their regular price by
 *    themselves. Nothing to switch off.
 *
 * PROFIT GUARD
 *  A product only goes on sale if, at the sale price, you still keep at least
 *  MIN_PROFIT per order AFTER absorbing shipping, card fees, AND a 10% welcome
 *  coupon stacked on top. If a row ever fails that (wrong cost, too-deep
 *  discount) it is silently skipped and sells at the regular price, so a typo
 *  here can never put an item on sale at a loss.
 *
 * TO ADD A PRODUCT: add its id with its real CJ cost (use the HIGHEST variant
 * cost) and a discount. Check the cost in CJ, and CJ's shipping in
 * Admin → products → shipping lookup, before adding it.
 */

export const SALE = {
  name: 'Black Friday',
  // Eastern time (EST, UTC-5). Black Friday is Nov 27 2026, Cyber Monday Nov 30.
  startsAt: '2026-11-23T00:00:00-05:00',
  endsAt: '2026-11-30T23:59:59-05:00',
  bannerText: 'Black Friday Sale — up to 20% off nursing wear & baby clothing',
  bannerSubtext: 'Ends Cyber Monday',
  bannerHref: '/shop?sale=1'
} as const;

/** Assumptions used by the profit guard. Edit if your real numbers differ. */
export const MARGIN_ASSUMPTIONS = {
  /** Fallback only — each SALE_ITEMS row carries CJ's real shipping quote. */
  shippingAbsorbed: 6.5,
  /** Stripe: 2.9% + $0.30. (PayPal is a little higher; covered by MIN_PROFIT.) */
  feePct: 0.029,
  feeFixed: 0.3,
  /** Worst-case coupon stacked on the sale price (WELCOME10). */
  worstCouponPct: 10,
  /** Never sell below this profit per unit in the worst case. */
  minProfit: 4
};

type SaleItem = { pct: number; cost: number; ship: number; note: string };

/**
 * id → discount, verified CJ cost (highest variant) and CJ's real US shipping
 * quote (cheapest carrier delivering within 18 days), both read from CJ on
 * 2026-11-17. Re-check them if CJ prices change.
 */
export const SALE_ITEMS: Record<string, SaleItem> = {
  'custom-mw6wc6lm-09sdz': { pct: 20, cost: 3.93, ship: 6.32, note: 'Nursing bra — ultimate comfort' },
  'custom-mw6vs2m1-itn94': { pct: 20, cost: 2.82, ship: 6.67, note: 'Nursing bra — everyday comfort' },
  'custom-mw6w1bp7-x5sbd': { pct: 20, cost: 1.73, ship: 6.84, note: 'Premium nursing bra' },
  'custom-mw6uua1v-fcyox': { pct: 20, cost: 9.26, ship: 8.58, note: 'Hooded knitted baby jumpsuit' },
  'custom-mw6ui2qx-ogfg6': { pct: 15, cost: 6.97, ship: 9.18, note: 'Cotton baby romper' },
  'custom-mw6u68rq-uqxdv': { pct: 15, cost: 6.34, ship: 10.26, note: 'Baby rompers autumn/winter' }
};

const cents = (n: number) => Math.round(n * 100) / 100;

/** Profit on one unit at `price`, with the worst-case coupon applied. */
export function worstCaseProfit(price: number, cost: number, ship?: number): number {
  const m = MARGIN_ASSUMPTIONS;
  const paid = price * (1 - m.worstCouponPct / 100);
  return cents(
    paid * (1 - m.feePct) - m.feeFixed - cost - (ship ?? m.shippingAbsorbed)
  );
}

export function salePriceFor(regular: number, pct: number): number {
  return cents(regular * (1 - pct / 100));
}

export function isSaleActive(now: number = Date.now()): boolean {
  return now >= Date.parse(SALE.startsAt) && now <= Date.parse(SALE.endsAt);
}

/**
 * Returns the catalog with sale prices applied for products that are in the
 * sale, the window is open, and the profit guard passes. Otherwise unchanged.
 */
export function applySale(products: Product[], now: number = Date.now()): Product[] {
  if (!isSaleActive(now)) return products;

  return products.map((p) => {
    const item = SALE_ITEMS[p.id];
    if (!item) return p;

    const salePrice = salePriceFor(p.price, item.pct);
    // Profit guard — also checks any explicit variant prices.
    const variantPrices = (p.variants || [])
      .map((v) => v.price)
      .filter((x): x is number => typeof x === 'number');
    const allPrices = [salePrice, ...variantPrices.map((v) => salePriceFor(v, item.pct))];
    if (
      allPrices.some((pr) => worstCaseProfit(pr, item.cost, item.ship) < MARGIN_ASSUMPTIONS.minProfit)
    ) {
      return p;
    }

    return {
      ...p,
      price: salePrice,
      // The regular price is the real previous price, so the strike-through is honest.
      compareAtPrice: p.price,
      variants: p.variants?.map((v) =>
        typeof v.price === 'number' ? { ...v, price: salePriceFor(v.price, item.pct) } : v
      )
    };
  });
}
