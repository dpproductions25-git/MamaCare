import Script from 'next/script';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'FAQ — Frequently Asked Questions',
  description: 'Answers to common questions about MamaCare orders, shipping, returns, and product care.',
  path: '/faq'
});

const faqs = [
  { q: 'How long does shipping take?', a: 'Most U.S. orders arrive in 5–9 business days. International: 8–18 business days.' },
  { q: 'Do you ship internationally?', a: 'Yes! We ship worldwide. Duties and taxes are calculated at checkout.' },
  { q: 'Can I return an item?', a: 'Yes — unworn items can be returned within 14 days of delivery. Health & safety items (used balms, opened bottle warmers) are final sale.' },
  { q: 'Does MamaCare manufacture its own products?', a: 'No. MamaCare is a curated dropshipping store. We source quality baby gear from trusted suppliers and ship it directly to you. We do not design, manufacture, or warehouse the products ourselves.' },
  { q: 'Are your products safe for babies?', a: 'Every product we list is reviewed for material safety and age-appropriate design. We avoid items that are not compliant with U.S. CPSC standards.' },
  { q: 'What payment methods do you accept?', a: 'Visa, Mastercard, Amex, Discover, Apple Pay, Google Pay (via Stripe), and PayPal.' },
  { q: 'What if my order arrives damaged?', a: 'Email us within 7 days with photos and we will replace it or refund you in full — including any return shipping cost.' }
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  return (
    <article className="container-page py-12 sm:py-16 max-w-3xl">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">FAQ</h1>
      <dl className="mt-8 divide-y divide-ink-900/10">
        {faqs.map((f) => (
          <div key={f.q} className="py-5">
            <dt className="font-display text-xl text-ink-900">{f.q}</dt>
            <dd className="text-ink-700 mt-2 leading-relaxed">{f.a}</dd>
          </div>
        ))}
      </dl>
      <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
