/**
 * Single source of truth for which PayPal environment we're talking to.
 *
 * This used to be duplicated in two routes, each comparing PAYPAL_ENV against
 * 'live' with a plain === and defaulting to sandbox. That made a very
 * expensive typo possible: "Live", "LIVE", or a value with a trailing space
 * silently resolved to SANDBOX. Checkout would look perfect — customer pays,
 * success page shows, order saves — while the payment was simulated and no
 * money ever arrived.
 *
 * Normalising here means the two routes can never disagree, and a malformed
 * value is reported rather than quietly downgrading to fake payments.
 */

export type PayPalEnv = 'live' | 'sandbox';

export function paypalEnv(): PayPalEnv {
  const raw = (process.env.PAYPAL_ENV || '').trim().toLowerCase();

  if (raw === 'live' || raw === 'production') return 'live';
  if (raw === 'sandbox' || raw === '') return 'sandbox';

  // Anything else is a typo. Fail safe to sandbox, but say so loudly — this is
  // the difference between collecting money and not.
  console.error(
    `[paypal] PAYPAL_ENV="${process.env.PAYPAL_ENV}" is not recognised. ` +
    `Expected "live" or "sandbox". Falling back to SANDBOX — no real payments will be taken.`
  );
  return 'sandbox';
}

export function paypalBase(): string {
  return paypalEnv() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}
