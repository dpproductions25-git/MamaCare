/**
 * Master switch for showing star ratings and review counts anywhere — product
 * pages, the featured product, the gift guide, the "Top rated" sort, and the
 * aggregateRating in Google structured data.
 *
 * Off because the numbers currently stored (lib/products.ts and the admin
 * "Rating & reviews" fields) are not backed by real customer reviews, and
 * showing them can break Meta/Google ad and structured-data policies and
 * consumer-protection rules. Turn this on only once ratings come from real,
 * verifiable reviews.
 */
export const SHOW_PRODUCT_RATINGS: boolean = false;
