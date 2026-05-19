'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
import { products } from '@/lib/products';
import { calculateTotals, findCoupon } from '@/lib/coupons';

export default function CartPage() {
  const { items, couponCode, setQty, remove, subtotal, applyCoupon, removeCoupon } = useCart();
  const [mounted, setMounted] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <section className="container-page py-16">
        <h1 className="font-display text-4xl text-ink-900">Your cart</h1>
        <p className="text-ink-500 mt-4">Loading…</p>
      </section>
    );
  }

  const lines = items
    .map((i) => ({
      item: i,
      product: products.find((p) => p.id === i.productId),
      variant: undefined as any
    }))
    .filter((l) => l.product);
  lines.forEach((l) => {
    if (l.item.variantId) l.variant = l.product!.variants?.find((v) => v.vid === l.item.variantId);
  });

  if (lines.length === 0) {
    return (
      <section className="container-page py-16 text-center">
        <h1 className="font-display text-4xl text-ink-900">Your cart is empty</h1>
        <p className="text-ink-500 mt-3">Let&apos;s find something lovely.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-block">Continue shopping</Link>
      </section>
    );
  }

  const sub = subtotal();
  const { coupon, discount, shipping, total } = calculateTotals(sub, couponCode);

  function handleApplyCoupon() {
    setCodeError(null);
    const found = findCoupon(codeInput);
    if (!found) {
      setCodeError('Invalid or expired code.');
      return;
    }
    applyCoupon(codeInput);
    setCodeInput('');
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">Your cart</h1>

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <ul className="lg:col-span-2 space-y-4">
          {lines.map(({ item, product, variant }) => {
            const linePrice = variant?.price ?? product!.price;
            const lineImage = variant?.image ?? product!.image;
            return (
              <li key={`${item.productId}-${item.variantId || ''}`} className="card flex gap-4 p-4 sm:p-5 items-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-cream-100 shrink-0">
                  <Image src={lineImage} alt={product!.name} fill sizes="100px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product!.slug}`} className="font-display text-lg text-ink-900 hover:text-blush-500 line-clamp-2">
                    {product!.name}
                  </Link>
                  {variant && <p className="text-xs text-ink-500 mt-0.5">{variant.name}</p>}
                  <p className="text-sm text-ink-500 mt-1">${linePrice.toFixed(2)}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="inline-flex items-center bg-white border border-ink-900/10 rounded-full">
                      <button aria-label="Decrease" onClick={() => setQty(item.productId, item.qty - 1, item.variantId)} className="w-8 h-8 hover:text-blush-500">−</button>
                      <span className="w-8 text-center text-sm">{item.qty}</span>
                      <button aria-label="Increase" onClick={() => setQty(item.productId, item.qty + 1, item.variantId)} className="w-8 h-8 hover:text-blush-500">+</button>
                    </div>
                    <button onClick={() => remove(item.productId, item.variantId)} className="text-sm text-ink-500 hover:text-blush-500">Remove</button>
                  </div>
                </div>
                <div className="font-medium text-ink-900 whitespace-nowrap">
                  ${(linePrice * item.qty).toFixed(2)}
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-2xl text-ink-900">Summary</h2>

          {/* Promo code input */}
          <div className="mt-4">
            {!coupon ? (
              <>
                <label className="text-xs text-ink-500 uppercase tracking-wide">Promo code</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                    className="flex-1 rounded-full bg-white border border-ink-900/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blush-200"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-full bg-ink-900 text-white text-sm hover:bg-ink-700"
                  >
                    Apply
                  </button>
                </div>
                {codeError && <p className="text-xs text-blush-500 mt-1">{codeError}</p>}
              </>
            ) : (
              <div className="flex items-center justify-between bg-sage-50 border border-sage-200 rounded-2xl px-3 py-2">
                <span className="text-sm text-sage-500">
                  <strong>{coupon.code}</strong> applied — {coupon.description.toLowerCase()}
                </span>
                <button
                  type="button"
                  onClick={() => removeCoupon()}
                  className="text-xs text-ink-500 hover:text-blush-500"
                  aria-label="Remove coupon"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>${sub.toFixed(2)}</dd></div>
            {discount > 0 && (
              <div className="flex justify-between text-sage-500">
                <dt>Discount</dt>
                <dd>− ${discount.toFixed(2)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{shipping === 0 ? <span className="text-sage-500">Free</span> : `$${shipping.toFixed(2)}`}</dd>
            </div>
            <div className="flex justify-between text-base text-ink-900 font-medium pt-2 border-t border-ink-900/10">
              <dt>Total</dt><dd>${total.toFixed(2)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="btn-primary w-full mt-6">Checkout</Link>
          <Link href="/shop" className="btn-ghost w-full mt-2">Continue shopping</Link>
          <p className="text-xs text-ink-500 mt-4">Secure checkout via Stripe &amp; PayPal.</p>
        </aside>
      </div>
    </section>
  );
}
