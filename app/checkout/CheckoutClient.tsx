'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { calculateTotals } from '@/lib/coupons';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import type { Product } from '@/lib/types';

type Form = {
  email: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const empty: Form = {
  email: '', fullName: '', phone: '',
  line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US'
};

export default function CheckoutClient({ serverProducts }: { serverProducts: Product[] }) {
  const router = useRouter();
  const { items, couponCode, clear } = useCart();
  const [form, setForm] = useState<Form>(empty);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Compute totals from merged (server) products so admin price changes are reflected.
  const sub = items.reduce((sum, i) => {
    const p = serverProducts.find((x) => x.id === i.productId);
    if (!p) return sum;
    const variant = i.variantId ? p.variants?.find((v) => v.vid === i.variantId) : undefined;
    return sum + (variant?.price ?? p.price) * i.qty;
  }, 0);

  const { coupon, discount, shipping, total: grand } = calculateTotals(sub, couponCode);

  useEffect(() => {
    if (items.length === 0) router.replace('/cart');
  }, [items, router]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    for (const f of ['email', 'fullName', 'line1', 'city', 'state', 'postalCode', 'country'] as const) {
      if (!form[f].trim()) return 'Please complete all required address fields.';
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.';
    if (!agreedToTerms) return 'Please agree to the Terms and Conditions before completing your purchase.';
    return null;
  }

  async function payWithStripe() {
    setErr(null);
    const v = validate();
    if (v) return setErr(v);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress: form, couponCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  }

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test';

  return (
    <section className="container-page py-10 sm:py-14">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">Checkout</h1>

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-xl text-ink-900 mb-4">Contact</h2>
            <input type="email" placeholder="Email *" required value={form.email} onChange={(e) => update('email', e.target.value)} className="input" />
            <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input mt-3" />
          </div>

          <div className="card p-6">
            <h2 className="font-display text-xl text-ink-900 mb-4">Shipping address</h2>
            <input placeholder="Full name *" required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="input" />
            <input placeholder="Address line 1 *" required value={form.line1} onChange={(e) => update('line1', e.target.value)} className="input mt-3" />
            <input placeholder="Address line 2" value={form.line2} onChange={(e) => update('line2', e.target.value)} className="input mt-3" />
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input placeholder="City *" required value={form.city} onChange={(e) => update('city', e.target.value)} className="input" />
              <input placeholder="State / Province *" required value={form.state} onChange={(e) => update('state', e.target.value)} className="input" />
              <input placeholder="ZIP / Postal code *" required value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} className="input" />
              <input placeholder="Country *" required value={form.country} onChange={(e) => update('country', e.target.value)} className="input" />
            </div>
          </div>

          <style jsx global>{`
            .input { width: 100%; border-radius: 9999px; padding: 0.75rem 1.25rem; background: white; border: 1px solid rgba(42,42,51,0.1); outline: none; }
            .input:focus { box-shadow: 0 0 0 3px rgba(243,165,182,0.4); }
          `}</style>

          <div className="card p-6 border-2 border-blush-100 bg-blush-50/30">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 w-5 h-5 accent-blush-400 flex-shrink-0" />
              <span className="text-sm text-ink-700 leading-relaxed">
                I have read and agree to MamaCare&apos;s{' '}
                <Link href="/terms" target="_blank" className="underline text-blush-500 font-medium">Terms and Conditions</Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="underline text-blush-500 font-medium">Privacy Policy</Link>.
                I understand that MamaCare is a dropshipping retailer and does not manufacture the products it sells,
                that shipping may take 5–18 business days, and that returns are accepted within 14 days of delivery. <span className="text-blush-500">*</span>
              </span>
            </label>
          </div>

          {err && <p className="text-blush-500 text-sm font-medium">{err}</p>}

          <div className="card p-6 space-y-4">
            <h2 className="font-display text-xl text-ink-900">Payment</h2>
            <button onClick={payWithStripe} disabled={loading || !agreedToTerms} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Redirecting…' : `Pay with Card · $${grand.toFixed(2)}`}
            </button>

            <div className="flex items-center gap-3 text-xs text-ink-500">
              <span className="h-px flex-1 bg-ink-900/10" /> or <span className="h-px flex-1 bg-ink-900/10" />
            </div>

            <div className={!agreedToTerms ? 'opacity-40 pointer-events-none' : ''}>
              <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD' }}>
                <PayPalButtons
                  style={{ layout: 'horizontal', color: 'gold', shape: 'pill', label: 'paypal' }}
                  disabled={loading || !agreedToTerms}
                  createOrder={async () => {
                    const v = validate();
                    if (v) { setErr(v); throw new Error(v); }
                    const r = await fetch('/api/checkout/paypal', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items, shippingAddress: form, couponCode })
                    });
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.error || 'PayPal order failed');
                    return d.id;
                  }}
                  onApprove={async (data) => {
                    const r = await fetch('/api/checkout/paypal/capture', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderId: data.orderID, items, shippingAddress: form, couponCode })
                    });
                    if (!r.ok) {
                      const d = await r.json().catch(() => ({}));
                      setErr(d.error || 'PayPal capture failed');
                      return;
                    }
                    clear();
                    router.push('/checkout/success?provider=paypal');
                  }}
                  onError={(e) => setErr(String(e))}
                />
              </PayPalScriptProvider>
            </div>

            {!agreedToTerms && (
              <p className="text-xs text-ink-500 italic">
                Check the Terms and Conditions box above to enable payment.
              </p>
            )}
          </div>
        </div>

        <aside className="card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-2xl text-ink-900">Order</h2>
          <ul className="mt-4 divide-y divide-ink-900/5">
            {items.map((i) => {
              const p = serverProducts.find((x) => x.id === i.productId);
              if (!p) return null;
              const variant = i.variantId ? p.variants?.find((v) => v.vid === i.variantId) : undefined;
              const linePrice = variant?.price ?? p.price;
              return (
                <li key={`${i.productId}-${i.variantId || ''}`} className="py-3 flex justify-between text-sm">
                  <span>{p.name} {variant ? `(${variant.name})` : ''} × {i.qty}</span>
                  <span>${(linePrice * i.qty).toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>${sub.toFixed(2)}</dd></div>
            {coupon && discount > 0 && (
              <div className="flex justify-between text-sage-500">
                <dt>{coupon.code} (− {coupon.description.toLowerCase()})</dt>
                <dd>− ${discount.toFixed(2)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{shipping === 0 ? <span className="text-sage-500">{coupon?.type === 'free-shipping' ? `Free (${coupon.code})` : 'Free'}</span> : `$${shipping.toFixed(2)}`}</dd>
            </div>
            <div className="flex justify-between text-base text-ink-900 font-medium pt-2 border-t border-ink-900/10">
              <dt>Total</dt><dd>${grand.toFixed(2)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
