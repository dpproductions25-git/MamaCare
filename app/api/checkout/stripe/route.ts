import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getMergedProducts } from '@/lib/product-overrides';
import { resolveOrigin } from '@/lib/seo';
import { TAX_ENABLED } from '@/lib/tax';
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

  const origin = resolveOrigin(req);

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

    /**
     * Full catalog — static products WITH admin overrides applied, PLUS products
     * created in the admin panel.
     *
     * This used to be applyOverridesToProducts(staticProducts, overrides), which
     * only covered static products. Anything created in admin was not found
     * below, hit the `continue`, and silently vanished from line_items — leaving
     * Stripe to reject the whole order with "line_items is required".
     * Prices still come from the server, never from the client.
     */
    const products = await getMergedProducts();

    const stripe = getStripe();
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    for (const it of items) {
      const p = products.find((x) => x.id === it.productId);
      if (!p) {
        // Fail loudly rather than quietly dropping the item.
        console.error(`[checkout/stripe] unknown productId "${it.productId}"`);
        return NextResponse.json(
          { error: 'One of the items in your cart is no longer available. Please remove it and try again.' },
          { status: 400 }
        );
      }
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
          // Prices are entered exclusive of tax — Stripe Tax adds it on top.
          tax_behavior: 'exclusive',
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

    if (registrySnapshot) {
      console.log(`[checkout/stripe] registry purchase detected: ${registrySnapshot}`);
    }

    // Authoritative pricing — DB coupons + admin shipping settings.
    const totals = await resolveTotals(subtotal, couponCode);
    const { discount, shipping, appliedCode } = totals;

    if (totals.couponError && !appliedCode) {
      return NextResponse.json({ error: totals.couponError }, { status: 400 });
    }

    // Stripe cannot create a payment session for $0. This happens with a
    // free/test product or a 100% discount — give a clear reason instead of
    // letting Stripe return a cryptic error.
    if (totals.total <= 0) {
      return NextResponse.json(
        { error: 'This order totals $0.00, so there is nothing to charge. Please check the item prices in your cart.' },
        { status: 400 }
      );
    }

    /**
     * Discounts must go through Stripe's own coupon object, NOT a negative
     * line item. `unit_amount` has to be non-negative, so the old approach made
     * Stripe reject every discounted order — and negative line items are also
     * incompatible with automatic tax. A one-off coupon lets Stripe apply the
     * discount before calculating tax, which is the correct order.
     */
    let stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (appliedCode && discount > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(discount * 100),
          currency: 'usd',
          duration: 'once',
          name: `Discount (${appliedCode})`,
          max_redemptions: 1,
        });
        stripeDiscounts = [{ coupon: coupon.id }];
      } catch (e: any) {
        console.error('[checkout/stripe] could not create discount coupon:', e?.message);
        return NextResponse.json(
          { error: 'We could not apply that discount. Please try again.' },
          { status: 500 }
        );
      }
    }

    /**
     * Shipping goes through shipping_options rather than a line item so Stripe
     * Tax can apply the correct rate — shipping is taxable in some US states
     * and not others, and it can't work that out from a generic product line.
     */
    const shippingCents = Math.round(shipping * 100);
    const shipping_options: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
      shippingCents > 0
        ? [{
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: shippingCents, currency: 'usd' },
              display_name: 'Standard shipping',
              tax_behavior: 'exclusive',
            },
          }]
        : [];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      ...(stripeDiscounts ? { discounts: stripeDiscounts } : {}),
      ...(shipping_options.length ? { shipping_options } : {}),
      // Tax is determined by the billing address, so it must be collected.
      billing_address_collection: 'required',
      // Off unless STRIPE_AUTOMATIC_TAX=true — enabling this without tax
      // registrations set up in the Stripe Dashboard makes Stripe reject
      // every session, which would take checkout down entirely.
      automatic_tax: { enabled: TAX_ENABLED },
      // Built from the request origin, not a config constant — a stale
      // NEXT_PUBLIC_SITE_URL used to drop paying customers on a dead
      // deployment's 404 page after checkout.
      success_url: `${origin}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      customer_email: shippingAddress?.email,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE'] },
      metadata: {
        // Only the fields the webhook needs. Serialising the whole cart item
        // pushed this toward Stripe's 500-char-per-value metadata limit once
        // registry fields were added — and an oversized value makes Stripe
        // reject the entire session. Registry data lives in registrySnapshot.
        productSnapshot: JSON.stringify(
          items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            ...(i.variantId ? { variantId: i.variantId } : {}),
          }))
        ).slice(0, 490),
        shippingAddress: JSON.stringify(shippingAddress || {}).slice(0, 490),
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
