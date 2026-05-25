import Image from 'next/image';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { getPageContent } from '@/lib/page-content';

export const revalidate = 30;

export async function generateMetadata() {
  const c = await getPageContent('about');
  return buildMetadata({ title: c.title, description: c.meta, path: '/about' });
}

export default async function AboutPage({ searchParams }: { searchParams?: { sent?: string } }) {
  const sent = searchParams?.sent === '1';
  const content = await getPageContent('about');

  return (
    <article className="container-page py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium">Our story</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mt-2">{content.heading}</h1>
      </header>

      <div className="mt-10 grid lg:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/5] rounded-4xl overflow-hidden shadow-card">
          <Image
            src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80"
            alt="A new family"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div
          className="prose-content text-ink-700 leading-relaxed space-y-5"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      </div>

      {/* Contact form */}
      <section id="contact" className="mt-20 max-w-3xl scroll-mt-24">
        <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium">Get in touch</p>
        <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mt-2">Say hello</h2>
        <p className="text-ink-700 mt-3 max-w-xl">
          Questions, feedback, or a thoughtful suggestion? We answer every email,
          usually within one business day.
        </p>

        {sent && (
          <div className="mt-6 card p-5 bg-sage-50 border border-sage-200">
            <p className="font-medium text-sage-500">Thank you — your message has been sent.</p>
            <p className="text-sm text-ink-700 mt-1">We&apos;ll be in touch within 1 business day.</p>
          </div>
        )}

        <form
          action="https://formsubmit.co/mamaacaree@gmail.com"
          method="POST"
          className="card p-6 mt-6 space-y-4"
        >
          <input type="hidden" name="_subject" value="New MamaCare contact form message" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_next" value={`${SITE_URL}/about?sent=1#contact`} />
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
      </section>

      <style>{`
        .prose-content h2 { font-family: Georgia, serif; font-size: 1.5rem; color: #2A2A33; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .prose-content h3 { font-family: Georgia, serif; font-size: 1.25rem; color: #2A2A33; margin-top: 1rem; margin-bottom: 0.4rem; }
        .prose-content p { margin: 0.75rem 0; line-height: 1.7; }
        .prose-content ul, .prose-content ol { margin: 0.75rem 0 0.75rem 1.25rem; }
        .prose-content li { margin: 0.3rem 0; line-height: 1.6; }
        .prose-content a { color: #D86A82; text-decoration: underline; }
        .prose-content strong { color: #2A2A33; font-weight: 600; }
        .prose-content .muted { color: #7A7A87; font-size: 0.875rem; }
        .prose-content .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; list-style: none; margin-left: 0; padding-left: 0; }
        .prose-content .stats li { background: white; border-radius: 1.5rem; padding: 1rem; box-shadow: 0 8px 30px -12px rgba(42,42,51,0.12); }
        .prose-content .stats li strong { display: block; font-size: 1.1rem; }
      `}</style>
    </article>
  );
}
