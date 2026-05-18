'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/lib/cart';

export default function SuccessPage() {
  const clear = useCart((s) => s.clear);
  useEffect(() => { clear(); }, [clear]);

  return (
    <section className="container-page py-20 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center text-sage-500 text-2xl">✓</div>
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mt-6">Thank you, mama!</h1>
      <p className="text-ink-700 mt-3 max-w-md mx-auto">
        Your order is confirmed. We&apos;ve sent a receipt to your inbox and we&apos;ll email you again
        when your package ships.
      </p>
      <Link href="/shop" className="btn-primary mt-8 inline-block">Keep shopping</Link>
    </section>
  );
}
