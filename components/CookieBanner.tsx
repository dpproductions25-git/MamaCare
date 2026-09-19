'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'mc_cookie_consent_v1';

export type ConsentValue = 'accepted' | 'rejected';

/**
 * Cookie consent.
 *
 * Analytics previously loaded on every page regardless of consent, which is
 * the thing GDPR actually prohibits — non-essential tracking must not run
 * until the user opts in. This gates it.
 *
 * Reject is given equal visual weight to Accept. Regulators (and the EDPB
 * guidance specifically) treat a hidden or de-emphasised reject option as
 * invalid consent, so a banner with only a prominent "Accept" is arguably
 * worse than none — it creates a paper trail of consent that isn't valid.
 */

/** Read consent without throwing if storage is blocked (Safari private mode). */
export function getConsent(): ConsentValue | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'accepted' || v === 'rejected' ? v : null;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only mount if no decision has been recorded yet.
    if (getConsent() === null) {
      // Small delay so it doesn't fight the page for attention on first paint
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const decide = useCallback((value: ConsentValue) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage blocked — the choice holds for this page view only */
    }
    // Let the analytics loader react without a page reload
    window.dispatchEvent(new CustomEvent('mc-consent', { detail: value }));
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto max-w-3xl bg-white rounded-2xl shadow-card border border-ink-900/8 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-sm text-ink-700 leading-relaxed flex-1">
            We use cookies to understand how the shop is used so we can improve it.
            Essential cookies for your cart and checkout are always on.{' '}
            <Link href="/privacy" className="underline text-blush-500">
              Privacy policy
            </Link>
            .
          </p>

          {/* Equal weight — see note above */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => decide('rejected')}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full border border-ink-900/15 text-sm font-medium text-ink-700 hover:border-ink-900/30 transition-colors"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => decide('accepted')}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-blush-400 text-white text-sm font-medium hover:bg-blush-500 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
