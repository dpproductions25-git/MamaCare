import { sql } from '@vercel/postgres';
import crypto from 'crypto';

/**
 * Shipping settings + database-backed discount codes.
 *
 * Everything here is idempotent (CREATE TABLE IF NOT EXISTS) and every public
 * function calls ensureCommerceSchema() first, so routes never need to
 * bootstrap manually.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShippingSettings = {
  /** Order subtotal at or above which shipping is free (dollars) */
  freeThreshold: number;
  /** Flat shipping charge below the threshold (dollars) */
  flatRate: number;
};

export const DEFAULT_SHIPPING: ShippingSettings = { freeThreshold: 50, flatRate: 6.99 };

export type DbCoupon = {
  code: string;
  type: 'free-shipping' | 'percent' | 'fixed';
  value: number | null;
  description: string;
  active: boolean;
  expires_at: string | null;
  min_subtotal: number | null;
  /** Max total redemptions across all customers; null = unlimited */
  max_redemptions: number | null;
  times_redeemed: number;
  /** True for auto-generated per-customer codes that die after one use */
  single_use: boolean;
  /** Email this single-use code was issued to (null for public codes) */
  issued_to: string | null;
  created_at: string;
};

// ── Schema ────────────────────────────────────────────────────────────────────

export async function ensureCommerceSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      value NUMERIC,
      description TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      min_subtotal NUMERIC,
      max_redemptions INT,
      times_redeemed INT NOT NULL DEFAULT 0,
      single_use BOOLEAN NOT NULL DEFAULT FALSE,
      issued_to TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_coupons_issued ON coupons(issued_to);`;
  // Records which order consumed which code — prevents double-counting on
  // webhook retries, which Stripe does routinely.
  await sql`
    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      order_id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      email TEXT,
      redeemed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_redemptions_code ON coupon_redemptions(code);`;
}

// ── Shipping settings ─────────────────────────────────────────────────────────

export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    await ensureCommerceSchema();
    const r = await sql<{ key: string; value: string }>`
      SELECT key, value FROM store_settings
      WHERE key IN ('shipping_free_threshold', 'shipping_flat_rate');
    `;
    const map = Object.fromEntries(r.rows.map((x) => [x.key, x.value]));
    const threshold = Number(map['shipping_free_threshold']);
    const flat = Number(map['shipping_flat_rate']);
    return {
      freeThreshold: Number.isFinite(threshold) ? threshold : DEFAULT_SHIPPING.freeThreshold,
      flatRate: Number.isFinite(flat) ? flat : DEFAULT_SHIPPING.flatRate,
    };
  } catch {
    return DEFAULT_SHIPPING; // DB unavailable — fall back to defaults
  }
}

export async function saveShippingSettings(s: ShippingSettings, updatedBy: string) {
  await ensureCommerceSchema();
  await sql`
    INSERT INTO store_settings (key, value, updated_by, updated_at)
    VALUES ('shipping_free_threshold', ${String(s.freeThreshold)}, ${updatedBy}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value,
      updated_by = EXCLUDED.updated_by, updated_at = NOW();
  `;
  await sql`
    INSERT INTO store_settings (key, value, updated_by, updated_at)
    VALUES ('shipping_flat_rate', ${String(s.flatRate)}, ${updatedBy}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value,
      updated_by = EXCLUDED.updated_by, updated_at = NOW();
  `;
}

// ── Coupons ───────────────────────────────────────────────────────────────────

export async function listCoupons(limit = 500): Promise<DbCoupon[]> {
  await ensureCommerceSchema();
  const r = await sql<DbCoupon>`
    SELECT * FROM coupons ORDER BY created_at DESC LIMIT ${limit};
  `;
  return r.rows;
}

export async function getCoupon(code: string): Promise<DbCoupon | null> {
  await ensureCommerceSchema();
  const r = await sql<DbCoupon>`
    SELECT * FROM coupons WHERE code = ${code.trim().toUpperCase()};
  `;
  return r.rows[0] || null;
}

export async function upsertCoupon(c: {
  code: string;
  type: 'free-shipping' | 'percent' | 'fixed';
  value?: number | null;
  description?: string;
  active?: boolean;
  expiresAt?: string | null;
  minSubtotal?: number | null;
  maxRedemptions?: number | null;
  singleUse?: boolean;
  issuedTo?: string | null;
}): Promise<DbCoupon> {
  await ensureCommerceSchema();
  const code = c.code.trim().toUpperCase();
  const r = await sql<DbCoupon>`
    INSERT INTO coupons (code, type, value, description, active, expires_at,
                         min_subtotal, max_redemptions, single_use, issued_to)
    VALUES (
      ${code}, ${c.type}, ${c.value ?? null}, ${c.description ?? ''},
      ${c.active ?? true}, ${c.expiresAt || null}, ${c.minSubtotal ?? null},
      ${c.maxRedemptions ?? null}, ${c.singleUse ?? false}, ${c.issuedTo ?? null}
    )
    ON CONFLICT (code) DO UPDATE SET
      type = EXCLUDED.type,
      value = EXCLUDED.value,
      description = EXCLUDED.description,
      active = EXCLUDED.active,
      expires_at = EXCLUDED.expires_at,
      min_subtotal = EXCLUDED.min_subtotal,
      max_redemptions = EXCLUDED.max_redemptions
    RETURNING *;
  `;
  return r.rows[0];
}

export async function setCouponActive(code: string, active: boolean) {
  await ensureCommerceSchema();
  await sql`UPDATE coupons SET active = ${active} WHERE code = ${code.toUpperCase()};`;
}

export async function deleteCoupon(code: string) {
  await ensureCommerceSchema();
  await sql`DELETE FROM coupons WHERE code = ${code.toUpperCase()};`;
}

// ── Validation ────────────────────────────────────────────────────────────────

export type CouponCheck =
  | { ok: true; coupon: DbCoupon }
  | { ok: false; reason: string };

/**
 * Full server-side validation. Never trust a code coming from the client —
 * always run it through here before applying a discount.
 */
export async function validateCoupon(
  codeInput: string | null | undefined,
  subtotal: number
): Promise<CouponCheck> {
  if (!codeInput || !codeInput.trim()) return { ok: false, reason: 'No code provided.' };

  const coupon = await getCoupon(codeInput);
  if (!coupon) return { ok: false, reason: 'That code isn’t valid.' };
  if (!coupon.active) return { ok: false, reason: 'That code is no longer active.' };

  // Expiry is inclusive of the whole day. The admin form sends a date only
  // ("2026-08-01"), which parses to midnight — without this, a code set to
  // expire today would already be dead the moment it was saved.
  if (coupon.expires_at) {
    const exp = new Date(coupon.expires_at);
    exp.setHours(23, 59, 59, 999);
    if (exp.getTime() < Date.now()) {
      return { ok: false, reason: 'That code has expired.' };
    }
  }
  if (coupon.max_redemptions != null && coupon.times_redeemed >= coupon.max_redemptions) {
    return { ok: false, reason: 'That code has already been fully redeemed.' };
  }
  if (coupon.single_use && coupon.times_redeemed > 0) {
    return { ok: false, reason: 'That code has already been used.' };
  }
  if (coupon.min_subtotal != null && subtotal < Number(coupon.min_subtotal)) {
    return {
      ok: false,
      reason: `Spend $${Number(coupon.min_subtotal).toFixed(2)} to use this code.`,
    };
  }
  return { ok: true, coupon };
}

/**
 * Record a redemption after a *successful payment*.
 * Keyed on order_id so Stripe webhook retries can't inflate the counter.
 */
export async function redeemCoupon(code: string, orderId: string, email?: string) {
  await ensureCommerceSchema();
  const upper = code.trim().toUpperCase();
  const ins = await sql`
    INSERT INTO coupon_redemptions (order_id, code, email)
    VALUES (${orderId}, ${upper}, ${email ?? null})
    ON CONFLICT (order_id) DO NOTHING
    RETURNING order_id;
  `;
  // Only bump the counter if this order hadn't already been recorded
  if (ins.rows.length > 0) {
    await sql`UPDATE coupons SET times_redeemed = times_redeemed + 1 WHERE code = ${upper};`;
    await sql`UPDATE coupons SET active = FALSE WHERE code = ${upper} AND single_use = TRUE;`;
  }
}

// ── Single-use code generation ────────────────────────────────────────────────

// Ambiguous characters (0/O, 1/I) removed so codes are easy to read aloud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(prefix: string, len = 6): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}-${out}`;
}

/**
 * Create a unique single-use code. Retries on the (very unlikely) collision.
 */
export async function generateSingleUseCode(opts: {
  prefix?: string;
  type: 'free-shipping' | 'percent' | 'fixed';
  value?: number | null;
  description?: string;
  expiresAt?: string | null;
  minSubtotal?: number | null;
  issuedTo?: string | null;
}): Promise<DbCoupon> {
  await ensureCommerceSchema();
  const prefix = (opts.prefix || 'MAMA').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MAMA';

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode(prefix);
    const existing = await sql`SELECT 1 FROM coupons WHERE code = ${code};`;
    if (existing.rows.length) continue;

    return upsertCoupon({
      code,
      type: opts.type,
      value: opts.value ?? null,
      description: opts.description || 'Single-use welcome code',
      active: true,
      expiresAt: opts.expiresAt ?? null,
      minSubtotal: opts.minSubtotal ?? null,
      maxRedemptions: 1,
      singleUse: true,
      issuedTo: opts.issuedTo ?? null,
    });
  }
  throw new Error('Could not generate a unique code — please try again.');
}

/** Batch generation for manual campaigns. */
export async function generateCodeBatch(
  count: number,
  opts: Parameters<typeof generateSingleUseCode>[0]
): Promise<DbCoupon[]> {
  const n = Math.max(1, Math.min(200, Math.floor(count)));
  const out: DbCoupon[] = [];
  for (let i = 0; i < n; i++) out.push(await generateSingleUseCode(opts));
  return out;
}

/** Reuse an existing unredeemed code for this email rather than issuing a new one. */
export async function findUnusedCodeForEmail(email: string): Promise<DbCoupon | null> {
  await ensureCommerceSchema();
  const r = await sql<DbCoupon>`
    SELECT * FROM coupons
    WHERE issued_to = ${email.toLowerCase()}
      AND single_use = TRUE AND times_redeemed = 0 AND active = TRUE
    ORDER BY created_at DESC LIMIT 1;
  `;
  return r.rows[0] || null;
}
