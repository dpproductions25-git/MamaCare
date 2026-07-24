import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { posts, getPost, getAllPosts } from '@/lib/blog';
import { getProduct } from '@/lib/products';
import { buildMetadata, SITE_URL, SITE_NAME } from '@/lib/seo';

type Params = { params: { slug: string } };

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Params) {
  const post = getPost(params.slug);
  if (!post) return buildMetadata({ title: 'Post not found' });
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverImage
  });
}

export default function BlogPostPage({ params }: Params) {
  const post = getPost(params.slug);
  if (!post) return notFound();

  const related = (post.relatedProductSlugs || [])
    .map((s) => getProduct(s))
    .filter(Boolean);

  // Get other posts for "Read more" at the bottom
  const others = getAllPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [post.coverImage],
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` }
  };

  return (
    <article className="container-page py-10 sm:py-14">
      <nav className="text-sm text-ink-500 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blush-500">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-blush-500">Journal</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-900 line-clamp-1">{post.title}</span>
      </nav>

      <header className="max-w-3xl">
        <div className="flex items-center gap-2 text-xs text-ink-500 uppercase tracking-wider">
          <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>•</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mt-3 leading-tight">
          {post.title}
        </h1>
        <p className="text-lg text-ink-700 mt-4">{post.excerpt}</p>
      </header>

      <div className="relative aspect-[16/9] mt-8 rounded-4xl overflow-hidden bg-cream-100">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
      </div>

      <div
        className="prose-content max-w-3xl mt-10 text-ink-700"
        dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
      />

      {/* ─── Related products ─── */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-6">
            Featured in this article
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {related.map((p) => (
              <Link
                key={p!.id}
                href={`/products/${p!.slug}`}
                className="card hover:-translate-y-0.5 hover:shadow-soft transition-all overflow-hidden"
              >
                <div className="relative aspect-square bg-cream-100">
                  <Image src={p!.image} alt={p!.name} fill sizes="33vw" className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base text-ink-900 line-clamp-2">{p!.name}</h3>
                  <p className="text-sm text-ink-900 mt-2 font-medium">${p!.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Other posts ─── */}
      {others.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-6">Keep reading</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {others.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="card overflow-hidden hover:-translate-y-0.5 hover:shadow-soft transition-all"
              >
                <div className="relative aspect-[16/10] bg-cream-100">
                  <Image src={p.coverImage} alt={p.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <p className="text-xs text-ink-500">
                    {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <h3 className="font-display text-lg text-ink-900 mt-2 line-clamp-2">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Script
        id={`schema-post-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style>{`
        .prose-content h2 { font-family: Georgia, serif; font-size: 1.65rem; color: #2A2A33; margin-top: 2rem; margin-bottom: 0.75rem; }
        .prose-content p { margin: 1rem 0; line-height: 1.7; }
        .prose-content ul, .prose-content ol { margin: 1rem 0 1rem 1.25rem; }
        .prose-content li { margin: 0.4rem 0; line-height: 1.6; }
        .prose-content a { color: #D86A82; text-decoration: underline; }
        .prose-content a:hover { color: #E68197; }
        .prose-content strong { color: #2A2A33; font-weight: 600; }
      `}</style>
    </article>
  );
}
