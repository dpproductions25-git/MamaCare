import { NextResponse } from 'next/server';
import { fulfilOrder } from '@/lib/fulfil-order';
import { upsertCustomer, saveOrder } from '@/lib/db';
import { sendOrderConfirmation, sendOrderSaveFailedAlert, sendRegistryGiftNotification } from '@/lib/email';
import { markItemPurchased, findRegistryById, getRegistryItems, ensureRegistrySchema } from '@/lib/db-registry';
import { enrichRegistryItems } from '@/lib/registry-enrich';
import { redeemCoupon } from '@/lib/db-commerce';
import { paypalBase } from '@/lib/paypal-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Shared with the order-creation route — see lib/paypal-env.ts. Keeping these
// in one place prevents an order being created in one environment and captured
// against the other.

async function paypalToken(): Promise<string> {
  const id = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET || '';
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const r = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  return (await r.json()).access_token;
}

export async function POST(req: Request) {
  try {
    const { orderId, items, shippingAddress, couponCode } = await req.json();
    const token = await paypalToken();
    const r = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ error: data?.message || 'capture failed' }, { status: r.status });

    const cents = Math.round(
      (data?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0) * 100
    );

    /**
     * Shipping address now comes from PayPal, not from our form.
     *
     * The checkout page no longer asks for an address — PayPal already holds a
     * verified one for the buyer. Reading it from the capture response is also
     * more reliable than a typed address, and it's what PayPal Seller
     * Protection requires you to ship to.
     *
     * Anything the client sent is used only as a fallback for contact details.
     */
    const pu = data?.purchase_units?.[0] || {};
    const ppShip = pu?.shipping || {};
    const ppAddr = ppShip?.address || {};
    const payer = data?.payer || {};
    const fallback = shippingAddress || {};

    const shipping = {
      fullName:
        ppShip?.name?.full_name ||
        [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(' ') ||
        fallback.fullName ||
        'Customer',
      line1: ppAddr.address_line_1 || fallback.line1 || '',
      line2: ppAddr.address_line_2 || fallback.line2 || '',
      city: ppAddr.admin_area_2 || fallback.city || '',
      state: ppAddr.admin_area_1 || fallback.state || '',
      postalCode: ppAddr.postal_code || fallback.postalCode || '',
      country: ppAddr.country_code || fallback.country || 'US',
      email: payer?.email_address || fallback.email || '',
      phone: payer?.phone?.phone_number?.national_number || fallback.phone || '',
    };

    if (!shipping.line1) {
      console.error(
        `[paypal capture] order ${orderId} has no shipping address from PayPal — ` +
        `fulfilment will need a manual address.`
      );
    }

    // 1) Save customer + order.
    // PayPal has already taken the money and nothing will redeliver this, so a
    // failed save must not fail the request (the buyer might pay twice). The
    // owner is emailed after the CJ step instead.
    let saveError = '';
    try {
      const customerId = await upsertCustomer({
        email: shipping.email,
        name: shipping.fullName,
        phone: shipping.phone
      });
      await saveOrder({
        id: orderId,
        customerId,
        totalCents: cents,
        currency: 'USD',
        status: 'paid',
        paymentProvider: 'paypal',
        paymentId: data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId,
        shipping,
        items
      });
    } catch (e: any) {
      console.error('DB save failed (PayPal)', e);
      saveError = e?.message || String(e);
    }

    // 1b) Record coupon redemption (idempotent — keyed on order id)
    if (couponCode) {
      try {
        await redeemCoupon(String(couponCode), orderId, shipping.email);
      } catch (e) {
        console.error('Coupon redemption failed (PayPal)', e);
      }
    }

    // 2) Email customer + admin
    try {
      if (shipping.email) {
        await sendOrderConfirmation({
          to: shipping.email,
          orderId,
          totalCents: cents,
          items,
          shipping
        });
      }
    } catch (e) {
      console.error('Email send failed (PayPal)', e);
    }

    // 3) Order from CJ — the size/colour the shopper chose (lib/fulfilment.ts).
    let cjSummary = 'Check CJ to see whether anything was ordered.';
    try {
      cjSummary = await fulfilOrder({
        orderId,
        provider: 'PayPal',
        lines: items,
        shipping
      });
    } catch (e) {
      console.error('CJ fulfillment after PayPal capture failed', e);
    }

    if (saveError) {
      await sendOrderSaveFailedAlert({
        orderId,
        provider: 'PayPal',
        totalCents: cents,
        items,
        shipping,
        nextStep:
          `This order will not appear in /admin/orders. ${cjSummary} Check CJ, and place ` +
          'anything missing by hand.',
        error: saveError
      });
    }

    // 4) Mark registry items as purchased and notify the registry owner
    // Cart items carry registryId + registryItemId when added from a registry page.
    try {
      type CartItemWithReg = { productId: string; qty: number; registryId?: string; registryItemId?: number };
      const cartItems = items as CartItemWithReg[];
      const registrySnap = cartItems.filter((i) => i.registryId && i.registryItemId != null);

      if (registrySnap.length) {
        await ensureRegistrySchema();

        const byRegistry = new Map<string, CartItemWithReg[]>();
        for (const ri of registrySnap) {
          if (!byRegistry.has(ri.registryId!)) byRegistry.set(ri.registryId!, []);
          byRegistry.get(ri.registryId!)!.push(ri);
        }

        for (const [registryId, regItems] of byRegistry) {
          for (const ri of regItems) {
            await markItemPurchased(ri.registryItemId!, ri.qty);
          }
          const registry = await findRegistryById(registryId);
          if (registry) {
            const enriched = await enrichRegistryItems(await getRegistryItems(registryId));
            const giftedItems = regItems.map((ri) => ({
              productName: enriched.find((e) => e.id === ri.registryItemId)?.name ?? 'Item',
              qty: ri.qty,
            }));
            await sendRegistryGiftNotification({
              to: registry.email,
              ownerName: registry.owner_name,
              registryTitle: registry.title,
              registryId,
              giftedItems,
            });
          }
        }
      }
    } catch (e) {
      console.error('Registry purchase processing failed (PayPal)', e);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('PayPal capture error', e);
    return NextResponse.json({ error: e.message || 'PayPal error' }, { status: 500 });
  }
}
