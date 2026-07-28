import Stripe from 'stripe';

/**
 * Sales tax calculation.
 *
 * Stripe Checkout handles its own tax via `automatic_tax`, but PayPal has no
 * equivalent — so we use Stripe's Tax Calculation API there to keep both
 * payment methods charging identical tax. Using two different tax engines
 * would produce different totals for the same cart.
 *
 * REQUIRES: Stripe Tax activated in the Stripe Dashboard, with your origin
 * address and tax registrations configured. Until then leave
 * STRIPE_AUTOMATIC_TAX unset — enabling it without registrations configured
 * makes Stripe reject checkout sessions outright.
 */

export const TAX_ENABLED = process.env.STRIPE_AUTOMATIC_TAX === 'true';

export type TaxAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * Returns tax in dollars for an order. Returns 0 when tax is disabled or the
 * address is too incomplete to determine a jurisdiction.
 *
 * Never throws — a tax service outage must not block a customer from paying.
 * A failure is logged loudly and treated as $0, which is the same behaviour as
 * before tax existed.
 */
export async function calculateTax(opts: {
  /** Post-discount goods total, in dollars */
  taxableAmount: number;
  /** Shipping charge, in dollars */
  shipping: number;
  address: TaxAddress;
}): Promise<number> {
  if (!TAX_ENABLED) return 0;
  if (opts.taxableAmount <= 0) return 0;

  const { address } = opts;
  // Stripe needs at least a country, and realistically postal code + state
  // to resolve a US jurisdiction.
  if (!address?.country) return 0;

  const stripe = getStripe();
  if (!stripe) {
    console.error('[tax] STRIPE_SECRET_KEY missing — cannot calculate tax');
    return 0;
  }

  try {
    const calc = await stripe.tax.calculations.create({
      currency: 'usd',
      line_items: [
        {
          amount: Math.round(opts.taxableAmount * 100),
          reference: 'order-subtotal',
          tax_behavior: 'exclusive',
        },
      ],
      shipping_cost:
        opts.shipping > 0
          ? { amount: Math.round(opts.shipping * 100), tax_behavior: 'exclusive' }
          : undefined,
      customer_details: {
        address: {
          line1: address.line1 || undefined,
          line2: address.line2 || undefined,
          city: address.city || undefined,
          state: address.state || undefined,
          postal_code: address.postalCode || undefined,
          country: address.country,
        },
        // Tax is determined by where the customer is billed.
        address_source: 'billing',
      },
    });

    const taxCents = calc.tax_amount_exclusive ?? 0;
    console.log(
      `[tax] calculated $${(taxCents / 100).toFixed(2)} for ${address.country}/${address.state || '—'} ${address.postalCode || ''}`
    );
    return +(taxCents / 100).toFixed(2);
  } catch (e: any) {
    // Most common cause: Stripe Tax not activated, or no registration for this
    // jurisdiction. Charging $0 tax is the safe failure mode for the customer.
    console.error('[tax] calculation FAILED — charging $0 tax:', e?.message);
    return 0;
  }
}
