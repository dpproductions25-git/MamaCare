'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { calculateTotals } from '@/lib/coupons';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import type { Product } from '@/lib/types';

/**
 * Created once at module scope, not per render — loadStripe() injects a script
 * tag, so calling it inside the component would re-run on every state change.
 */
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

/**
 * Contact details only.
 *
 * Addresses are no longer collected here — Stripe gathers them inside its own
 * payment form, and PayPal returns the buyer's address on capture. Asking for
 * them up front meant customers typed the same address twice.
 */
type Form = {
  email: string;
  fullName: string;
  phone: string;
};

const empty: Form = { email: '', fullName: '', phone: '' };

export default function CheckoutClient({
  serverProducts,
  shippingSettings = { freeThreshold: 50, flatRate: 6.99 },
}: {
  serverProducts: Product[];
  /** Live settings from the server so the first paint is already correct */
  shippingSettings?: { freeThreshold: number; flatRate: number };
}) {
  const router = useRouter();
  const { items, couponCode, clear } = useCart();
  const [form, setForm] = useState<Form>(empty);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  /** Set once a Checkout Session exists — mounts Stripe's inline card form. */
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Compute totals from merged (server) products so admin price changes are reflected.
  const sub = items.reduce((sum, i) => {
    const p = serverProducts.find((x) => x.id === i.productId);
    if (!p) return sum;
    const variant = i.variantId ? p.variants?.find((v) => v.vid === i.variantId) : undefined;
    return sum + (variant?.price ?? p.price) * i.qty;
  }, 0);

  // Local preview used only until the server responds.
  // Seed with the real server settings so the first paint is already correct.
  const preview = calculateTotals(sub, couponCode, shippingSettings);
  const [totals, setTotals] = useState({
    discount: preview.discount,
    shipping: preview.shipping,
    total: preview.total,
    appliedCode: preview.coupon?.code ?? null as string | null,
    couponDescription: preview.coupon?.description ?? null as string | null,
    couponError: null as string | null,
    freeThreshold: shippingSettings.freeThreshold,
    flatRate: shippingSettings.flatRate,
  });

  // Authoritative totals from the server — knows admin shipping settings and
  // database coupons (including single-use codes) that the client can't see.
  useEffect(() => {
    let cancelled = false;
    if (sub <= 0) return;
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
          console.error('[checkout] /api/coupon/validate failed:', res.status, data);
        }
        if (!cancelled && res.ok) {
          setTotals({
            discount: data.discount,
            shipping: data.shipping,
            total: data.total,
            appliedCode: data.appliedCode,
            couponDescription: data.couponDescription,
            couponError: data.couponError,
            freeThreshold: data.freeThreshold,
            flatRate: data.flatRate,
          });
        }
      } catch (e: any) {
        console.error('[checkout] pricing request threw:', e?.message);
      }
      })();
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sub, couponCode]);

  const { discount, shipping, total: grand, appliedCode, couponDescription } = totals;

  useEffect(() => {
    if (items.length === 0) router.replace('/cart');
  }, [items, router]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    // Only name and email are needed here — the delivery address is collected
    // by Stripe or supplied by PayPal at the payment step.
    if (!form.fullName.trim()) return 'Please enter your full name.';
    if (!form.email.trim()) return 'Please enter your email address.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.';
    if (!agreedToTerms) return 'Please agree to the Terms and Conditions before continuing.';
    return null;
  }

  /**
   * Open the card form inline rather than redirecting.
   *
   * Creates the Checkout Session and keeps its clientSecret, which mounts
   * Stripe's embedded form further down this same page.
   */
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

      if (!data.clientSecret) throw new Error('Could not start the card payment. Please try again.');
      setClientSecret(data.clientSecret);
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  }

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test';

  return (
    <section className="container-page py-10 sm:py-14">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">Checkout</h1>

      {/*
        Once the card form is open it takes the full width instead of a third
        of the page. Stripe controls the layout inside its iframe, so the only
        way to stop it being a tall narrow strip is to give it more room —
        wider container, far less vertical scrolling.
      */}
      <div className={`mt-8 grid gap-8 ${clientSecret ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        <div className={`space-y-6 ${clientSecret ? '' : 'lg:col-span-2'}`}>
          {/*
            Address fields deliberately removed. Stripe collects billing and
            shipping addresses inside its own form (billing_address_collection
            + shipping_address_collection), and PayPal supplies the address from
            the buyer's PayPal account — so asking here made customers type the
            same details twice.
          */}
          <div className="card p-6">
            <h2 className="font-display text-xl text-ink-900 mb-1">Your details</h2>
            <p className="text-sm text-ink-500 mb-4">
              Delivery address is collected securely at the payment step.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Full name *"
                required
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className="input sm:col-span-2"
              />
              <input
                type="email"
                placeholder="Email *"
                required
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input"
              />
              <input
                type="tel"
                placeholder="Phone"
                autoComplete="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="input"
              />
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

            {/*
              Card payment renders inline. Once a session exists we swap the
              button for Stripe's embedded form — the customer never leaves
              this page. Card fields live inside Stripe's iframe, so card data
              never touches our site.
            */}
            {clientSecret && stripePromise ? (
              <div className="rounded-2xl overflow-hidden max-w-3xl mx-auto w-full">
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{ clientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
                <button
                  type="button"
                  onClick={() => setClientSecret(null)}
                  className="mt-3 text-xs text-ink-400 hover:text-ink-700 underline underline-offset-2"
                >
                  ← Edit my details
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={payWithStripe}
                  disabled={loading || !agreedToTerms}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading…' : `Pay with Card · $${grand.toFixed(2)}`}
                </button>

                {!stripePromise && (
                  <p className="text-xs text-blush-500">
                    Card payment is unavailable — NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.
                  </p>
                )}

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
              </>
            )}
          </div>
        </div>

        {/* Stripe shows its own order summary inside the embedded form, so this
            sidebar would be a duplicate while paying. */}
        <aside className={`card p-6 h-fit lg:sticky lg:top-24 ${clientSecret ? 'hidden' : ''}`}>
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
            {appliedCode && discount > 0 && (
              <div className="flex justify-between text-sage-500">
                <dt>{appliedCode}{couponDescription ? ` (${couponDescription.toLowerCase()})` : ''}</dt>
                <dd>− ${discount.toFixed(2)}</dd>
              </div>
            )}
            {totals.couponError && (
              <div className="text-blush-500 text-xs">{totals.couponError}</div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>
                {shipping === 0
                  ? <span className="text-sage-500">{appliedCode && discount === 0 ? `Free (${appliedCode})` : 'Free'}</span>
                  : `$${shipping.toFixed(2)}`}
              </dd>
            </div>
            <div className="flex justify-between text-ink-500">
              <dt>Sales tax</dt>
              <dd className="text-xs italic">Calculated at payment</dd>
            </div>
            <div className="flex justify-between text-base text-ink-900 font-medium pt-2 border-t border-ink-900/10">
              <dt>Total</dt><dd>${grand.toFixed(2)}<span className="text-xs font-normal text-ink-500"> + tax</span></dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
