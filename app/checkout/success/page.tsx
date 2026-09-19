'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
import { useRegistry } from '@/lib/registry-store';

/**
 * Order confirmation.
 *
 * Deliberately sets expectations rather than just saying thank you — the
 * commonest post-purchase support email is "where is my order", and answering
 * it here prevents most of them. Shipping is 5–18 days on a dropship model, so
 * saying so up front avoids people thinking something has gone wrong.
 */
export default function SuccessPage() {
  const clear = useCart((s) => s.clear);
  const registryId = useRegistry((s) => s.registryId);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Only wipe the cart once — payment succeeded, so these items are bought.
    if (!cleared) {
      clear();
      setCleared(true);
    }
  }, [clear, cleared]);

  return (
    <section className="container-page py-16 sm:py-20">
      <div className="max-w-xl mx-auto text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center text-sage-600 text-2xl">
          ✓
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mt-6">
          Thank you, mama!
        </h1>
        <p className="text-ink-700 mt-3 leading-relaxed">
          Your payment went through and your order is confirmed. A receipt is on its
          way to your inbox.
        </p>
      </div>

      {/* What happens next — the questions people email about */}
      <div className="max-w-xl mx-auto mt-10 bg-white rounded-3xl border border-ink-900/6 p-6">
        <h2 className="font-display text-xl text-ink-900">What happens next</h2>
        <ol className="mt-4 space-y-4">
          {[
            {
              n: '1',
              title: 'Confirmation email',
              body: 'Arriving within a few minutes. Check your spam folder if you don’t see it.',
            },
            {
              n: '2',
              title: 'We prepare your order',
              body: 'Usually 1–3 business days while your items are picked and packed.',
            },
            {
              n: '3',
              title: 'Tracking link',
              body: 'We email tracking as soon as it ships. Delivery is typically 5–18 business days.',
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-blush-400 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-medium text-ink-900">{step.title}</p>
                <p className="text-sm text-ink-500 mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="max-w-xl mx-auto mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary px-7 py-3.5">Keep shopping</Link>
        {registryId ? (
          <Link href={`/registry/${registryId}`} className="btn-secondary px-7 py-3.5">
            View my registry
          </Link>
        ) : (
          <Link href="/gift-guide" className="btn-secondary px-7 py-3.5">
            Gift guide
          </Link>
        )}
      </div>

      <p className="text-center text-sm text-ink-500 mt-10">
        Questions about your order?{' '}
        <Link href="/contact" className="underline text-blush-500">Contact us</Link>{' '}
        — we reply within one business day.
      </p>
    </section>
  );
}
