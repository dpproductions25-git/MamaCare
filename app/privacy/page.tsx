import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'How MamaCare collects, uses, and protects your data.',
  path: '/privacy'
});

export default function PrivacyPage() {
  return (
    <article className="container-page py-12 sm:py-16 max-w-3xl">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">Privacy Policy</h1>
      <p className="text-sm text-ink-500 mt-2">Last updated: May 2026</p>

      <div className="mt-6 space-y-5 text-ink-700 leading-relaxed">
        <h2 className="font-display text-2xl text-ink-900 pt-4">What we collect</h2>
        <p>To fulfill your order we collect: your name, email, shipping address, phone (optional), and payment confirmation.</p>
        <p>Payments are processed by Stripe and PayPal — we never see or store your full card details.</p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">How we use it</h2>
        <p>To process orders, send tracking updates, and respond to support requests. We never sell your data to third parties.</p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">Email marketing</h2>
        <p>If you subscribe to our newsletter, we use your email to send occasional product updates. You can unsubscribe at any time using the link in any of our emails.</p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">Your rights</h2>
        <p>You can request access to your data, correction of inaccurate data, or deletion at any time by emailing us at <a className="underline text-blush-500" href="mailto:mamaacaree@gmail.com">mamaacaree@gmail.com</a>.</p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">Cookies</h2>
        <p>We use minimal cookies to keep your cart between sessions and (optionally) measure traffic via Google Analytics. No personally-identifiable data is collected by these cookies.</p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">Contact</h2>
        <p>Privacy questions? Email <a className="underline text-blush-500" href="mailto:mamaacaree@gmail.com">mamaacaree@gmail.com</a>.</p>
      </div>
    </article>
  );
}
