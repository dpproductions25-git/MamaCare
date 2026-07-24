import { NextResponse } from 'next/server';
import { setTracking, getOrder } from '@/lib/db';
import { sendShippingUpdate } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Called from /admin/orders ship form. Persists tracking info,
 * flips order status to 'shipped', and emails the customer a tracking link.
 *
 * Protected by the Basic Auth middleware (matches /admin/*).
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const orderId = String(form.get('orderId') || '');
  const tracking = String(form.get('tracking') || '');
  const url = String(form.get('url') || '');

  if (!orderId || !tracking) {
    return NextResponse.json({ error: 'orderId + tracking required' }, { status: 400 });
  }

  try {
    await setTracking(orderId, tracking, url || undefined);
    const order = await getOrder(orderId);
    if (order?.customer_email) {
      await sendShippingUpdate({
        to: order.customer_email,
        orderId,
        trackingNumber: tracking,
        trackingUrl: url || undefined
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  // Redirect back to admin so the page refreshes
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  return NextResponse.redirect(`${site}/admin/orders`, 303);
}
