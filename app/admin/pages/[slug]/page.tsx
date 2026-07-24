import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EDITABLE_PAGES, getPageContent, DEFAULTS, PageId } from '@/lib/page-content';
import PageEditorForm from './PageEditorForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit page — Admin', robots: { index: false, follow: false } };

export default async function AdminPageEditor({ params }: { params: { slug: string } }) {
  const meta = EDITABLE_PAGES.find((p) => p.id === params.slug);
  if (!meta) return notFound();
  const id = meta.id as PageId;
  const current = await getPageContent(id);
  const defaults = DEFAULTS[id];

  return (
    <section className="container-page py-10 max-w-4xl">
      <nav className="text-sm text-ink-500 mb-4">
        <Link href="/admin" className="hover:text-blush-500">Admin</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/pages" className="hover:text-blush-500">Pages</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-900">{meta.label}</span>
      </nav>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-4xl text-ink-900">Edit: {meta.label}</h1>
        <a
          href={meta.path}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-sm py-2 px-4"
        >
          View live page ↗
        </a>
      </div>
      {meta.note && <p className="text-ink-500 mt-2 italic">{meta.note}</p>}

      <PageEditorForm
        slug={id}
        initial={current}
        defaults={defaults}
      />
    </section>
  );
}
