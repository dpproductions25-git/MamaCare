'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { getConsent } from './CookieBanner';

/**
 * Loads Google Analytics only after the visitor accepts cookies.
 *
 * Previously the GA scripts were rendered unconditionally in the root layout,
 * so tracking cookies were set on first paint for every visitor including EU
 * ones — the exact thing consent is supposed to gate.
 *
 * Vercel Analytics and Speed Insights are deliberately NOT gated here: both are
 * cookieless and collect no personal data, which is why they sit outside the
 * consent requirement.
 */
export default function ConsentedAnalytics({ gaId }: { gaId?: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(getConsent() === 'accepted');

    // React to the banner without needing a reload
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAllowed(detail === 'accepted');
    };
    window.addEventListener('mc-consent', onConsent);
    return () => window.removeEventListener('mc-consent', onConsent);
  }, []);

  if (!gaId || !allowed) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
