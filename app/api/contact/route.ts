import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hard-coded destination per the shop owner's request.
// You can override via CONTACT_EMAIL env var if you ever need to.
const TO = process.env.CONTACT_EMAIL || 'mamaacaree@gmail.com';
const FROM = process.env.RESEND_FROM || 'MamaCare <onboarding@resend.dev>';

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get('name') || '').trim();
  const email = String(form.get('email') || '').trim();
  const subject = String(form.get('subject') || '').trim() || 'New message from MamaCare contact form';
  const message = String(form.get('message') || '').trim();
  const source = String(form.get('source') || 'contact-page').trim();
  const ref = req.headers.get('referer') || '/contact';

  // Rate limit: 3 contact form submissions per IP per 15 minutes
  const ip = getClientIp(req);
  if (!rateLimit(`contact:${ip}`, 3, 15 * 60 * 1000)) {
    return NextResponse.redirect(new URL('/contact?error=rate_limited', req.url), 303);
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }
  if (name.length > 200 || subject.length > 500 || message.length > 5000) {
    return NextResponse.json({ error: 'Input too long.' }, { status: 400 });
  }

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #2A2A33; padding: 24px;">
      <h2 style="font-family: Georgia, serif; color: #2A2A33;">New MamaCare contact-form message</h2>
      <p><strong>Source:</strong> ${source}</p>
      <table cellpadding="0" cellspacing="0" style="margin-top: 16px;">
        <tr><td style="padding: 4px 12px 4px 0; color: #7A7A87;">From:</td><td>${name}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #7A7A87;">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #7A7A87;">Subject:</td><td>${subject}</td></tr>
      </table>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="white-space: pre-wrap; line-height: 1.6;">${message.replace(/</g, '&lt;')}</p>
      <p style="margin-top: 32px; color: #7A7A87; font-size: 12px;">Sent from the MamaCare contact form.</p>
    </div>
  `;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // No email service configured — log so the owner can see in Vercel logs
    console.warn('RESEND_API_KEY not set. Contact form submission was NOT emailed:', {
      name, email, subject, message
    });
    // Still redirect the user so the form feels successful — we have a fallback in logs.
    return NextResponse.redirect(new URL(ref.includes('about') ? '/about?sent=1' : '/contact?sent=1', req.url), 303);
  }

  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html
    });
  } catch (e: any) {
    console.error('Resend send failed for contact form', e);
    // Don't block the user — log and continue.
  }

  // Redirect back to the page that sent the form
  const redirectTo = ref.includes('/about') ? '/about?sent=1' : '/contact?sent=1';
  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}
