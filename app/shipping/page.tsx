import { buildMetadata } from '@/lib/seo';
import { getPageContent } from '@/lib/page-content';

export const revalidate = 30;

export async function generateMetadata() {
  const c = await getPageContent('shipping');
  return buildMetadata({ title: c.title, description: c.meta, path: '/shipping' });
}

export default async function ShippingPage() {
  const c = await getPageContent('shipping');
  return (
    <article className="container-page py-12 sm:py-16 max-w-3xl">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">{c.heading}</h1>
      <div className="prose-content mt-6 text-ink-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: c.body }} />
      <style>{`
        .prose-content h2 { font-family: Georgia, serif; font-size: 1.5rem; color: #2A2A33; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .prose-content p { margin: 0.75rem 0; }
        .prose-content ul, .prose-content ol { margin: 0.75rem 0 0.75rem 1.25rem; }
        .prose-content li { margin: 0.3rem 0; }
        .prose-content a { color: #D86A82; text-decoration: underline; }
        .prose-content strong { color: #2A2A33; font-weight: 600; }
        .prose-content .muted { color: #7A7A87; font-size: 0.875rem; }
      `}</style>
    </article>
  );
}
