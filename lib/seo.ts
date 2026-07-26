import type { Metadata } from 'next';

export const SITE_NAME = 'MamaCare';

/** Domains we're willing to redirect a customer back to after payment. */
const TRUSTED_HOST_SUFFIXES = ['mamacare.us', '.vercel.app'];

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  // Vercel injects this for the production deployment — a better guess than a
  // hardcoded URL that can silently go stale.
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://mamacare.us');

/**
 * The origin to send a customer back to after an external redirect (Stripe).
 *
 * Prefers the domain the request actually came from, because a stale
 * NEXT_PUBLIC_SITE_URL pointing at a deleted deployment sends customers to a
 * 404 *after they have already paid*. The host is checked against
 * TRUSTED_HOST_SUFFIXES first — the Host header is attacker-controllable, and
 * blindly trusting it would let someone craft a checkout that redirects the
 * customer to a site they control.
 */
export function resolveOrigin(req: Request): string {
  const raw = req.headers.get('origin') || req.headers.get('host') || '';
  if (!raw) return SITE_URL;

  let host: string;
  try {
    host = raw.includes('://') ? new URL(raw).host : raw;
  } catch {
    return SITE_URL;
  }

  const bare = host.split(':')[0].toLowerCase();
  const trusted = TRUSTED_HOST_SUFFIXES.some(
    (s) => bare === s.replace(/^\./, '') || bare.endsWith(s)
  );

  return trusted ? `https://${host}` : SITE_URL;
}
export const DEFAULT_DESCRIPTION =
  'MamaCare is your one-stop shop for thoughtfully curated baby gear, sleep, feeding, nursery, and toys. Free U.S. shipping over $50, 14-day returns.';

export function buildMetadata({
  title,
  description,
  path = '/',
  image
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const desc = description || DEFAULT_DESCRIPTION;
  const ogImage = image || `${SITE_URL}/og-default.jpg`;

  return {
    title,
    description: desc,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: 'website',
      locale: 'en_US'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImage]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}
