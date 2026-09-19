import Link from 'next/link';
import { categories } from '@/lib/products';
import { getMergedProducts } from '@/lib/product-overrides';
import { featuredScore } from '@/lib/featured';
import ProductCard from '@/components/ProductCard';

export const metadata = {
  title: 'Page not found',
  description: 'That page doesn’t exist — browse our baby gear, sleep, feeding and nursery essentials instead.',
  // A 404 must never be indexed; otherwise Google can surface it for real queries
  robots: { index: false, follow: true },
};

/**
 * 404 as a recovery page rather than a dead end.
 *
 * The previous version offered a single "Back home" link, which asks the
 * visitor to start their search over. Most people who hit a 404 on a shop
 * arrived from a stale link or a mistyped URL and still want to buy something —
 * so this gives them somewhere to go: categories, and a few real products.
 */
export default async function NotFound() {
  let picks: Awaited<ReturnType<typeof getMergedProducts>> = [];
  try {
    const all = await getMergedProducts();
    picks = [...all]
      .filter((p) => p.id !== 'mc-test' && p.inStock)
      .sort((a, b) => featuredScore(b) - featuredScore(a))
      .slice(0, 4);
  } catch {
    // Database unavailable — the page still renders without recommendations
  }

  return (
    <section className="container-page py-16 sm:py-24">
      <div className="text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-blush-50 flex items-center justify-center text-3xl mx-auto">
          🧸
        </div>
        <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium mt-6">
          Error 404
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mt-2">
          We couldn&apos;t find that page
        </h1>
        <p className="text-ink-600 mt-4 leading-relaxed">
          The link may be out of date, or the page may have moved. Everything else
          is still here — try one of these.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary px-7 py-3.5">Shop all products</Link>
          <Link href="/gift-guide" className="btn-secondary px-7 py-3.5">Gift guide</Link>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-14">
        <h2 className="font-display text-xl text-ink-900 text-center">Browse by category</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className="px-4 py-2 rounded-full border border-ink-900/12 text-sm text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {picks.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl text-ink-900 text-center mb-6">
            Popular right now
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-sm text-ink-500 mt-14">
        Still stuck?{' '}
        <Link href="/contact" className="underline text-blush-500">Get in touch</Link>{' '}
        and we&apos;ll help you find it.
      </p>
    </section>
  );
}
