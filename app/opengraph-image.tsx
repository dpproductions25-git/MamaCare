import { ImageResponse } from 'next/og';

/**
 * Social share card, generated rather than designed.
 *
 * metadata referenced /og-default.jpg, which never existed — so every link
 * shared to Facebook, WhatsApp, iMessage, Slack or X rendered with a blank
 * thumbnail. Next.js generates this file at build time from the JSX below, so
 * there is nothing to upload and nothing to keep in sync.
 *
 * Next automatically wires this into og:image and twitter:image for every page
 * that doesn't define its own.
 */

export const runtime = 'edge';
export const alt = 'MamaCare — thoughtfully curated baby, maternity and nursery essentials';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FDFAF6 0%, #FBF0F3 100%)',
          position: 'relative',
        }}
      >
        {/* Blush accent bar, mirroring the site header */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: '#E68197',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 92 }}>
          <span style={{ color: '#2A2A33', fontWeight: 700, letterSpacing: -2 }}>Mama</span>
          <span style={{ color: '#E68197', fontWeight: 700, letterSpacing: -2 }}>Care</span>
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 34,
            color: '#4B4B58',
            textAlign: 'center',
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          Thoughtfully curated baby gear, sleep, feeding &amp; nursery essentials
        </div>

        <div
          style={{
            marginTop: 44,
            display: 'flex',
            gap: 18,
            fontSize: 22,
            color: '#7A7A87',
          }}
        >
          <span
            style={{
              background: '#fff',
              padding: '12px 26px',
              borderRadius: 999,
              border: '1px solid rgba(42,42,51,0.08)',
            }}
          >
            Free US shipping
          </span>
          <span
            style={{
              background: '#fff',
              padding: '12px 26px',
              borderRadius: 999,
              border: '1px solid rgba(42,42,51,0.08)',
            }}
          >
            14-day returns
          </span>
          <span
            style={{
              background: '#fff',
              padding: '12px 26px',
              borderRadius: 999,
              border: '1px solid rgba(42,42,51,0.08)',
            }}
          >
            Baby registry
          </span>
        </div>
      </div>
    ),
    size
  );
}
