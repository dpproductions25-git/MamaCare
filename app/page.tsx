import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import FeaturedProduct from '@/components/FeaturedProduct';
import HeroSlideshow from '@/components/HeroSlideshow';
import TrustBar from '@/components/TrustBar';
import { buildHeroSlides, DEFAULT_HERO_IMAGE } from '@/lib/hero-slides';
import { getWeeklyPicks, currentWeekRange } from '@/lib/weekly';
import { featuredScore } from '@/lib/featured';
import { categories } from '@/lib/products';
import { getMergedProducts } from '@/lib/product-overrides';
import { getAllConfig } from '@/lib/db';
import { getShippingSettings } from '@/lib/db-commerce';
import { shippingBlurb, shippingSubLabel } from '@/lib/shipping-copy';
import { buildMetadata } from '@/lib/seo';


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
  // Same photograph as the About page — used as the hero and as the fallback
  // tile for any category without its own product image.
  hero_image: DEFAULT_HERO_IMAGE,
  hero_eyebrow: 'Lovingly made for every mama',
  hero_headline: 'Soft, supportive essentials for every season of motherhood.',
  hero_subhead: 'From bump to baby and beyond — discover thoughtfully curated baby gear, sleep, feeding, and nursery products designed to feel as good as they look.',
  hero_cta_text: 'Shop the collection',
  hero_cta_link: '/shop'
};

export default async function HomePage({ searchParams }: { searchParams?: { subscribed?: string } }) {
  const subscribed = searchParams?.subscribed === '1';
  const [all, config, shipping] = await Promise.all([
    getMergedProducts(),
    getAllConfig(),
    getShippingSettings(),
  ]);
  // "Most loved this week" — rotates automatically every Monday. Seeded by ISO
  // week, so every visitor sees the same line-up all week and it changes on its
  // own without anyone curating it.
  const weeklyPicks = getWeeklyPicks(all, 8);
  const weekRange = currentWeekRange();
  const shipNote = shippingBlurb(shipping);

  // Pick the highest-scoring product for the featured spotlight.
  // Algorithm: reviewsCount × rating × (1 + discountPct) × bestSellerBonus
  // Exclude the test product.
  const featuredProduct = [...all]
    .filter((p) => p.id !== 'mc-test')
    .sort((a, b) => featuredScore(b) - featuredScore(a))[0];

  // Pick the best product image per category (best seller first, then highest rating)
  const categoryHeroImages: Record<string, string> = {};
  for (const cat of categories) {
    const pick = all
      .filter((p) => p.category === cat.slug && p.id !== 'mc-test' && p.image)
      .sort((a, b) => {
        if (a.bestSeller && !b.bestSeller) return -1;
        if (!a.bestSeller && b.bestSeller) return 1;
        return b.rating - a.rating;
      })[0];
    if (pick) categoryHeroImages[cat.slug] = pick.image;
  }

  /**
   * Hero slides — admin overrides first, then curated lifestyle photography.
   * Product shots are no longer used as filler: catalogue images are cropped
   * tight on plain backgrounds and looked weak stretched across a full banner.
   */
  const heroSlides = buildHeroSlides([
    config.hero_image,
    config.hero_image_2,
    config.hero_image_3,
    config.hero_image_4,
  ]);

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
      {/* ── Full-bleed hero slideshow ── */}
      <HeroSlideshow images={heroSlides} alt={hero.headline}>
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
                <span className="hidden sm:inline">{shipNote}</span>
                <span className="w-px h-4 bg-white/25 hidden sm:block" />
                <span className="hidden sm:inline">14-day returns</span>
              </div>
            </div>
          </div>
      </HeroSlideshow>

      {/* ── Trust / Social-proof bar ── */}
      <TrustBar shippingLabel={shippingSubLabel(shipping)} />

      {/* ── Featured Product Spotlight ── */}
      {featuredProduct && <FeaturedProduct product={featuredProduct} shippingNote={shipNote} />}

      {/* ── Shop by age ── */}
      <section className="container-page py-12 sm:py-16">
        <div className="text-center mb-8">
          <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium mb-2">Curated for every stage</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Shop by age</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              stage: '0 – 3 months',
              label: 'Newborn',
              emoji: '🌙',
              desc: 'Sleep sacks, swaddles & soft essentials for your newest arrival.',
              href: '/shop/sleep',
              bg: 'bg-blush-50',
              border: 'border-blush-200',
              accent: 'text-blush-500',
            },
            {
              stage: '3 – 6 months',
              label: 'Baby',
              emoji: '🤸',
              desc: 'Carriers, bouncers & gear for curious, growing babies.',
              href: '/shop/gear',
              bg: 'bg-sage-50',
              border: 'border-sage-200',
              accent: 'text-sage-500',
            },
            {
              stage: '6 – 12 months',
              label: 'Explorer',
              emoji: '🍼',
              desc: 'Feeding essentials, clothing & nursery pieces for active babies.',
              href: '/shop/feeding',
              bg: 'bg-sky-50',
              border: 'border-sky-200',
              accent: 'text-sky-300',
            },
            {
              stage: '12 months +',
              label: 'Toddler',
              emoji: '🧸',
              desc: 'Imaginative toys and play gear to spark curiosity and learning.',
              href: '/shop/toys',
              bg: 'bg-sand-50',
              border: 'border-sand-200',
              accent: 'text-ink-500',
            },
          ].map((s) => (
            <Link
              key={s.stage}
              href={s.href}
              className={`group rounded-3xl border ${s.border} ${s.bg} p-6 flex flex-col gap-3 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200`}
            >
              <span className="text-3xl leading-none">{s.emoji}</span>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${s.accent}`}>{s.stage}</p>
                <h3 className="font-display text-xl text-ink-900 mt-0.5">{s.label}</h3>
              </div>
              <p className="text-sm text-ink-500 leading-relaxed flex-1">{s.desc}</p>
              <span className={`text-sm font-semibold ${s.accent} group-hover:gap-2 inline-flex items-center gap-1 transition-all`}>
                Shop now →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Shop by need — horizontal scroll carousel ── */}
      <section className="py-12 sm:py-16">
        {/* Header — inside normal container */}
        <div className="container-page flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium mb-2">Collections</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Shop by need</h2>
          </div>
          <Link href="/shop" className="btn-ghost hidden sm:inline-flex">View all →</Link>
        </div>

        {/* Scroll track — bleeds to edges on mobile, padded on desktop */}
        <div
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory
                     px-4 sm:px-6 lg:px-8
                     pb-4
                     [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className="group relative flex-none overflow-hidden rounded-3xl snap-start
                         w-[70vw] sm:w-[38vw] lg:w-[calc(16.6667%-14px)]"
              style={{ aspectRatio: '3/4' }}
            >
              {/* Photo */}
              <Image
                src={categoryHeroImages[c.slug] ?? DEFAULTS.hero_image}
                alt={c.label}
                fill
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 38vw, 17vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Gradient — covers full card, heaviest at bottom for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/10" />

              {/* Blush tint on hover */}
              <div className="absolute inset-0 bg-blush-500/0 group-hover:bg-blush-500/15 transition-colors duration-500" />

              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-display text-xl text-white leading-tight drop-shadow-sm">
                  {c.label}
                </h3>
                <p className="text-white/75 text-sm mt-1.5 leading-snug line-clamp-2
                              sm:translate-y-2 sm:opacity-0
                              sm:group-hover:translate-y-0 sm:group-hover:opacity-100
                              transition-all duration-300 ease-out">
                  {c.description}
                </p>
                <span className="inline-flex items-center gap-1 text-blush-300 text-sm font-semibold mt-2
                                sm:translate-y-2 sm:opacity-0
                                sm:group-hover:translate-y-0 sm:group-hover:opacity-100
                                transition-all duration-300 ease-out delay-75">
                  Shop now →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view-all */}
        <div className="mt-5 text-center sm:hidden">
          <Link href="/shop" className="btn-ghost">View all categories →</Link>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium mb-2">
              {weekRange}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Most loved this week</h2>
            <p className="text-ink-500 mt-1">A fresh edit of mama-approved favourites, every Monday.</p>
          </div>
          <Link href="/shop" className="btn-ghost">Shop all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {weeklyPicks.map((p) => (
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
            <p className="text-ink-500 mt-2 max-w-xs mx-auto">{shipNote}. Worldwide delivery available.</p>
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
