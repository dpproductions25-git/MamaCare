'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SALE, isSaleActive } from '@/lib/sale';

/**
 * Sitewide sale strip. Decides on the client whether the sale window is open,
 * so it is correct on every page — including ones that were prerendered before
 * the sale started — and it removes itself when the sale ends.
 */
export default function SaleBanner() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isSaleActive());
  }, []);

  if (!on) return null;

  return (
    <Link
      href={SALE.bannerHref}
      className="block bg-ink-900 text-cream-50 text-center text-xs sm:text-sm py-2 px-4 hover:bg-ink-700 transition"
    >
      <span className="font-semibold tracking-wide">{SALE.bannerText}</span>
      <span className="hidden sm:inline text-cream-50/70"> · {SALE.bannerSubtext}</span>
      <span aria-hidden="true"> →</span>
    </Link>
  );
}
