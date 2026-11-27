import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { fulfilOrder } from '@/lib/fulfil-order';
import { decodeProductSnapshot, type OrderLine } from '@/lib/fulfilment';
import { upsertCustomer, saveOrder } from '@/lib/db';
import { sendOrderConfirmation, sendOrderSaveFailedAlert, sendRegistryGiftNotification } from '@/lib/email';
import { markItemPurchased, findRegistryById, getRegistryItems, ensureRegistrySchema } from '@/lib/db-registry';
import { enrichRegistryItems } from '@/lib/registry-enrich';
import { redeemCoupon } from '@/lib/db-commerce';

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
    // An unreadable item list must not stop the order being saved.
    let snapshot: OrderLine[] = [];
    let linesError: string | undefined;
    try {
      snapshot = decodeProductSnapshot(session.metadata);
    } catch {
      linesError = 'The item list on this payment is unreadable. Check its line items in Stripe.';
    }
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

    // 1) Save customer & order.
    // Nothing else has happened yet, so if this fails we answer with an error
    // and Stripe redelivers the event (for up to 3 days). Answering "received"
    // here used to lose the order for good: no record, email or CJ order.
    let isNewOrder: boolean;
    try {
      const customerId = await upsertCustomer({
        email: shipping.email,
        name: shipping.fullName,
        phone: shipping.phone
      });

      isNewOrder = await saveOrder({
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
    } catch (e: any) {
      console.error(`[stripe webhook] could not save order ${session.id} — asking Stripe to retry`, e);
      // Alert once, around the first delivery — not on every retry.
      if (Date.now() - event.created * 1000 < 3 * 60 * 1000) {
        await sendOrderSaveFailedAlert({
          orderId: session.id,
          provider: 'Stripe',
          totalCents: session.amount_total ?? 0,
          items: snapshot,
          shipping,
          nextStep:
            'Fix the database. Stripe will retry by itself for up to 3 days, and the order then ' +
            'processes normally. Do not also place it in CJ by hand unless it is still missing ' +
            'from /admin/orders after Stripe stops retrying.',
          error: e?.message || String(e)
        });
      }
      return NextResponse.json({ error: 'Order could not be saved. Please retry.' }, { status: 500 });
    }

    // A redelivered or resent event for an order we already have: stop here so
    // the customer isn't emailed twice and CJ doesn't ship it twice.
    if (!isNewOrder) {
      console.log(`[stripe webhook] order ${session.id} already saved — skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 1b) Record coupon redemption (idempotent — keyed on order id, so Stripe's
    //     webhook retries can't inflate the counter or burn a code twice)
    const usedCode = session.metadata?.couponCode;
    if (usedCode) {
      try {
        await redeemCoupon(usedCode, session.id, shipping.email);
      } catch (e) {
        console.error('Coupon redemption failed', e);
      }
    }

    // 2) Email customer + admin.
    // Independently guarded: this used to be unguarded, so a failing email
    // aborted the whole handler — skipping supplier fulfilment AND registry
    // updates for an order that had already been paid for.
    if (shipping.email) {
      try {
        await sendOrderConfirmation({
          to: shipping.email,
          orderId: session.id,
          totalCents: session.amount_total ?? 0,
          items: snapshot,
          shipping
        });
      } catch (e) {
        console.error('[stripe webhook] order confirmation email failed', e);
      }
    }

    // 3) Order from CJ — the size/colour the shopper chose (lib/fulfilment.ts).
    try {
      await fulfilOrder({
        orderId: session.id,
        provider: 'Stripe',
        lines: snapshot,
        shipping,
        linesError
      });
    } catch (e) {
      console.error('CJ fulfillment failed', e);
    }

    // 4) Mark registry items as purchased and notify the registry owner.
    // Compact metadata format: registryId~itemId:qty,itemId:qty;registryId2~itemId:qty
    const registrySnapRaw = session.metadata?.registrySnapshot || '';
    console.log(
      `[stripe webhook] order ${session.id} registrySnapshot="${registrySnapRaw}"` +
      (registrySnapRaw.trim() ? '' : ' (none — not a registry purchase)')
    );
    if (registrySnapRaw.trim()) {
      try {
        await ensureRegistrySchema();

        for (const group of registrySnapRaw.split(';').filter(Boolean)) {
          const [registryId, pairsRaw] = group.split('~');
          if (!registryId || !pairsRaw) continue;

          const pairs = pairsRaw
            .split(',')
            .map((s) => {
              const [id, q] = s.split(':');
              return { itemId: Number(id), qty: Number(q) };
            })
            .filter((p) => Number.isFinite(p.itemId) && Number.isFinite(p.qty) && p.qty > 0);

          if (!pairs.length) continue;

          // Mark each item purchased (DB caps the value at qty_wanted)
          for (const p of pairs) {
            await markItemPurchased(p.itemId, p.qty);
          }

          // Resolve product names from the registry rows, then notify the owner
          const registry = await findRegistryById(registryId);
          if (!registry) continue;

          const rows = await getRegistryItems(registryId);
          const enriched = await enrichRegistryItems(rows);
          const giftedItems = pairs.map((p) => ({
            productName: enriched.find((r) => r.id === p.itemId)?.name ?? 'Item',
            qty: p.qty,
          }));

          await sendRegistryGiftNotification({
            to: registry.email,
            ownerName: registry.owner_name,
            registryTitle: registry.title,
            registryId,
            giftedItems,
          });
        }
      } catch (e) {
        console.error('Registry purchase processing failed (Stripe)', e);
      }
    }
  } catch (e) {
    console.error('Order processing failed', e);
  }

  return NextResponse.json({ received: true });
}
