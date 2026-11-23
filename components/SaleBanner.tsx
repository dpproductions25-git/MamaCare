'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SALE, isSaleActive } from '@/lib/sale';

/**
 * Black Friday strip at the top of every page.
 *
 * Tells shoppers about the code and applies it with one tap. Decides on the
 * client whether it should show, so it is correct on every page — including
 * ones prerendered before the sale started — and it removes itself when the
 * code expires.
 *
 *  - 'code': the code is live but the automatic sale prices haven't started yet
 *  - 'sale': both are live, so the banner mentions the sale prices as well
 */
export default function SaleBanner() {
  const [mode, setMode] = useState<'off' | 'code' | 'sale'>('off');

  useEffect(() => {
    const now = Date.now();
    if (now > Date.parse(SALE.endsAt)) setMode('off');
    else setMode(isSaleActive(now) ? 'sale' : 'code');
  }, []);

  if (mode === 'off') return null;

  // A client-side navigation doesn't re-run the URL-code logic in
  // AutoApplyCoupon, so ask it to apply the code directly. It stays a normal
  // link if that fails.
  function applyCode() {
    try {
      window.dispatchEvent(new CustomEvent('mc-apply-coupon', { detail: SALE.bannerCode }));
    } catch {
      /* the link still works without it */
    }
  }

  return (
    <Link
      href={mode === 'sale' ? SALE.bannerHref : '/shop'}
      onClick={applyCode}
      className="block bg-ink-900 text-cream-50 text-center text-xs sm:text-sm py-2 px-4 hover:bg-ink-700 transition"
    >
      <span className="font-semibold tracking-wide">Black Friday: use code </span>
      <span className="font-bold tracking-widest bg-cream-50/15 rounded px-1.5 py-0.5">
        {SALE.bannerCode}
      </span>
      <span className="font-semibold tracking-wide"> {SALE.bannerCodeText}</span>
      <span className="hidden sm:inline text-cream-50/70">
        {mode === 'sale' ? ' · plus up to 20% off nursing wear & baby clothing' : ''}
        {' · '}{SALE.bannerSubtext}
      </span>
      <span aria-hidden="true"> →</span>
    </Link>
  );
}
