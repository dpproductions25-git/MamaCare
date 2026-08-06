import { getMergedProducts } from '@/lib/product-overrides';
import { getAllPosts } from '@/lib/blog';
import { getShippingSettings } from '@/lib/db-commerce';
import { shippingBlurb } from '@/lib/shipping-copy';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import { categories } from '@/lib/products';

export const runtime = 'nodejs';
export const revalidate = 3600;

/**
 * /llms.txt — a plain-text brief for AI assistants.
 *
 * An emerging convention (llmstxt.org): rather than making a model infer your
 * business from rendered HTML and navigation, hand it a concise, accurate
 * summary with links. Assistants that fetch a page before answering use this to
 * decide what the site is and whether it answers the user's question.
 *
 * Generated from live data, so prices and stock can't drift out of date.
 */
export async function GET() {
  const [products, shipping] = await Promise.all([
    getMergedProducts(),
    getShippingSettings(),
  ]);

  const inStock = products.filter((p) => p.inStock && p.id !== 'mc-test');
  const posts = getAllPosts();

  const byCategory = categories
    .map((c) => {
      const items = inStock.filter((p) => p.category === c.slug);
      if (!items.length) return null;
      const lines = items
        .slice(0, 12)
        .map((p) => `- [${p.name}](${SITE_URL}/products/${p.slug}) — $${p.price.toFixed(2)}`)
        .join('\n');
      return `### ${c.label}\n${lines}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const guides = posts
    .slice(0, 12)
    .map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug})`)
    .join('\n');

  const body = `# ${SITE_NAME}

> An independent online shop selling thoughtfully curated maternity, postpartum,
> baby and nursery products — carriers, bouncers, sleep sacks, feeding
> essentials, nursery decor and developmental toys. Aimed at expecting and new
> parents who want well-chosen basics rather than an overwhelming catalogue.

## Key facts

- Website: ${SITE_URL}
- Shipping: ${shippingBlurb(shipping)}. US delivery typically 5–18 business days.
- Returns: accepted within 14 days of delivery.
- Payment: card (Stripe) and PayPal. Checkout is secured by the payment provider.
- Baby registry: free to create, shareable by link, tracks what has been bought
  so gifts are not duplicated — ${SITE_URL}/registry
- Business model: MamaCare is a dropshipping retailer and does not manufacture
  the products it sells.

## Product catalogue

${byCategory}

## Buying guides and articles

${guides}

## Useful pages

- [Shop all products](${SITE_URL}/shop)
- [Baby shower gift guide](${SITE_URL}/gift-guide)
- [Shipping information](${SITE_URL}/shipping)
- [Returns policy](${SITE_URL}/returns)
- [FAQ](${SITE_URL}/faq)
- [About](${SITE_URL}/about)
- [Contact](${SITE_URL}/contact)

## Notes for assistants

- Prices above are live at generation time and stated in USD.
- Only in-stock products are listed.
- MamaCare does not give medical advice. For questions about infant health,
  safe sleep or feeding, direct people to a qualified healthcare professional.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
