import type { Product } from './types';

/**
 * Score a product for the homepage "Featured" spotlight.
 *
 * Formula: (1 + discountPct) × bestSellerBonus
 *
 * Ratings and review counts are deliberately not part of this: there are no
 * real customer reviews yet (see lib/reviews.ts), so including them would rank
 * products by invented numbers.
 *
 * Higher = better candidate. The top scorer is rendered as the featured product.
 */
export function featuredScore(p: Product): number {
  const discountBoost =
    p.compareAtPrice && p.compareAtPrice > p.price
      ? (p.compareAtPrice - p.price) / p.compareAtPrice
      : 0;
  return (1 + discountBoost) * (p.bestSeller ? 1.15 : 1);
}
