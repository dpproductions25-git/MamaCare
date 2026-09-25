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

/**
 * Every pixel that should receive events.
 *
 * Two pixels are configured deliberately (two ad accounts). Meta's `fbq` is
 * built for this: calling `init` more than once registers additional pixels,
 * and a later `track` fans the event out to all of them. That is why the
 * tracking helpers below take no pixel argument — there is nothing to route.
 *
 * NEXT_PUBLIC_META_PIXEL_ID overrides the list entirely when set, and accepts a
 * comma-separated list. Useful for pointing a preview deployment at a test
 * pixel so experiments don't pollute the real campaign data.
 */
const PIXEL_IDS = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '710352846664282,1110628708189056')
  .split(',')
  .map((id) => id.trim())
  // Pixel IDs are numeric. Anything else is a typo or a pasted stray character,
  // and passing it to fbq would silently break tracking for every pixel after
  // it in the list.
  .filter((id) => /^\d+$/.test(id));

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

  if (PIXEL_IDS.length === 0 || !allowed) return null;

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
${PIXEL_IDS.map((id) => `fbq('init', '${id}');`).join('\n')}
fbq('track', 'PageView');`}
      </Script>

      {/*
        The <noscript> fallback — one per pixel, since a no-JS visitor never
        runs fbq and so gets no fan-out. These only render for visitors who
        accepted cookies, which is why they sit inside this component rather
        than directly in the layout.
      */}
      <noscript>
        {PIXEL_IDS.map((id) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={id}
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          />
        ))}
      </noscript>
    </>
  );
}
