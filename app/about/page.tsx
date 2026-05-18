import Image from 'next/image';
import { buildMetadata, SITE_URL } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About MamaCare — Made by Mamas, for Mamas',
  description:
    'MamaCare is a curated baby-gear store run by a small team of parents. Learn our story, our values, and contact us directly.',
  path: '/about'
});

export default function AboutPage({ searchParams }: { searchParams?: { sent?: string } }) {
  const sent = searchParams?.sent === '1';

  return (
    <article className="container-page py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium">Our story</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mt-2">
          Soft essentials for every season of motherhood.
        </h1>
        <p className="text-ink-700 mt-5 text-lg">
          MamaCare started with a simple thought after the birth of our first baby:
          there had to be a kinder way to shop for motherhood. So we built one.
        </p>
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
        <div className="text-ink-700 leading-relaxed space-y-5">
          <p>
            We curate every product with our own families in mind. Soft materials,
            thoughtful designs, and the kind of details that matter at 2 a.m. but no
            one mentions in product photos.
          </p>
          <p>
            MamaCare is a small, mama-run curated retailer. We source baby gear,
            sleep, feeding essentials, and toys from trusted suppliers and ship them
            directly to you.
          </p>
          <ul className="grid grid-cols-2 gap-4 mt-6">
            <li className="card p-5"><strong className="block text-ink-900">10,000+</strong><span className="text-ink-500 text-sm">happy mamas</span></li>
            <li className="card p-5"><strong className="block text-ink-900">4.8 ★</strong><span className="text-ink-500 text-sm">average rating</span></li>
            <li className="card p-5"><strong className="block text-ink-900">14 days</strong><span className="text-ink-500 text-sm">easy returns</span></li>
            <li className="card p-5"><strong className="block text-ink-900">Free</strong><span className="text-ink-500 text-sm">U.S. shipping over $50</span></li>
          </ul>
        </div>
      </div>

      {/* ─── Contact form ─── */}
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

        {/*
          The form posts directly to FormSubmit.co which forwards every submission
          to mamaacaree@gmail.com. No API key needed. The first time a submission
          is made, FormSubmit will email mamaacaree@gmail.com asking to verify
          ownership — click "Activate" once and every future form will email automatically.
        */}
        <form
          action="https://formsubmit.co/mamaacaree@gmail.com"
          method="POST"
          className="card p-6 mt-6 space-y-4"
        >
          {/* FormSubmit hidden config */}
          <input type="hidden" name="_subject" value="New MamaCare contact form message" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_next" value={`${SITE_URL}/about?sent=1#contact`} />
          {/* Honeypot — silently rejects bots */}
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
      </section>
    </article>
  );
}
