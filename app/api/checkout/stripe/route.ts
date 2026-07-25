import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { products as staticProducts } from '@/lib/products';
import { getAllOverrides } from '@/lib/db';
import { applyOverridesToProducts } from '@/lib/product-overrides';
import { SITE_URL } from '@/lib/seo';
import { resolveTotals } from '@/lib/pricing';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return new Stripe(key);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`checkout:stripe:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const items: {
      productId: string;
      qty: number;
      variantId?: string;
      registryId?: string;
      registryItemId?: number;
    }[] = body.items || [];
    const shippingAddress = body.shippingAddress;
    const couponCode: string | undefined = body.couponCode || undefined;

    if (!items.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

    // Apply admin overrides server-side — never trust the client's price.
    const overrides = await getAllOverrides();
    const products = applyOverridesToProducts(staticProducts, overrides);

    const stripe = getStripe();
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    for (const it of items) {
      const p = products.find((x) => x.id === it.productId);
      if (!p) continue;
      if (!p.inStock) {
        return NextResponse.json({ error: `${p.name} is out of stock.` }, { status: 400 });
      }
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

    // Collect registry metadata from cart items (set when adding from a registry page).
    // Stripe metadata values are capped at 500 chars, so we use a compact encoding
    // grouped by registry:  registryId~itemId:qty,itemId:qty;registryId2~itemId:qty
    // Product names are resolved from the DB in the webhook, not carried here.
    const regGroups = new Map<string, string[]>();
    for (const it of items) {
      if (!it.registryId || it.registryItemId == null) continue;
      if (!regGroups.has(it.registryId)) regGroups.set(it.registryId, []);
      regGroups.get(it.registryId)!.push(`${it.registryItemId}:${it.qty}`);
    }
    const registrySnapshot = Array.from(regGroups.entries())
      .map(([rid, pairs]) => `${rid}~${pairs.join(',')}`)
      .join(';')
      .slice(0, 490); // hard safety cap under Stripe's 500-char limit

    // Authoritative pricing — DB coupons + admin shipping settings.
    const totals = await resolveTotals(subtotal, couponCode);
    const { discount, shipping, appliedCode } = totals;

    if (totals.couponError && !appliedCode) {
      return NextResponse.json({ error: totals.couponError }, { status: 400 });
    }

    if (appliedCode && discount > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: -Math.round(discount * 100),
          product_data: { name: `Discount (${appliedCode})` }
        }
      });
    }

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
        couponCode: appliedCode || '',
        registrySnapshot,
      }
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error('Stripe checkout error', err);
    return NextResponse.json({ error: err.message || 'Stripe error' }, { status: 500 });
  }
}
