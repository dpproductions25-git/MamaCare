import { ImageResponse } from 'next/og';

/**
 * Apple touch icon — the tile shown when someone adds the site to their iOS
 * home screen, and what Safari uses in various places.
 *
 * metadata pointed at /apple-touch-icon.png, which did not exist. iOS falls
 * back to a blurry screenshot of the page when this is missing, which looks
 * broken. Generated as a PNG at build time so there's no binary asset to
 * maintain.
 *
 * Apple does not apply rounded corners to a transparent icon, so this fills the
 * full square with the brand colour and lets iOS mask it.
 */

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FDF2F4',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path
            d="M32 48s-14-8.5-14-19a8 8 0 0 1 14-5.3A8 8 0 0 1 46 29c0 10.5-14 19-14 19z"
            fill="#E68197"
          />
        </svg>
      </div>
    ),
    size
  );
}
