import { NextResponse } from 'next/server';
import { sendRegistryGiftNotification } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only email diagnostic.
 *
 * Open /api/admin/diagnose/email?to=you@example.com while logged into admin.
 * Sends a real registry-gift email so you can confirm the whole path works,
 * and reports exactly which sender address and env vars are in play.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get('to');

  const effectiveFrom =
    process.env.RESEND_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    'MamaCare <onboarding@resend.dev>';

  const usingSandbox = /@resend\.dev>?\s*$/i.test(effectiveFrom);

  const config = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'set' : 'MISSING',
    RESEND_FROM: process.env.RESEND_FROM || '(not set)',
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || '(not set)',
    effectiveFrom,
    // The failure that looks like everything is working
    usingResendSandboxSender: usingSandbox,
    ...(usingSandbox && {
      CRITICAL:
        'You are sending from Resend\'s sandbox address. It ONLY delivers to the ' +
        'email that owns your Resend account — which is why your own notification ' +
        'arrives and customers receive nothing. Set RESEND_FROM in Vercel to an ' +
        'address on your verified domain (e.g. "MamaCare <hello@mamacare.us>") and redeploy.',
    }),
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || '(not set — defaults to hello@mamacare.us)',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '(not set)',
  };

  if (!to) {
    return NextResponse.json({
      config,
      hint: 'Add ?to=your@email.com to send a real test registry-gift email.',
    });
  }

  try {
    await sendRegistryGiftNotification({
      to,
      ownerName: 'Test Mama',
      registryTitle: 'Diagnostic Registry',
      registryId: 'diagnostic',
      giftedItems: [{ productName: 'Test gift item', qty: 1 }],
    });
    return NextResponse.json({
      config,
      sentTo: to,
      note: 'Check the Vercel function logs for a line starting with [email] — it reports whether Resend accepted or rejected the send.',
    });
  } catch (e: any) {
    return NextResponse.json(
      { config, error: e?.message, stack: e?.stack },
      { status: 500 }
    );
  }
}
