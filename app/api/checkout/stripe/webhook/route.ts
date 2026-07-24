import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createOrder as createCjOrder } from '@/lib/cj';
import { products } from '@/lib/products';
import { upsertCustomer, saveOrder, setCjOrderId } from '@/lib/db';
import { sendOrderConfirmation } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return new Stripe(key);
}

/**
 * Stripe webhook handler.
 *
 * In Stripe Dashboard → Webhooks, create an endpoint:
 *   URL    : https://YOUR_DOMAIN/api/checkout/stripe/webhook
 *   Events : checkout.session.completed
 * Then copy the signing secret to STRIPE_WEBHOOK_SECRET in Vercel.
 *
 * Flow on a successful checkout:
 *   1) Save order + customer to Postgres
 *   2) Email the customer + the shop owner
 *   3) Place a CJ Dropshipping fulfillment order (if CJ_API_KEY set)
 */
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();

  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    console.error('Stripe signature verify failed', err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    const snapshot = JSON.parse(session.metadata?.productSnapshot || '[]') as { productId: string; qty: number }[];
    const stripeShip: any = (session as any).shipping_details || (session as any).collected_information;
    const fallbackShip = JSON.parse(session.metadata?.shippingAddress || '{}');
    const shippingName = stripeShip?.name || session.customer_details?.name || fallbackShip.fullName || 'Customer';
    const shipping = {
      fullName: shippingName,
      line1: stripeShip?.address?.line1 || fallbackShip.line1 || '',
      line2: stripeShip?.address?.line2 || fallbackShip.line2 || '',
      city: stripeShip?.address?.city || fallbackShip.city || '',
      state: stripeShip?.address?.state || fallbackShip.state || '',
      postalCode: stripeShip?.address?.postal_code || fallbackShip.postalCode || '',
      country: stripeShip?.address?.country || fallbackShip.country || 'US',
      phone: session.customer_details?.phone || fallbackShip.phone || '',
      email: session.customer_details?.email || fallbackShip.email || ''
    };

    // 1) Save customer & order
    const customerId = await upsertCustomer({
      email: shipping.email,
      name: shipping.fullName,
      phone: shipping.phone
    });

    await saveOrder({
      id: session.id,
      customerId,
      totalCents: session.amount_total ?? 0,
      currency: (session.currency || 'usd').toUpperCase(),
      status: 'paid',
      paymentProvider: 'stripe',
      paymentId: session.payment_intent as string,
      shipping,
      items: snapshot
    });

    // 2) Email customer + admin
    if (shipping.email) {
      await sendOrderConfirmation({
        to: shipping.email,
        orderId: session.id,
        totalCents: session.amount_total ?? 0,
        items: snapshot,
        shipping
      });
    }

    // 3) Fire CJ fulfillment
    const cjItems = snapshot
      .map((s) => {
        const p = products.find((x) => x.id === s.productId);
        return p?.cjVariantId ? { vid: p.cjVariantId, quantity: s.qty } : null;
      })
      .filter(Boolean) as { vid: string; quantity: number }[];

    if (cjItems.length && process.env.CJ_API_KEY) {
      try {
        const cj = await createCjOrder({
          orderNumber: session.id,
          shippingZip: shipping.postalCode,
          shippingCountryCode: shipping.country,
          shippingProvince: shipping.state,
          shippingCity: shipping.city,
          shippingAddress: [shipping.line1, shipping.line2].filter(Boolean).join(', '),
          shippingCustomerName: shipping.fullName,
          shippingPhone: shipping.phone,
          remark: 'MamaCare order',
          products: cjItems
        });
        if ((cj as any)?.orderId) await setCjOrderId(session.id, String((cj as any).orderId));
      } catch (e) {
        console.error('CJ fulfillment failed', e);
      }
    }
  } catch (e) {
    console.error('Order processing failed', e);
  }

  return NextResponse.json({ received: true });
}
