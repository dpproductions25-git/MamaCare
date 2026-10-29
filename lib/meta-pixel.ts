/**
 * Meta (Facebook) Pixel configuration, shared by the root layout (which writes
 * the base code into <head>) and components/MetaPixel.tsx (which handles
 * consent changes and client-side route changes).
 *
 * NEXT_PUBLIC_META_PIXEL_ID overrides the default and accepts a comma-separated
 * list — useful for pointing a preview deployment at a test pixel.
 */
export const PIXEL_IDS = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '1439725497456446')
  .split(',')
  .map((id) => id.trim())
  // Pixel IDs are numeric. Anything else is a typo or a pasted stray character,
  // and passing it to fbq would silently break tracking for every pixel after it.
  .filter((id) => /^\d+$/.test(id));

/** Must match STORAGE_KEY in components/CookieBanner.tsx. */
const CONSENT_STORAGE_KEY = 'mc_cookie_consent_v1';

/**
 * Meta's base code, with Meta's consent mode added.
 *
 * It runs on every page, in <head>, as Meta's install instructions require, so
 * Meta's Pixel Helper and Events Manager can detect it. Consent is applied
 * before `init`, as Meta documents: the pixel starts revoked, and only starts
 * sending once the visitor has accepted cookies (the stored choice is read here
 * so returning visitors who accepted are granted immediately). Accepting in the
 * banner later calls fbq('consent','grant') — see components/MetaPixel.tsx.
 */
export function metaPixelSnippet(): string {
  if (PIXEL_IDS.length === 0) return '';
  return `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
var mcOk=false;try{mcOk=window.localStorage.getItem('${CONSENT_STORAGE_KEY}')==='accepted'}catch(e){}
fbq('consent',mcOk?'grant':'revoke');
${PIXEL_IDS.map((id) => `fbq('init', '${id}');`).join('\n')}
fbq('track', 'PageView');`;
}
