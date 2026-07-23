import { NextResponse } from 'next/server';

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

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // ── Welcome email to subscriber ──────────────────────────────
  const welcomeHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF8F4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(42,42,51,0.08);">

        <!-- Header stripe -->
        <tr><td style="background:linear-gradient(90deg,#F3A5B6,#E68197,#F3A5B6);height:6px;"></td></tr>

        <!-- Body -->
        <tr><td style="padding:48px 44px 36px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#E68197;font-weight:600;">Welcome to the circle</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:32px;font-weight:400;color:#2A2A33;line-height:1.2;">
            You&rsquo;re in, mama. 🌸
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#4B4B58;line-height:1.7;">
            Thank you for joining MamaCare. Here&rsquo;s your exclusive discount code for 10% off your first order:
          </p>

          <!-- Coupon box -->
          <div style="background:#FDF2F4;border:2px dashed #E68197;border-radius:16px;padding:20px 32px;display:inline-block;margin-bottom:28px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#E68197;font-weight:600;">Your code</p>
            <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.08em;color:#2A2A33;font-family:monospace;">WELCOME10</p>
          </div>

          <p style="margin:0 0 32px;font-size:13px;color:#7A7A87;line-height:1.6;">
            Enter this code at checkout. Valid on your first order of any amount. No expiry.
          </p>

          <a href="https://mamacare.us/shop" style="display:inline-block;background:#E68197;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:15px;font-weight:600;letter-spacing:0.02em;">
            Shop now →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 44px;border-top:1px solid #F5EBDC;text-align:center;">
          <p style="margin:0;font-size:12px;color:#7A7A87;line-height:1.6;">
            You&rsquo;re receiving this because you signed up at <a href="https://mamacare.us" style="color:#E68197;text-decoration:none;">mamacare.us</a>.<br>
            If that wasn&rsquo;t you, you can safely ignore this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── Notification email to you ────────────────────────────────
  const notifyHtml = `
<p style="font-family:sans-serif;font-size:15px;color:#2A2A33;">
  New MamaCare subscriber: <strong>${email}</strong>
</p>`;

  // Fire both emails; don't block on the notification
  await sendWithResend(email, '🌸 Your 10% off code from MamaCare', welcomeHtml);
  sendWithResend(NOTIFY_EMAIL, `New subscriber: ${email}`, notifyHtml).catch(() => {});

  // Return JSON for the popup fetch(); redirect for plain form submissions
  const isXhr = ct.includes('application/x-www-form-urlencoded') && req.headers.get('x-requested-with') === 'XMLHttpRequest';
  const acceptsJson = (req.headers.get('accept') || '').includes('application/json') || ct.includes('application/x-www-form-urlencoded');

  // Plain browser form submissions send Accept: text/html → redirect back to homepage.
  // The popup uses fetch() → return JSON so it can show the success state.
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    return NextResponse.redirect(new URL('/?subscribed=1', req.url), 303);
  }
  return NextResponse.json({ ok: true });
}
