import type { Product } from './types';

/**
 * Score a product for the homepage "Featured" spotlight.
 *
 * Formula: reviewsCount × rating × (1 + discountPct) × bestSellerBonus
 *
 * Higher = better candidate. The top scorer is rendered as the featured product.
 */
export function featuredScore(p: Product): number {
  const discountBoost =
    p.compareAtPrice && p.compareAtPrice > p.price
      ? (p.compareAtPrice - p.price) / p.compareAtPrice
      : 0;
  return p.reviewsCount * p.rating * (1 + discountBoost) * (p.bestSeller ? 1.15 : 1);
}
