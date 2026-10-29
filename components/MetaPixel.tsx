'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getConsent } from './CookieBanner';

/**
 * Meta (Facebook) Pixel — the client half.
 *
 * The base code itself lives in <head> (see app/layout.tsx and
 * lib/meta-pixel.ts) so it is on every page and detectable by Meta's tools.
 * It starts in consent-revoked mode; this component:
 *
 * 1. CONSENT. Grants or revokes the pixel when the visitor answers the cookie
 *    banner, without needing a reload. Nothing is sent to Meta before Accept.
 *
 * 2. ROUTE CHANGES. `fbq('track','PageView')` in the base code runs once per
 *    full page load. This is a single-page app: clicking from the homepage to a
 *    product page never reloads the document, so without the effect below Meta
 *    would only ever see the first page of every session.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

/**
 * Fire a Meta standard or custom event from anywhere in the app.
 *
 * Safe to call unconditionally — if the pixel hasn't loaded (blocked by an
 * extension) this is a no-op rather than a crash, and while consent is revoked
 * Meta's own consent mode keeps it from sending. Use the standard event names
 * Meta recognises: AddToCart, InitiateCheckout, Purchase, Search, ViewContent,
 * Lead, CompleteRegistration.
 */
export function trackMeta(event: string, params?: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', event, params);
    }
  } catch {
    /* never let analytics break a purchase */
  }
}

export default function MetaPixel() {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();
  /** The initial PageView is fired by the base code — don't double-count it. */
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    setAllowed(getConsent() === 'accepted');

    const onConsent = (e: Event) => {
      const accepted = (e as CustomEvent).detail === 'accepted';
      setAllowed(accepted);
      try {
        if (typeof window.fbq === 'function') {
          window.fbq('consent', accepted ? 'grant' : 'revoke');
          // The base code's PageView ran while consent was still revoked, so
          // count the page the visitor accepted on.
          if (accepted) window.fbq('track', 'PageView');
        }
      } catch {
        /* never let analytics break the page */
      }
    };
    window.addEventListener('mc-consent', onConsent);
    return () => window.removeEventListener('mc-consent', onConsent);
  }, []);

  // Client-side navigations
  useEffect(() => {
    if (!allowed || !pathname) return;

    if (firstPath.current === null) {
      firstPath.current = pathname;
      return; // already counted: by the base code, or on accept above
    }
    if (firstPath.current === pathname) return;

    firstPath.current = pathname;
    trackMeta('PageView');
  }, [allowed, pathname]);

  return null;
}
