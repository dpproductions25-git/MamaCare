/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  /**
   * TEMPORARILY set to false to surface type/lint errors in the Vercel build log.
   *
   * With these ignored, broken code deployed silently and only failed at
   * runtime in front of customers. Turning them on makes the build fail loudly
   * instead — production stays on the last good deployment, so a failed build
   * takes nothing down.
   *
   * If the build passes, LEAVE THESE AS FALSE. That's the safer long-term
   * setting. Only flip back to true if you need to ship something urgent while
   * a known error is outstanding.
   */
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cf.cjdropshipping.com' },
      { protocol: 'https', hostname: 'cbu01.alicdn.com' },
      { protocol: 'https', hostname: 'oss-cf.cjdropshipping.com' },
      // Google Drive image hosting
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      // Dropbox
      { protocol: 'https', hostname: 'www.dropbox.com' },
      { protocol: 'https', hostname: 'dl.dropboxusercontent.com' },
      // imgur (popular admin choice)
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'imgur.com' }
    ]
  },

  experimental: {
    serverComponentsExternalPackages: ['stripe']
  },

  async headers() {
    // Content-Security-Policy — tightened but safe for Stripe, PayPal, Google Fonts, GA
    const csp = [
      "default-src 'self'",
      // Scripts: self + inline (Next.js needs it) + Stripe + PayPal + GA
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com https://www.googletagmanager.com https://www.google-analytics.com",
      // Styles: self + inline (Tailwind) + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + all HTTPS (product images come from many CDNs)
      "img-src 'self' data: blob: https:",
      // Frames: Stripe + PayPal only. checkout.stripe.com is required for
      // Embedded Checkout — the inline card form is served from that origin.
      "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
      // Fetch/XHR: self + payment APIs + Resend + GA
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://www.paypal.com https://api.resend.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
      // Media: self only
      "media-src 'self'",
      // No plugins ever
      "object-src 'none'",
      // No base tag hijacking
      "base-uri 'self'",
      // Forms only submit to self
      "form-action 'self' https://formsubmit.co",
      // Upgrade insecure requests
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          // Prevents MIME-type sniffing
          { key: 'X-Content-Type-Options',           value: 'nosniff' },
          // Blocks clickjacking
          { key: 'X-Frame-Options',                  value: 'SAMEORIGIN' },
          // Limits referrer info sent to third parties
          { key: 'Referrer-Policy',                  value: 'strict-origin-when-cross-origin' },
          // Disables unused browser features
          { key: 'Permissions-Policy',               value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")' },
          // Forces HTTPS for 2 years
          { key: 'Strict-Transport-Security',        value: 'max-age=63072000; includeSubDomains; preload' },
          // Legacy XSS filter (IE/old Chrome)
          { key: 'X-XSS-Protection',                 value: '1; mode=block' },
          // Prevents cross-origin reads of your responses
          { key: 'Cross-Origin-Resource-Policy',     value: 'same-origin' },
          // Prevents your pages being loaded in cross-origin popups
          { key: 'Cross-Origin-Opener-Policy',       value: 'same-origin-allow-popups' },
          // Full Content-Security-Policy
          { key: 'Content-Security-Policy',          value: csp },
        ]
      }
    ];
  }
};

module.exports = nextConfig;
