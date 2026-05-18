import { buildMetadata, SITE_URL } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact MamaCare — We\'d love to hear from you',
  description: 'Get in touch with the MamaCare team. We answer every message — usually within one business day.',
  path: '/contact'
});

export default function ContactPage({ searchParams }: { searchParams?: { sent?: string } }) {
  const sent = searchParams?.sent === '1';

  return (
    <article className="container-page py-12 sm:py-16 max-w-3xl">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">Say hello</h1>
      <p className="text-ink-700 mt-3">
        We answer every email — usually within one business day.
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
            <input
              name="name"
              required
              className="mt-1 w-full rounded-full border border-ink-900/10 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ink-700">Email *</span>
            <input
              name="email"
              required
              type="email"
              className="mt-1 w-full rounded-full border border-ink-900/10 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-ink-700">Subject</span>
          <input
            name="subject"
            className="mt-1 w-full rounded-full border border-ink-900/10 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200"
          />
        </label>
        <label className="block">
          <span className="text-sm text-ink-700">Message *</span>
          <textarea
            name="message"
            required
            rows={6}
            className="mt-1 w-full rounded-3xl border border-ink-900/10 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200"
          />
        </label>
        <button type="submit" className="btn-primary">Send message</button>
      </form>

      <p className="text-sm text-ink-500 mt-6">
        Or email us directly at{' '}
        <a href="mailto:mamaacaree@gmail.com" className="underline hover:text-blush-500">
          mamaacaree@gmail.com
        </a>.
      </p>
    </article>
  );
}
