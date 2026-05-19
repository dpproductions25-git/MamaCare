import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Returns & Exchanges — 14-Day Policy',
  description: '14-day easy returns at MamaCare. Read our return policy and how to start a return.',
  path: '/returns'
});

export default function ReturnsPage() {
  return (
    <article className="container-page py-12 sm:py-16 max-w-3xl">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">Returns & Exchanges</h1>

      <div className="mt-6 space-y-5 text-ink-700 leading-relaxed">
        <p>
          We want every mama to love what arrives. If something isn't right, you have
          <strong> 14 days</strong> from the date of delivery to request a return.
        </p>

        <h2 className="font-display text-2xl text-ink-900 mt-8">Eligibility</h2>
        <p>To qualify for a return, items must be:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Unworn, unwashed, and in original packaging.</li>
          <li>Returned within 14 days of delivery.</li>
          <li>Accompanied by your order number.</li>
        </ul>

        <h2 className="font-display text-2xl text-ink-900 mt-8">Final-sale items</h2>
        <p>The following items cannot be returned for health and safety reasons:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Bottle warmers, brushes, and any product where the seal has been broken.</li>
          <li>Used personal-care products (balms, oils, vitamins).</li>
          <li>Items marked "Final Sale" at checkout.</li>
        </ul>

        <h2 className="font-display text-2xl text-ink-900 mt-8">How to start a return</h2>
        <p>
          Email us at <a className="underline text-blush-500" href="mailto:mamaacaree@gmail.com">mamaacaree@gmail.com</a>
          {' '}with your order number and the reason for the return. We'll send you a return
          address and instructions within 1 business day.
        </p>

        <h2 className="font-display text-2xl text-ink-900 mt-8">Refunds</h2>
        <p>
          Refunds are issued to your original payment method within 5 business days of
          us receiving the returned item. Shipping fees are non-refundable. Return
          shipping is the customer's responsibility unless the item arrived damaged or
          defective.
        </p>

        <h2 className="font-display text-2xl text-ink-900 mt-8">Damaged or defective items</h2>
        <p>
          If your item arrived damaged or defective, contact us within 7 days of delivery
          with photos and we'll replace it or refund you in full — including any return
          shipping cost.
        </p>
      </div>
    </article>
  );
}
