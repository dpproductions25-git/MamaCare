import { NextResponse } from 'next/server';
import { products } from '@/lib/products';
import { calculateTotals } from '@/lib/coupons';

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
  try {
    const body = await req.json();
    const items: { productId: string; qty: number; variantId?: string }[] = body.items || [];
    const couponCode: string | undefined = body.couponCode || undefined;
    if (!items.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

    let subtotal = 0;
    const ppItems = items.map((i) => {
      const p = products.find((x) => x.id === i.productId)!;
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

    // Server-side coupon math
    const { coupon, discount, shipping, total } = calculateTotals(subtotal, couponCode);

    const breakdown: Record<string, { currency_code: string; value: string }> = {
      item_total: { currency_code: 'USD', value: subtotal.toFixed(2) },
      shipping:   { currency_code: 'USD', value: shipping.toFixed(2) }
    };
    if (discount > 0) {
      breakdown.discount = { currency_code: 'USD', value: discount.toFixed(2) };
    }

    const token = await paypalToken();
    const r = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: total.toFixed(2),
            breakdown
          },
          items: ppItems,
          custom_id: coupon?.code || undefined
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
