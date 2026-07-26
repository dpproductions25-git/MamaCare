import Link from 'next/link';
import Image from 'next/image';
import { getMergedProducts } from '@/lib/product-overrides';
import { getShippingSettings } from '@/lib/db-commerce';
import { shippingBlurb } from '@/lib/shipping-copy';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Baby Shower Gift Guide 2026 — MamaCare',
  description:
    'The best baby shower gifts for new mamas — curated by category, stage, and budget. Thoughtfully picked gear, sleep, feeding, and nursery essentials.',
  path: '/gift-guide',
});

export const revalidate = 60;

const SECTIONS = [
  {
    title: 'For the Newborn',
    subtitle: '0 – 3 months',
    emoji: '🌙',
    slugs: [
      'soft-fleece-baby-sleep-sack-head-support',
      'newborn-cotton-clothing-gift-set',
      'cotton-snap-bottom-baby-bodysuit',
      'quilted-baby-sleeping-bag-wrap',
    ],
  },
  {
    title: 'Gear They\'ll Actually Use',
    subtitle: 'For every outing',
    emoji: '🚗',
    slugs: [
      'folding-baby-bouncer-seat-light-gray',
      'ergonomic-3-in-1-baby-carrier-hip-seat',
      'mom-diaper-bag-with-folding-stool',
      'portable-baby-changing-pad-clutch',
    ],
  },
  {
    title: 'Feeding & Care Essentials',
    subtitle: 'Daily must-haves',
    emoji: '🍼',
    slugs: [
      'portable-baby-bottle-warmer-cooler',
      'silicone-baby-bottle-straw-brush-set',
      'portable-baby-changing-pad-clutch',
    ],
  },
  {
    title: 'Nursery Picks',
    subtitle: 'For baby\'s space',
    emoji: '🛏',
    slugs: [
      'smart-electric-rocking-bassinet-bedside',
    ],
  },
];

export default async function GiftGuidePage() {
  const all = await getMergedProducts();
  const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));
  const shipNote = shippingBlurb(await getShippingSettings());

  return (
    <>
      {/* Hero */}
      <section className="bg-blush-50 border-b border-blush-100">
        <div className="container-page py-16 sm:py-20 text-center max-w-2xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-blush-500 text-xs font-semibold mb-4">MamaCare Gift Guide</p>
          <h1 className="font-display text-4xl sm:text-5xl text-ink-900 leading-tight">
            Baby Shower Gifts <br className="hidden sm:block" />
            She'll Actually Love
          </h1>
          <p className="text-ink-600 mt-5 text-lg leading-relaxed">
            Skip the guesswork. Every pick here is mama-tested, thoughtfully curated, and ready to wrap. Filter by stage, category, or just pick your favourite.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-primary px-7 py-3.5">Shop all products</Link>
            <Link href="/blog/newborn-essentials-checklist" className="btn-secondary px-7 py-3.5">Full checklist →</Link>
          </div>
        </div>
      </section>

      {/* Tips bar */}
      <div className="bg-white border-b border-ink-900/5">
        <div className="container-page py-5 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-ink-600">
          <span className="flex items-center gap-2">🚚 {shipNote}</span>
          <span className="flex items-center gap-2">🎁 Gift-ready packaging available</span>
          <span className="flex items-center gap-2">↩ 14-day easy returns</span>
          <span className="flex items-center gap-2">🔒 Secure checkout</span>
        </div>
      </div>

      {/* Sections */}
      <div className="container-page py-14 sm:py-20 space-y-20">
        {SECTIONS.map((section) => {
          const products = section.slugs.map((s) => bySlug[s]).filter(Boolean);
          if (products.length === 0) return null;
          return (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl leading-none">{section.emoji}</span>
                <div>
                  <p className="text-xs uppercase tracking-widest text-blush-500 font-semibold">{section.subtitle}</p>
                  <h2 className="font-display text-2xl sm:text-3xl text-ink-900">{section.title}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group card overflow-hidden hover:-translate-y-0.5 hover:shadow-card transition-all duration-200"
                  >
                    <div className="relative aspect-square bg-cream-100 overflow-hidden">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {p.compareAtPrice && p.compareAtPrice > p.price && (
                        <div className="absolute top-2 left-2 bg-blush-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}% OFF
                        </div>
                      )}
                      {p.bestSeller && (
                        <div className="absolute top-2 right-2 bg-sage-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Best Seller
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-blush-500 uppercase tracking-widest font-medium mb-1">{p.category}</p>
                      <h3 className="text-sm font-medium text-ink-900 leading-snug line-clamp-2">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-display text-lg text-ink-900">${p.price.toFixed(2)}</span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="text-sm text-ink-400 line-through">${p.compareAtPrice.toFixed(2)}</span>
                        )}
                      </div>
                      {p.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-blush-400 text-xs">{'★'.repeat(Math.round(p.rating))}</span>
                          <span className="text-xs text-ink-400">({p.reviewsCount})</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <section className="bg-blush-50 border-t border-blush-100">
        <div className="container-page py-16 text-center max-w-xl mx-auto">
          <h2 className="font-display text-3xl text-ink-900">Need a registry?</h2>
          <p className="text-ink-600 mt-3 leading-relaxed">
            Add any MamaCare product to your Babylist registry in seconds — and share it with everyone who wants to celebrate your little one.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="https://www.babylist.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-7 py-3.5"
            >
              🍼 Create a Babylist Registry
            </a>
            <Link href="/shop" className="btn-secondary px-7 py-3.5">
              Browse all products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
