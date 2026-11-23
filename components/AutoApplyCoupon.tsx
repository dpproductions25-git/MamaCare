'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';

/**
 * Applies a discount code carried in the URL (?code=BLACKFRIDAY or ?coupon=…)
 * so shoppers arriving from an ad don't have to remember and type it. The sale
 * banner uses the same path through an 'mc-apply-coupon' window event, because
 * a client-side link click never reloads the page and so never re-reads the URL.
 *
 * It only stores the code in the cart. Whether it is valid, expired, or what it
 * is worth is still decided by the server at cart/checkout — the same path as a
 * typed code — so an invalid or expired code simply shows the usual error there.
 */
const CODE_RE = /^[A-Za-z0-9_-]{3,30}$/;

export default function AutoApplyCoupon() {
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function apply(raw: string): boolean {
      if (!CODE_RE.test(raw)) return false;
      const code = raw.toUpperCase();
      useCart.getState().applyCoupon(code);
      setApplied(code);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setApplied(null), 5000);
      return true;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const raw = (params.get('code') || params.get('coupon') || '').trim();
      if (apply(raw)) {
        // Drop the param so a refresh or shared link doesn't re-apply it after
        // the shopper has removed the code on purpose. The code stays in the cart.
        params.delete('code');
        params.delete('coupon');
        const qs = params.toString();
        window.history.replaceState(
          window.history.state,
          '',
          window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
        );
      }
    } catch {
      /* never let a promo link break the page */
    }

    const onApplyEvent = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (typeof detail === 'string') apply(detail.trim());
      } catch {
        /* never let a promo link break the page */
      }
    };
    window.addEventListener('mc-apply-coupon', onApplyEvent);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('mc-apply-coupon', onApplyEvent);
    };
  }, []);

  if (!applied) return null;

  return (
    <div
      role="status"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] bg-ink-900 text-white text-sm font-medium rounded-full px-5 py-3 shadow-card"
    >
      Code {applied} added — your discount shows at checkout.
    </div>
  );
}
