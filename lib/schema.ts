import { SITE_URL, SITE_NAME } from './seo';
import type { Product } from './types';
import type { ShippingSettings } from './db-commerce';

/**
 * Structured-data builders.
 *
 * Two audiences, same JSON-LD:
 *  - Google, for rich results (price, stock, shipping, returns, breadcrumbs)
 *  - AI assistants, which lean heavily on structured data when deciding what a
 *    page is about and whether to cite it.
 *
 * Google's merchant listing guidance treats shipping and return policy as the
 * fields most often missing. Supplying them is what unlocks the richer product
 * snippet rather than a plain blue link.
 */

/** Breadcrumbs — renders the trail in search results instead of a raw URL. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}

/** Full merchant-grade Product schema. */
export function productSchema(
  product: Product,
  shipping: ShippingSettings,
  opts: { returnDays?: number } = {}
) {
  const returnDays = opts.returnDays ?? 14;
  const inStock = product.inStock;

  // Google requires an explicit validity window; a year out is the convention
  // for catalogue pricing that has no scheduled end.
  const priceValidUntil = new Date(Date.now() + 365 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const freeOver = shipping.flatRate <= 0 ? 0 : shipping.freeThreshold;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.seoDescription?.trim() || product.shortDescription,
    image: product.images?.length ? product.images : [product.image],
    sku: product.id,
    mpn: product.cjProductId || product.id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    ...(product.reviewsCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewsCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: product.currency || 'USD',
      price: product.price.toFixed(2),
      priceValidUntil,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },

      // Shipping — surfaced directly in Google's product snippet
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: shipping.flatRate.toFixed(2),
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 5,
            maxValue: 18,
            unitCode: 'DAY',
          },
        },
        ...(freeOver > 0 && {
          shippingSettingsLink: `${SITE_URL}/shipping`,
        }),
      },

      // Return policy — the other field Google flags as commonly missing
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: returnDays,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        merchantReturnLink: `${SITE_URL}/returns`,
      },
    },
  };
}

/** Category / shop listing — tells crawlers this page is a curated collection. */
export function collectionSchema(opts: {
  name: string;
  description: string;
  path: string;
  products: Product[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: opts.products.length,
      itemListElement: opts.products.slice(0, 30).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/products/${p.slug}`,
        name: p.name,
      })),
    },
  };
}
