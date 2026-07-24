import { buildMetadata, SITE_URL } from '@/lib/seo';
import { getPageContent } from '@/lib/page-content';

export const revalidate = 30;

export async function generateMetadata() {
  const c = await getPageContent('contact');
  return buildMetadata({ title: c.title, description: c.meta, path: '/contact' });
}

export default async function ContactPage({ searchParams }: { searchParams?: { sent?: string } }) {
  const sent = searchParams?.sent === '1';
  const content = await getPageContent('contact');

  return (
    <article className="container-page py-12 sm:py-16 max-w-3xl">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">{content.heading}</h1>
      <div
        className="prose-content text-ink-700 mt-3"
        dangerouslySetInnerHTML={{ __html: content.body }}
      />

      {sent && (
        <div className="mt-6 card p-5 bg-sage-50 border border-sage-200">
          <p className="font-medium text-sage-500">Thank you — your message has been sent.</p>
          <p className="text-sm text-ink-700 mt-1">We&apos;ll be in touch within 1 business day.</p>
        </div>
      )}

      <form
        action="https://formsubmit.co/mamaacaree@gmail.com"
        method="POST"
        className="card p-6 mt-8 space-y-4"
      >
        <input type="hidden" name="_subject" value="New MamaCare contact form message" />
        <input type="hidden" name="_template" value="table" />
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_next" value={`${SITE_URL}/contact?sent=1`} />
        <input type="text" name="_honey" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-ink-700">Your name *</span>
            <input name="name" required className="mt-1 w-full rounded-full border border-ink-900/10 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200" />
          </label>
          <label className="block">
            <span className="text-sm text-ink-700">Email *</span>
            <input name="email" required type="email" className="mt-1 w-full rounded-full border border-ink-900/10 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200" />
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-ink-700">Subject</span>
          <input name="subject" className="mt-1 w-full rounded-full border border-ink-900/10 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200" />
        </label>
        <label className="block">
          <span className="text-sm text-ink-700">Message *</span>
          <textarea name="message" required rows={6} className="mt-1 w-full rounded-3xl border border-ink-900/10 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200" />
        </label>
        <button type="submit" className="btn-primary">Send message</button>
      </form>

      <p className="text-sm text-ink-500 mt-6">
        Or email us directly at{' '}
        <a href="mailto:mamaacaree@gmail.com" className="underline hover:text-blush-500">mamaacaree@gmail.com</a>.
      </p>

      <style>{`
        .prose-content p { margin: 0.5rem 0; line-height: 1.7; }
        .prose-content a { color: #D86A82; text-decoration: underline; }
        .prose-content strong { color: #2A2A33; font-weight: 600; }
      `}</style>
    </article>
  );
}
