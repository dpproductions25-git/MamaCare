/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

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
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
