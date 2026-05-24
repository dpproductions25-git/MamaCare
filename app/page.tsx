import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import { categories } from '@/lib/products';
import { getMergedProducts } from '@/lib/product-overrides';
import { getAllConfig } from '@/lib/db';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 30;

export const metadata = buildMetadata({
  title: 'MamaCare — Baby Gear & Everyday Essentials',
  description:
    'Thoughtfully curated baby gear, carriers, sleep, feeding, nursery, and toys for modern mamas. Soft materials, smart designs, and free U.S. shipping over $50.',
  path: '/'
});

const DEFAULTS = {
  hero_image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1400&q=80',
  hero_eyebrow: 'Lovingly made for every mama',
  hero_headline: 'Soft, supportive essentials for every season of motherhood.',
  hero_subhead: 'From bump to baby and beyond — discover thoughtfully curated baby gear, sleep, feeding, and nursery products designed to feel as good as they look.',
  hero_cta_text: 'Shop the collection',
  hero_cta_link: '/shop'
};

export default async function HomePage() {
  const [all, config] = await Promise.all([getMergedProducts(), getAllConfig()]);
  const bestSellers = all.filter((p) => p.bestSeller).slice(0, 8);

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
      <section className="relative overflow-hidden">
        <div className="container-page py-14 sm:py-20 lg:py-28 grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-fadeUp">
            <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium">
              {hero.eyebrow}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] mt-4">
              {hero.headline}
            </h1>
            <p className="text-ink-700 mt-5 max-w-lg text-lg">
              {hero.subhead}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero.ctaLink} className="btn-primary">{hero.ctaText}</Link>
              <Link href="/about" className="btn-secondary">Our story</Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-ink-500">
              <span>★ 4.8 / 5 from 7,400+ mamas</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Free U.S. shipping over $50</span>
            </div>
          </div>

          <div className="relative aspect-[4/5] sm:aspect-[5/6] rounded-4xl overflow-hidden shadow-card animate-fadeUp">
            <Image
              src={hero.image}
              alt={hero.headline}
              fill priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-blush-50 blur-3xl opacity-70 -z-10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 w-[380px] h-[380px] rounded-full bg-sage-50 blur-3xl opacity-70 -z-10" />
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Shop by need</h2>
            <p className="text-ink-500 mt-1">Find what fits your stage.</p>
          </div>
          <Link href="/shop" className="hidden sm:inline-flex btn-ghost">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop/${c.slug}`} className="group card p-5 hover:-translate-y-0.5 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blush-50 flex items-center justify-center mb-3 group-hover:bg-blush-100 transition-colors">
                <span aria-hidden className="text-blush-500">♥</span>
              </div>
              <h3 className="font-display text-lg text-ink-900">{c.label}</h3>
              <p className="text-sm text-ink-500 mt-1 line-clamp-2">{c.description}</p>
            </Link>
          ))}
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

      <section className="container-page py-16">
        <div className="rounded-4xl bg-blush-50 p-8 sm:p-12 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Join the MamaCare circle</h2>
          <p className="text-ink-700 mt-2 max-w-xl mx-auto">
            Pregnancy & postpartum tips, early access to new arrivals, and 10% off your first order.
          </p>
          <form action="/api/subscribe" method="post" className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
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
