import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEPRECATED — intentionally disabled.
 *
 * This endpoint used to let anyone mark a registry item as purchased with no
 * proof of payment, which meant a bad actor could mark an entire registry as
 * "all gifted" and quietly stop real gifts coming in.
 *
 * Registry items are now marked purchased only after a verified payment, in:
 *   - app/api/checkout/stripe/webhook/route.ts  (signature-verified webhook)
 *   - app/api/checkout/paypal/capture/route.ts  (after a successful capture)
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has been removed. Registry items update automatically after checkout.' },
    { status: 410 }
  );
}
