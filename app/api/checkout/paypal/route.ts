import { NextResponse } from 'next/server';
import { products as staticProducts } from '@/lib/products';
import { getAllOverrides } from '@/lib/db';
import { applyOverridesToProducts } from '@/lib/product-overrides';
import { resolveTotals } from '@/lib/pricing';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function paypalBase() {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
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
  if (!r.ok) throw new Error(`PayPal auth failed: ${r.status}`);
  return (await r.json()).access_token;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`checkout:paypal:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const items: { productId: string; qty: number; variantId?: string }[] = body.items || [];
    const couponCode: string | undefined = body.couponCode || undefined;
    if (!items.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

    // Apply admin overrides server-side
    const overrides = await getAllOverrides();
    const products = applyOverridesToProducts(staticProducts, overrides);

    let subtotal = 0;
    const ppItems = items.map((i) => {
      const p = products.find((x) => x.id === i.productId)!;
      if (!p.inStock) throw new Error(`${p.name} is out of stock.`);
      const variant = i.variantId ? p.variants?.find((v) => v.vid === i.variantId) : undefined;
      const price = variant?.price ?? p.price;
      subtotal += price * i.qty;
      return {
        name: (variant ? `${p.name} (${variant.name})` : p.name).slice(0, 127),
        quantity: String(i.qty),
        unit_amount: { currency_code: 'USD', value: price.toFixed(2) },
        sku: variant?.vid || p.id
      };
    });

    // Authoritative pricing — DB coupons + admin shipping settings
    const totals = await resolveTotals(subtotal, couponCode);
    const { discount, shipping, total, appliedCode } = totals;

    if (totals.couponError && !appliedCode) {
      return NextResponse.json({ error: totals.couponError }, { status: 400 });
    }

    const breakdown: Record<string, { currency_code: string; value: string }> = {
      item_total: { currency_code: 'USD', value: subtotal.toFixed(2) },
      shipping:   { currency_code: 'USD', value: shipping.toFixed(2) }
    };
    if (discount > 0) breakdown.discount = { currency_code: 'USD', value: discount.toFixed(2) };

    const token = await paypalToken();
    const r = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: total.toFixed(2), breakdown },
          items: ppItems,
          custom_id: appliedCode || undefined
        }],
        application_context: {
          brand_name: 'MamaCare',
          user_action: 'PAY_NOW',
          shipping_preference: 'GET_FROM_FILE'
        }
      })
    });
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ error: data?.message || 'PayPal error' }, { status: r.status });
    return NextResponse.json({ id: data.id });
  } catch (e: any) {
    console.error('PayPal create error', e);
    return NextResponse.json({ error: e.message || 'PayPal error' }, { status: 500 });
  }
}
