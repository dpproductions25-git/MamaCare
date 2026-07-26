'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
import { calculateTotals } from '@/lib/coupons';
import { freeShippingNudge } from '@/lib/shipping-copy';
import type { Product } from '@/lib/types';

export default function CartClient({
  serverProducts,
  shippingSettings = { freeThreshold: 50, flatRate: 6.99 },
}: {
  serverProducts: Product[];
  /** Live settings from the server so the first paint is already correct */
  shippingSettings?: { freeThreshold: number; flatRate: number };
}) {
  const { items, couponCode, setQty, remove, applyCoupon, removeCoupon } = useCart();
  const [mounted, setMounted] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => setMounted(true), []);

  // Subtotal from merged (server) products so admin price changes are reflected.
  // Computed before any early return so the hooks below always run.
  const sub = items.reduce((sum, i) => {
    const product = serverProducts.find((p) => p.id === i.productId);
    if (!product) return sum;
    const variant = i.variantId ? product.variants?.find((v) => v.vid === i.variantId) : undefined;
    return sum + (variant?.price ?? product.price) * i.qty;
  }, 0);

  // Server-resolved totals: knows admin shipping settings and database coupons
  // (including per-customer single-use codes) that the client can't see.
  // Seed with the real server settings so the first paint is already correct —
  // no flash of the wrong shipping price, and still accurate if the live
  // pricing request is slow or fails.
  const preview = calculateTotals(sub, couponCode, shippingSettings);
  const [totals, setTotals] = useState({
    discount: preview.discount,
    shipping: preview.shipping,
    total: preview.total,
    appliedCode: preview.coupon?.code ?? null as string | null,
    couponDescription: preview.coupon?.description ?? null as string | null,
    freeThreshold: shippingSettings.freeThreshold,
    flatRate: shippingSettings.flatRate,
  });

  useEffect(() => {
    let cancelled = false;
    if (sub <= 0) return;
    // Debounced: tapping the quantity stepper fires this repeatedly otherwise.
    const timer = setTimeout(() => {
      (async () => {
      try {
        const res = await fetch('/api/coupon/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subtotal: sub, code: couponCode }),
        });
        const data = await res.json();
        if (!cancelled && !res.ok) {
          // Don't fail silently — a masked error here looks identical to
          // "your settings didn't save", which is impossible to debug.
          console.error('[cart] /api/coupon/validate failed:', res.status, data);
          setCodeError(data?.error || `Could not reach pricing service (${res.status}).`);
        }
        if (!cancelled && res.ok) {
          setTotals({
            discount: data.discount,
            shipping: data.shipping,
            total: data.total,
            appliedCode: data.appliedCode,
            couponDescription: data.couponDescription,
            freeThreshold: data.freeThreshold,
            flatRate: data.flatRate,
          });
          // Code went stale (expired / used up) while sitting in the cart
          if (couponCode && !data.appliedCode && data.couponError) {
            setCodeError(data.couponError);
            removeCoupon();
          }
        }
      } catch (e: any) {
        console.error('[cart] pricing request threw:', e?.message);
        if (!cancelled) setCodeError('Could not load live pricing. Showing estimated totals.');
      }
      })();
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub, couponCode]);

  const { discount, shipping, total, appliedCode, couponDescription } = totals;

  // "Add $12.50 more for free shipping" — uses the live admin threshold
  const nudge = freeShippingNudge(sub - discount, {
    freeThreshold: totals.freeThreshold,
    flatRate: totals.flatRate,
  });

  async function handleApplyCoupon() {
    setCodeError(null);
    const code = codeInput.trim();
    if (!code) return;
    setApplying(true);
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtotal: sub, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.error || 'Could not check that code.');
        return;
      }
      if (!data.appliedCode) {
        setCodeError(data.couponError || 'Invalid or expired code.');
        return;
      }
      applyCoupon(code);
      setCodeInput('');
    } catch {
      setCodeError('Network error — please try again.');
    } finally {
      setApplying(false);
    }
  }

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
      product: serverProducts.find((p) => p.id === i.productId),
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
            {!appliedCode ? (
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
                    disabled={applying}
                    className="px-4 py-2 rounded-full bg-ink-900 text-white text-sm hover:bg-ink-700 disabled:opacity-60"
                  >
                    {applying ? 'Checking…' : 'Apply'}
                  </button>
                </div>
                {codeError && <p className="text-xs text-blush-500 mt-1">{codeError}</p>}
              </>
            ) : (
              <div className="flex items-center justify-between bg-sage-50 border border-sage-200 rounded-2xl px-3 py-2">
                <span className="text-sm text-sage-500">
                  <strong>{appliedCode}</strong> applied
                  {couponDescription ? ` — ${couponDescription.toLowerCase()}` : ''}
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
            {nudge && (
              <div className="text-xs text-blush-500 bg-blush-50 border border-blush-100 rounded-xl px-3 py-2">
                🚚 {nudge}
              </div>
            )}
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
