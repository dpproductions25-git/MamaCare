import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createOrder as createCjOrder } from '@/lib/cj';
import { getMergedProducts } from '@/lib/product-overrides';
import { upsertCustomer, saveOrder, setCjOrderId } from '@/lib/db';
import { sendOrderConfirmation, sendRegistryGiftNotification } from '@/lib/email';
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

    // 3) Fire CJ fulfillment.
    // Must use the merged catalog — the static list omits admin-created
    // products, which meant those orders were paid for but never sent to the
    // supplier.
    const catalog = await getMergedProducts();
    const cjItems = snapshot
      .map((s) => {
        const p = catalog.find((x) => x.id === s.productId);
        return p?.cjVariantId ? { vid: p.cjVariantId, quantity: s.qty } : null;
      })
      .filter(Boolean) as { vid: string; quantity: number }[];

    if (cjItems.length !== snapshot.length) {
      console.warn(
        `[stripe webhook] ${snapshot.length - cjItems.length} item(s) in order ${session.id} have no CJ variant id — fulfil these manually.`
      );
    }

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
