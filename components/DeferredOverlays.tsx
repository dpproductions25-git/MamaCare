'use client';

import dynamic from 'next/dynamic';

/**
 * Defers the two always-mounted overlays out of the initial JavaScript bundle.
 *
 * EmailPopup and RegistryDrawer live in the root layout, so their code shipped
 * on every page load — including the product and checkout pages where neither
 * is visible. Neither renders anything until the user acts (the popup waits
 * 5 seconds; the drawer waits for a click), so there is nothing to gain from
 * having them parsed up front.
 *
 * ssr: false is safe here precisely because they render null on first paint —
 * no layout shift, and nothing SEO-relevant is skipped. This trims Total
 * Blocking Time, which feeds INP — a real Core Web Vital, unlike raw request
 * count.
 */
const EmailPopup = dynamic(() => import('./EmailPopup'), { ssr: false });
const RegistryDrawer = dynamic(() => import('./RegistryDrawer'), { ssr: false });

export default function DeferredOverlays() {
  return (
    <>
      <EmailPopup />
      <RegistryDrawer />
    </>
  );
}
