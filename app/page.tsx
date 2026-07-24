import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import FeaturedProduct from '@/components/FeaturedProduct';
import { featuredScore } from '@/lib/featured';
import { categories } from '@/lib/products';
import { getMergedProducts } from '@/lib/product-overrides';
import { getAllConfig } from '@/lib/db';
import { buildMetadata } from '@/lib/seo';

// Lifestyle photo for each category — swap URLs in admin or here to refresh the look
const CATEGORY_IMAGES: Record<string, string> = {
  gear:    'https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=800&q=80',
  baby:    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
  sleep:   'https://images.unsplash.com/photo-1566909914520-7ddbc01d4f12?auto=format&fit=crop&w=800&q=80',
  feeding: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80',
  nursery: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80',
  toys:    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
};

const TESTIMONIALS = [
  {
    quote: "The sleep sack is honestly the best thing we bought for our newborn. She went from waking every 45 minutes to sleeping 4-hour stretches. Worth every penny.",
    name: "Jessica M.",
    detail: "Mom of a 3-month-old"
  },
  {
    quote: "I was skeptical about ordering baby gear online but MamaCare had the best carrier I've tried. Arrived in 6 days and the quality is exactly as described.",
    name: "Priya L.",
    detail: "First-time mama, NYC"
  },
  {
    quote: "Ordered the bouncer and the diaper bag together. Both are incredible — and customer support answered my question on a Sunday evening. Genuinely impressed.",
    name: "Sarah K.",
    detail: "Mom of 2, Texas"
  }
];

export const revalidate = 30;

export const metadata = buildMetadata({
  title: 'MamaCare — Baby Gear & Everyday Essentials',
  description:
    'Thoughtfully curated baby gear, carriers, sleep, feeding, nursery, and toys for modern mamas. Soft materials, smart designs, and free U.S. shipping over $50.',
  path: '/'
});

const DEFAULTS = {
  hero_image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=2400&q=85',
  hero_eyebrow: 'Lovingly made for every mama',
  hero_headline: 'Soft, supportive essentials for every season of motherhood.',
  hero_subhead: 'From bump to baby and beyond — discover thoughtfully curated baby gear, sleep, feeding, and nursery products designed to feel as good as they look.',
  hero_cta_text: 'Shop the collection',
  hero_cta_link: '/shop'
};

export default async function HomePage({ searchParams }: { searchParams?: { subscribed?: string } }) {
  const subscribed = searchParams?.subscribed === '1';
  const [all, config] = await Promise.all([getMergedProducts(), getAllConfig()]);
  const bestSellers = all.filter((p) => p.bestSeller).slice(0, 8);

  // Pick the highest-scoring product for the featured spotlight.
  // Algorithm: reviewsCount × rating × (1 + discountPct) × bestSellerBonus
  // Exclude the test product.
  const featuredProduct = [...all]
    .filter((p) => p.id !== 'mc-test')
    .sort((a, b) => featuredScore(b) - featuredScore(a))[0];

  const hero = {
    image: config.hero_image || DEFAULTS.hero_image,
    eyebrow: config.hero_eyebrow || DEFAULTS.hero_eyebrow,
    headline: config.hero_headline || DEFAULTS.hero_headline,
    subhead: config.hero_subhead || DEFAULTS.hero_subhead,
    ctaText: config.hero_cta_text || DEFAULTS.hero_cta_text,
    ctaLink: config.hero_cta_link || DEFAULTS.hero_cta_link
  };

  return (
    <>
      {/* ── Full-bleed hero banner ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '88vh' }}>
        {/* Background image — full bleed, no border radius */}
        <Image
          src={hero.image}
          alt={hero.headline}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />

        {/* Left-to-right gradient — dark on left for text, fades out on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/5" />
        {/* Bottom vignette for depth + smooth page transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {/* Bottom fade into page background */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#FBF5EE] to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex items-center" style={{ minHeight: '88vh' }}>
          <div className="container-page py-24 lg:py-36">
            <div className="max-w-2xl">
              <p className="uppercase tracking-[0.22em] text-blush-300 text-xs font-semibold mb-5">
                {hero.eyebrow}
              </p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.25rem] text-white leading-[1.02] tracking-tight">
                {hero.headline}
              </h1>
              <p className="text-white/75 mt-6 max-w-lg text-lg leading-relaxed">
                {hero.subhead}
              </p>
              <div className="mt-10 flex flex-wrap gap-4 items-center">
                <Link href={hero.ctaLink} className="btn-primary text-base px-8 py-4">
                  {hero.ctaText}
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-white border border-white/40 hover:border-white hover:bg-white/10 rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-200"
                >
                  Our story
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-5 text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <span className="text-blush-300 text-base tracking-tight">★★★★★</span>
                  4.8 from 7,400+ mamas
                </span>
                <span className="w-px h-4 bg-white/25 hidden sm:block" />
                <span className="hidden sm:inline">Free U.S. shipping over $50</span>
                <span className="w-px h-4 bg-white/25 hidden sm:block" />
                <span className="hidden sm:inline">14-day returns</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Product Spotlight ── */}
      {featuredProduct && <FeaturedProduct product={featuredProduct} />}

      {/* ── Shop by need — photo grid ── */}
      <section className="container-page py-12 sm:py-16">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium mb-2">Collections</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Shop by need</h2>
          </div>
          <Link href="/shop" className="hidden sm:inline-flex btn-ghost">View all →</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className="group relative overflow-hidden rounded-3xl aspect-[3/4] block"
            >
              {/* Category lifestyle photo */}
              <Image
                src={CATEGORY_IMAGES[c.slug] ?? DEFAULTS.hero_image}
                alt={c.label}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Permanent gradient so text is always readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-black/0" />

              {/* Subtle blush tint on hover */}
              <div className="absolute inset-0 bg-blush-400/0 group-hover:bg-blush-400/12 transition-colors duration-400" />

              {/* Text block at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                {/* Category label — always visible */}
                <h3 className="font-display text-xl sm:text-2xl text-white leading-tight">
                  {c.label}
                </h3>

                {/* Description — slides up on hover */}
                <p className="text-white/70 text-sm mt-1.5 leading-relaxed line-clamp-2
                              translate-y-3 opacity-0
                              group-hover:translate-y-0 group-hover:opacity-100
                              transition-all duration-300 ease-out">
                  {c.description}
                </p>

                {/* "Shop now" CTA — slides up slightly after description */}
                <span className="inline-flex items-center gap-1.5 text-blush-300 text-sm font-semibold mt-2
                                translate-y-3 opacity-0
                                group-hover:translate-y-0 group-hover:opacity-100
                                transition-all duration-300 ease-out delay-75">
                  Shop now <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile "View all" link */}
        <div className="mt-6 text-center sm:hidden">
          <Link href="/shop" className="btn-ghost">View all categories →</Link>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Best sellers</h2>
            <p className="text-ink-500 mt-1">Mama-approved favorites.</p>
          </div>
          <Link href="/shop" className="btn-ghost">Shop all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-cream-100 mt-12">
        <div className="container-page py-14 grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-soft">🌿</div>
            <h3 className="font-display text-xl text-ink-900">Thoughtfully sourced</h3>
            <p className="text-ink-500 mt-2 max-w-xs mx-auto">Soft materials and tested, mama-approved picks.</p>
          </div>
          <div>
            <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-soft">🚚</div>
            <h3 className="font-display text-xl text-ink-900">Fast, free shipping</h3>
            <p className="text-ink-500 mt-2 max-w-xs mx-auto">Free U.S. shipping over $50. Worldwide delivery available.</p>
          </div>
          <div>
            <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-soft">💌</div>
            <h3 className="font-display text-xl text-ink-900">Care-first support</h3>
            <p className="text-ink-500 mt-2 max-w-xs mx-auto">Real humans (and mamas) ready to help — 7 days a week.</p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="container-page py-12 sm:py-16">
        <div className="text-center mb-10">
          <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium">What mamas are saying</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mt-2">Loved by 10,000+ families</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-7 flex flex-col gap-4">
              <div className="flex gap-0.5 text-blush-400 text-sm">
                {'★★★★★'}
              </div>
              <p className="text-ink-700 leading-relaxed flex-1">"{t.quote}"</p>
              <div>
                <p className="font-medium text-ink-900 text-sm">{t.name}</p>
                <p className="text-xs text-ink-500 mt-0.5">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="rounded-4xl bg-blush-50 p-8 sm:p-12 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Join the MamaCare circle</h2>
          {subscribed && (
            <div className="mt-4 inline-flex items-center gap-2 bg-sage-50 border border-sage-200 text-sage-600 text-sm font-medium px-5 py-3 rounded-full">
              <span>🎉</span> You&apos;re in! Check your inbox for your 10% off code.
            </div>
          )}
          <p className="text-ink-700 mt-2 max-w-xl mx-auto">
            Pregnancy & postpartum tips, early access to new arrivals, and 10% off your first order.
          </p>
          <form action="/api/subscribe" method="post" className={`mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto${subscribed ? ' hidden' : ''}`}>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input id="email" type="email" name="email" required placeholder="Your email address"
              className="flex-1 rounded-full px-5 py-3 bg-white border border-ink-900/10 focus:outline-none focus:ring-2 focus:ring-blush-300" />
            <button type="submit" className="btn-primary">Subscribe</button>
          </form>
        </div>
      </section>
    </>
  );
}
