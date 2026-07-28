import { NextResponse } from 'next/server';
import { getMergedProducts } from '@/lib/product-overrides';
import { resolveTotals } from '@/lib/pricing';
import { calculateTax } from '@/lib/tax';
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

    // Full catalog including admin-created products — see the note in the
    // Stripe route. The static-only list silently dropped custom products.
    const products = await getMergedProducts();

    let subtotal = 0;
    const ppItems = items.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      if (!p) {
        console.error(`[checkout/paypal] unknown productId "${i.productId}"`);
        throw new Error('One of the items in your cart is no longer available. Please remove it and try again.');
      }
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

    // PayPal, like Stripe, cannot process a $0 order.
    if (total <= 0) {
      return NextResponse.json(
        { error: 'This order totals $0.00, so there is nothing to charge. Please check the item prices in your cart.' },
        { status: 400 }
      );
    }

    /**
     * PayPal has no automatic tax service, so we use Stripe's Tax Calculation
     * API here too. Using a different engine per payment method would charge
     * two different totals for the same cart.
     *
     * Tax is based on the BILLING address the customer entered at checkout.
     */
    const billing = body.shippingAddress || {};
    const tax = await calculateTax({
      taxableAmount: Math.max(0, subtotal - discount),
      shipping,
      address: {
        line1: billing.line1,
        line2: billing.line2,
        city: billing.city,
        state: billing.state,
        postalCode: billing.postalCode,
        country: billing.country,
      },
    });

    const grandTotal = +(total + tax).toFixed(2);

    const breakdown: Record<string, { currency_code: string; value: string }> = {
      item_total: { currency_code: 'USD', value: subtotal.toFixed(2) },
      shipping:   { currency_code: 'USD', value: shipping.toFixed(2) }
    };
    if (discount > 0) breakdown.discount = { currency_code: 'USD', value: discount.toFixed(2) };
    if (tax > 0) breakdown.tax_total = { currency_code: 'USD', value: tax.toFixed(2) };

    const token = await paypalToken();
    const r = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: grandTotal.toFixed(2), breakdown },
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
