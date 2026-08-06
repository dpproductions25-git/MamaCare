import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DeferredOverlays from '@/components/DeferredOverlays';
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from '@/lib/seo';
import { getMergedProducts } from '@/lib/product-overrides';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Baby Gear, Sleep, Feeding & Nursery Essentials`,
    template: `%s · ${SITE_NAME}`
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'baby gear', 'baby carrier', 'baby bouncer', 'sleep sack', 'baby bottle warmer',
    'nursery', 'baby toys', 'mom diaper bag', 'newborn essentials', 'baby shower gift',
    'mama care', 'baby clothing', 'safe sleep'
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Baby Gear, Sleep, Feeding & Nursery Essentials`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: SITE_NAME }]
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-default.jpg']
  },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 }
  },
  manifest: '/site.webmanifest'
};

export const viewport: Viewport = {
  themeColor: '#FDFAF6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch the override-merged best seller for the nav dropdown featured slot.
  // Falls back gracefully if the DB is unavailable.
  let navFeatured: { slug: string; name: string; image: string; price: number } | null = null;
  try {
    const all = await getMergedProducts();
    const pick = all.filter((p) => p.bestSeller && p.inStock && p.id !== 'mc-test')[0]
      ?? all.find((p) => p.inStock && p.id !== 'mc-test')
      ?? null;
    if (pick) navFeatured = { slug: pick.slug, name: pick.name, image: pick.image, price: pick.price };
  } catch {
    // DB unavailable — Header will fall back to static getBestSellers()
  }

  /**
   * OnlineStore is a more specific type than Organization — it tells crawlers
   * and assistants this is a shop, not a brand page or a blog. The extra fields
   * (return policy, payment methods, contact point) are what Google uses to
   * build a knowledge panel, and what an AI cites when asked "can I trust this
   * store / what's their returns policy".
   */
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-default.jpg`,
    description: DEFAULT_DESCRIPTION,
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card, Debit Card, PayPal, Apple Pay, Google Pay',
    areaServed: [
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'Canada' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'Country', name: 'Australia' }
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: process.env.CONTACT_EMAIL || 'hello@mamacare.us',
      availableLanguage: ['English'],
      url: `${SITE_URL}/contact`
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
      merchantReturnLink: `${SITE_URL}/returns`
    },
    sameAs: [
      'https://www.instagram.com/mamaacaree_',
      'https://www.facebook.com/share/1JHrwDTgML/?mibextid=wwXIfr',
      'https://www.tiktok.com/@mamacare',
      'https://www.pinterest.com/mamacare'
    ]
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans bg-cream-50 text-ink-900 min-h-screen flex flex-col">
        <Header featuredProduct={navFeatured} />
        <main className="flex-1">{children}</main>
        <Footer />
        <DeferredOverlays />
        <Analytics />
        <SpeedInsights />

        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />

        {gaId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
