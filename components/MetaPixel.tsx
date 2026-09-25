'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { getConsent } from './CookieBanner';

/**
 * Meta (Facebook) Pixel.
 *
 * Two things the copy-paste snippet from Meta's Events Manager does NOT handle,
 * both of which matter here:
 *
 * 1. CONSENT. The raw snippet fires on first paint and drops the `_fbp` cookie
 *    for every visitor, including EU ones. That is exactly what the cookie
 *    banner exists to prevent, and it is the kind of tracking regulators
 *    actually pursue. So the pixel is gated behind the same consent check as
 *    Google Analytics — nothing loads until the visitor accepts.
 *
 * 2. ROUTE CHANGES. `fbq('track','PageView')` runs once per full page load.
 *    This is a single-page app: clicking from the homepage to a product page
 *    never reloads the document, so without the effect below Meta would only
 *    ever see the first page of every session, and every optimisation decision
 *    it made would be based on landing pages alone.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '710352846664282';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

/**
 * Fire a Meta standard or custom event from anywhere in the app.
 *
 * Safe to call unconditionally — if the pixel hasn't loaded (no consent, or
 * blocked by an extension) this is a no-op rather than a crash. Use the
 * standard event names Meta recognises: AddToCart, InitiateCheckout, Purchase,
 * Search, ViewContent, Lead, CompleteRegistration.
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
  /** The initial PageView is fired by the init snippet — don't double-count it. */
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    setAllowed(getConsent() === 'accepted');

    const onConsent = (e: Event) => {
      setAllowed((e as CustomEvent).detail === 'accepted');
    };
    window.addEventListener('mc-consent', onConsent);
    return () => window.removeEventListener('mc-consent', onConsent);
  }, []);

  // Client-side navigations
  useEffect(() => {
    if (!allowed || !pathname) return;

    if (firstPath.current === null) {
      firstPath.current = pathname;
      return; // the snippet already tracked this one
    }
    if (firstPath.current === pathname) return;

    firstPath.current = pathname;
    trackMeta('PageView');
  }, [allowed, pathname]);

  if (!PIXEL_ID || !allowed) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>

      {/*
        The <noscript> tracking pixel. It only ever renders for visitors who
        accepted cookies, which is why it sits inside this component rather
        than directly in the layout.
      */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
