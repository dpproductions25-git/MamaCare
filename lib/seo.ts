import type { Metadata } from 'next';

export const SITE_NAME = 'MamaCare';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mamacarestore2.vercel.app';
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
