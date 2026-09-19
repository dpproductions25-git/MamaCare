import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { generateSingleUseCode, findUnusedCodeForEmail } from '@/lib/db-commerce';
import { sendWelcomeCode } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Use your verified Resend domain. Until mamacare.us is verified in Resend,
// you can temporarily use: 'MamaCare <onboarding@resend.dev>'
const FROM_EMAIL    = process.env.RESEND_FROM_EMAIL || 'MamaCare <onboarding@resend.dev>';
const NOTIFY_EMAIL  = process.env.SUBSCRIBE_NOTIFY_EMAIL || 'mamaacaree@gmail.com';

/** Send via Resend. Returns true on success. */
async function sendWithResend(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  return res.ok;
}

/**
 * POST /api/subscribe
 * Accepts application/x-www-form-urlencoded or multipart/form-data.
 *
 * 1. Sends the subscriber a welcome email with their 10% discount code.
 * 2. Sends you a "new subscriber" notification.
 * 3. Returns JSON { ok: true } for fetch() callers (popup)
 *    or redirects to /?subscribed=1 for plain-HTML form callers.
 */
export async function POST(req: Request) {
  let email = '';

  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const body = await req.json();
    email = String(body.email || '').trim();
  } else {
    const form = await req.formData();
    email = String(form.get('email') || '').trim();
  }

  // Rate limit: 5 subscribe attempts per IP per 10 minutes
  const ip = getClientIp(req);
  if (!rateLimit(`subscribe:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  // Validate email server-side (never trust the client)
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // ── Issue a unique single-use 10% code ───────────────────────
  // Re-signing up with the same email returns the existing unused code rather
  // than minting a new one, so nobody can farm codes by re-subscribing.
  let discountCode = 'WELCOME10'; // fallback if the DB is unavailable
  try {
    const existing = await findUnusedCodeForEmail(email);
    const coupon = existing ?? await generateSingleUseCode({
      prefix: 'MAMA',
      type: 'percent',
      value: 10,
      description: '10% off your first order',
      issuedTo: email.toLowerCase(),
    });
    discountCode = coupon.code;
  } catch (e) {
    console.error('Could not generate signup code — falling back', e);
  }

  // ── Notification email to you ────────────────────────────────
  const notifyHtml = `
<p style="font-family:sans-serif;font-size:15px;color:#2A2A33;">
  New MamaCare subscriber: <strong>${email}</strong><br>
  Issued single-use code: <strong>${discountCode}</strong>
</p>`;

  /**
   * Send the welcome email and CHECK THE RESULT.
   *
   * This previously called a local Resend wrapper and threw the return value
   * away, so a rejected send still produced {ok:true} — the popup showed
   * "You're in!" while nothing was delivered and nothing was logged. Routing
   * through lib/email.ts means it uses the same guarded sender as every other
   * email, which logs Resend's actual rejection reason.
   */
  const delivered = await sendWelcomeCode({ to: email, code: discountCode, percentOff: 10 });

  // Owner notification is best-effort — never let it affect the customer.
  sendWithResend(NOTIFY_EMAIL, `New subscriber: ${email}`, notifyHtml).catch(() => {});

  const accept = req.headers.get('accept') || '';

  if (!delivered) {
    console.error(
      `[subscribe] Resend did NOT accept the welcome email for ${email}. ` +
      `Code ${discountCode} was still created and is valid.`
    );

    if (accept.includes('text/html')) {
      return NextResponse.redirect(new URL('/?subscribed=0', req.url), 303);
    }
    // Hand back the code so the customer isn't left with nothing.
    return NextResponse.json(
      {
        error: 'We couldn’t email your code just now — here it is, and we’ll retry shortly.',
        code: discountCode,
      },
      { status: 502 }
    );
  }

  // Plain browser form submissions send Accept: text/html → redirect back home.
  // The popup uses fetch() → JSON so it can show the success state.
  if (accept.includes('text/html')) {
    return NextResponse.redirect(new URL('/?subscribed=1', req.url), 303);
  }
  return NextResponse.json({ ok: true });
}
