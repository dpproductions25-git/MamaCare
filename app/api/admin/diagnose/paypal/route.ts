import { NextResponse } from 'next/server';
import { paypalBase, paypalEnv } from '@/lib/paypal-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only PayPal diagnostic — answers "is real money reaching my account?"
 *
 * The dangerous failure here is silent: if PAYPAL_ENV isn't exactly "live",
 * orders are created against PayPal's SANDBOX. Checkout looks completely
 * normal, the customer sees a success page, an order is saved — but the
 * payment is fake and no money moves anywhere.
 */
export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET || '';
  const env = paypalEnv();

  const config = {
    PAYPAL_ENV_raw: process.env.PAYPAL_ENV ?? '(not set)',
    resolvedEnvironment: env,
    takingRealMoney: env === 'live',
    apiBase: paypalBase(),
    clientIdSet: !!clientId,
    // Enough to identify the app without exposing the full credential
    clientIdPreview: clientId ? `${clientId.slice(0, 8)}…${clientId.slice(-4)}` : null,
    secretSet: !!secret,
  };

  if (!clientId || !secret) {
    return NextResponse.json({
      ...config,
      auth: 'SKIPPED',
      verdict: 'PayPal credentials are not set — PayPal checkout cannot work at all.',
    }, { status: 500 });
  }

  try {
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const r = await fetch(`${paypalBase()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const data: any = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json({
        ...config,
        auth: 'FAILED',
        status: r.status,
        error: data?.error_description || data?.error || 'unknown',
        verdict:
          'These credentials were rejected. A common cause is live credentials ' +
          'used against sandbox (or the reverse) — the two are not interchangeable.',
      }, { status: 500 });
    }

    return NextResponse.json({
      ...config,
      auth: 'OK',
      appId: data?.app_id ?? null,
      verdict: env === 'live'
        ? 'LIVE — real payments settle into the PayPal account that owns this Client ID.'
        : 'SANDBOX — payments are simulated. No real money moves. Customers can appear to ' +
          'pay successfully while you receive nothing.',
      howToConfirmTheAccount:
        'PayPal Dashboard → Apps & Credentials → switch to Live → find the app whose Client ID ' +
        `starts with "${clientId.slice(0, 8)}". The business account you are signed into there ` +
        'is the account that receives the money.',
    });
  } catch (e: any) {
    return NextResponse.json({ ...config, auth: 'ERROR', error: e?.message }, { status: 500 });
  }
}
