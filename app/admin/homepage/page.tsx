import Link from 'next/link';
import { getAllConfig } from '@/lib/db';
import HomepageEditorForm from './HomepageEditorForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Homepage — Admin', robots: { index: false, follow: false } };

// Defaults that match what's hardcoded in app/page.tsx
const DEFAULTS = {
  hero_image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1400&q=80',
  hero_eyebrow: 'Lovingly made for every mama',
  hero_headline: 'Soft, supportive essentials for every season of motherhood.',
  hero_subhead: 'From bump to baby and beyond — discover thoughtfully curated baby gear, sleep, feeding, and nursery products designed to feel as good as they look.',
  hero_cta_text: 'Shop the collection',
  hero_cta_link: '/shop'
};

export default async function AdminHomepagePage() {
  const config = await getAllConfig();
  const current = {
    hero_image: config.hero_image || DEFAULTS.hero_image,
    hero_eyebrow: config.hero_eyebrow || DEFAULTS.hero_eyebrow,
    hero_headline: config.hero_headline || DEFAULTS.hero_headline,
    hero_subhead: config.hero_subhead || DEFAULTS.hero_subhead,
    hero_cta_text: config.hero_cta_text || DEFAULTS.hero_cta_text,
    hero_cta_link: config.hero_cta_link || DEFAULTS.hero_cta_link
  };

  return (
    <section className="container-page py-10 max-w-3xl">
      <nav className="text-sm text-ink-500 mb-4">
        <Link href="/admin" className="hover:text-blush-500">← Back to admin</Link>
      </nav>

      <h1 className="font-display text-4xl text-ink-900">Homepage</h1>
      <p className="text-ink-500 mt-2">
        Edit the hero photo, headline, and call-to-action shown at the top of your homepage.
        Changes go live within 30 seconds.
      </p>

      <HomepageEditorForm initial={current} defaults={DEFAULTS} />
    </section>
  );
}
