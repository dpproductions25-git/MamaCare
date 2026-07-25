import { NextResponse } from 'next/server';
import { createOrder as createCjOrder } from '@/lib/cj';
import { products } from '@/lib/products';
import { upsertCustomer, saveOrder, setCjOrderId } from '@/lib/db';
import { sendOrderConfirmation, sendRegistryGiftNotification } from '@/lib/email';
import { markItemPurchased, findRegistryById, getRegistryItems, ensureRegistrySchema } from '@/lib/db-registry';
import { enrichRegistryItems } from '@/lib/registry-enrich';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function paypalBase() {
  const env = process.env.PAYPAL_ENV || 'sandbox';
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

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
    const { orderId, items, shippingAddress } = await req.json();
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
    const shipping = shippingAddress || {};

    // 1) Save customer + order
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
    } catch (e) {
      console.error('DB save failed (PayPal)', e);
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

    // 3) CJ fulfillment
    try {
      const cjItems = (items as { productId: string; qty: number }[])
        .map((s) => {
          const p = products.find((x) => x.id === s.productId);
          return p?.cjVariantId ? { vid: p.cjVariantId, quantity: s.qty } : null;
        })
        .filter(Boolean) as { vid: string; quantity: number }[];

      if (cjItems.length && shipping && process.env.CJ_API_KEY) {
        const cj = await createCjOrder({
          orderNumber: orderId,
          shippingZip: shipping.postalCode,
          shippingCountryCode: shipping.country,
          shippingProvince: shipping.state,
          shippingCity: shipping.city,
          shippingAddress: [shipping.line1, shipping.line2].filter(Boolean).join(', '),
          shippingCustomerName: shipping.fullName,
          shippingPhone: shipping.phone || '',
          remark: 'MamaCare order',
          products: cjItems
        });
        if ((cj as any)?.orderId) await setCjOrderId(orderId, String((cj as any).orderId));
      }
    } catch (e) {
      console.error('CJ fulfillment after PayPal capture failed', e);
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
