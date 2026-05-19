import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { products } from '@/lib/products';
import { SITE_URL } from '@/lib/seo';
import { findCoupon, calculateTotals } from '@/lib/coupons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: { productId: string; qty: number; variantId?: string }[] = body.items || [];
    const shippingAddress = body.shippingAddress;
    const couponCode: string | undefined = body.couponCode || undefined;

    if (!items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const stripe = getStripe();
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    for (const it of items) {
      const p = products.find((x) => x.id === it.productId);
      if (!p) continue;
      const variant = it.variantId ? p.variants?.find((v) => v.vid === it.variantId) : undefined;
      const price = variant?.price ?? p.price;
      const variantLabel = variant ? ` (${variant.name})` : '';
      subtotal += price * it.qty;
      line_items.push({
        quantity: it.qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(price * 100),
          product_data: {
            name: `${p.name}${variantLabel}`,
            images: [variant?.image || p.image],
            metadata: {
              productId: p.id,
              variantId: variant?.vid || '',
              cjProductId: p.cjProductId || '',
              cjVariantId: variant?.vid || p.cjVariantId || ''
            }
          }
        }
      });
    }

    // Apply coupon server-side (do NOT trust the client to compute the discount)
    const { coupon, discount, shipping } = calculateTotals(subtotal, couponCode);

    // Add coupon as a negative line item if it applies a $ discount
    if (coupon && discount > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: -Math.round(discount * 100),
          product_data: { name: `Discount (${coupon.code})` }
        }
      });
    }

    // Shipping line
    const shippingCents = Math.round(shipping * 100);
    if (shippingCents > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: shippingCents,
          product_data: { name: 'Shipping' }
        }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${SITE_URL}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/checkout`,
      customer_email: shippingAddress?.email,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE'] },
      metadata: {
        productSnapshot: JSON.stringify(items),
        shippingAddress: JSON.stringify(shippingAddress || {}),
        couponCode: coupon?.code || ''
      }
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error('Stripe checkout error', err);
    return NextResponse.json({ error: err.message || 'Stripe error' }, { status: 500 });
  }
}
