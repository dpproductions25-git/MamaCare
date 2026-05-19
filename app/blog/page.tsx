import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'The MamaCare Journal — Baby & Parenting Guides',
  description:
    'Honest baby-gear buying guides, newborn essentials, safe-sleep tips, and parenting reads from MamaCare. Updated weekly.',
  path: '/blog'
});

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <section className="container-page py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium">Journal</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mt-2">
          The MamaCare Journal
        </h1>
        <p className="text-ink-700 mt-3 text-lg">
          Buying guides, parenting reads, and product deep-dives — written for mamas, by mamas.
        </p>
      </header>

      <div className="mt-12 grid md:grid-cols-2 gap-8">
        {posts.map((p) => (
          <article key={p.slug} className="card overflow-hidden hover:-translate-y-0.5 hover:shadow-soft transition-all">
            <Link href={`/blog/${p.slug}`} className="block">
              <div className="relative aspect-[16/10] bg-cream-100">
                <Image
                  src={p.coverImage}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-ink-500">
                  <span>{new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>{p.readingMinutes} min read</span>
                </div>
                <h2 className="font-display text-2xl text-ink-900 mt-2 line-clamp-2">{p.title}</h2>
                <p className="text-ink-700 mt-2 line-clamp-3">{p.excerpt}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {p.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full bg-cream-100 text-ink-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
