import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Newsletter subscribe stub. Logs to Vercel function logs for now.
 * Wire to Klaviyo / Mailchimp / Beehiiv when ready.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') || '').trim();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  console.log('newsletter subscribe', email);
  return NextResponse.redirect(new URL('/?subscribed=1', req.url), 303);
}
