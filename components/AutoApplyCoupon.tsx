'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';

/**
 * Applies a discount code carried in the URL (?code=BLACKFRIDAY or ?coupon=…)
 * so shoppers arriving from an ad don't have to remember and type it.
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
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = (params.get('code') || params.get('coupon') || '').trim();
      if (!CODE_RE.test(raw)) return;

      const code = raw.toUpperCase();
      useCart.getState().applyCoupon(code);
      setApplied(code);
      timer = setTimeout(() => setApplied(null), 5000);

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
    } catch {
      /* never let a promo link break the page */
    }
    return () => { if (timer) clearTimeout(timer); };
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
