import Link from 'next/link';
import { EDITABLE_PAGES, getPageContent } from '@/lib/page-content';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pages — Admin', robots: { index: false, follow: false } };

export default async function AdminPagesIndex() {
  const pages = await Promise.all(
    EDITABLE_PAGES.map(async (p) => ({ ...p, content: await getPageContent(p.id) }))
  );

  return (
    <section className="container-page py-10 max-w-4xl">
      <nav className="text-sm text-ink-500 mb-4">
        <Link href="/admin" className="hover:text-blush-500">← Back to admin</Link>
      </nav>

      <h1 className="font-display text-4xl text-ink-900">Pages</h1>
      <p className="text-ink-500 mt-2">
        Edit the content shown on each of your store&apos;s public pages — including
        SEO meta titles and descriptions. Changes go live within 30 seconds.
      </p>

      <ul className="mt-8 space-y-3">
        {pages.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/pages/${p.id}`}
              className="card p-5 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-soft transition-all"
            >
              <div className="min-w-0">
                <p className="font-display text-xl text-ink-900">{p.label}</p>
                <p className="text-sm text-ink-500 mt-1 line-clamp-1">{p.content.title}</p>
                {p.note && <p className="text-xs text-ink-500 mt-1 italic">{p.note}</p>}
              </div>
              <span className="text-blush-500 text-sm whitespace-nowrap">Edit →</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 card p-5 bg-cream-100">
        <p className="text-sm text-ink-700">
          <strong>Tip:</strong> the body field accepts HTML. Use tags like{' '}
          <code className="bg-white px-1 rounded">&lt;p&gt;</code>{' '}
          <code className="bg-white px-1 rounded">&lt;h2&gt;</code>{' '}
          <code className="bg-white px-1 rounded">&lt;ul&gt; &lt;li&gt;</code>{' '}
          <code className="bg-white px-1 rounded">&lt;a href=&quot;...&quot;&gt;</code>{' '}
          <code className="bg-white px-1 rounded">&lt;strong&gt;</code>.
          The page's heading and layout wrappers are added automatically.
        </p>
      </div>
    </section>
  );
}
