import { sql } from '@vercel/postgres';
import crypto from 'crypto';

export type DbRegistry = {
  id: string;
  email: string;
  owner_name: string;
  title: string;
  created_at: string;
};

export type DbRegistryItem = {
  id: number;
  registry_id: string;
  product_id: string;
  variant_id: string | null;
  qty_wanted: number;
  qty_purchased: number;
  note: string | null;
  added_at: string;
};

// ── Pin helpers ───────────────────────────────────────────────────────────────

function makeStoredPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  try {
    const derived = crypto.scryptSync(pin, salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// ── Schema ────────────────────────────────────────────────────────────────────

export async function ensureRegistrySchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS registries (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      owner_name TEXT NOT NULL DEFAULT 'Mom',
      title TEXT NOT NULL DEFAULT 'My Baby Registry',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_registries_email ON registries(email);`;
  await sql`
    CREATE TABLE IF NOT EXISTS registry_items (
      id SERIAL PRIMARY KEY,
      registry_id TEXT NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      qty_wanted INT NOT NULL DEFAULT 1,
      qty_purchased INT NOT NULL DEFAULT 0,
      note TEXT,
      added_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_registry_items_rid ON registry_items(registry_id);`;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createRegistry({
  email, pin, ownerName, title,
}: {
  email: string; pin: string; ownerName: string; title?: string;
}): Promise<DbRegistry> {
  await ensureRegistrySchema();
  const id = crypto.randomBytes(8).toString('hex');
  const pinHash = makeStoredPin(pin);
  const t = title || 'My Baby Registry';
  await sql`
    INSERT INTO registries (id, email, pin_hash, owner_name, title)
    VALUES (${id}, ${email.toLowerCase()}, ${pinHash}, ${ownerName}, ${t});
  `;
  return { id, email: email.toLowerCase(), owner_name: ownerName, title: t, created_at: new Date().toISOString() };
}

export async function findRegistryByEmail(email: string): Promise<DbRegistry | null> {
  const r = await sql<DbRegistry>`
    SELECT id, email, owner_name, title, created_at FROM registries WHERE email = ${email.toLowerCase()};
  `;
  return r.rows[0] || null;
}

export async function findRegistryById(id: string): Promise<DbRegistry | null> {
  const r = await sql<DbRegistry>`
    SELECT id, email, owner_name, title, created_at FROM registries WHERE id = ${id};
  `;
  return r.rows[0] || null;
}

export async function verifyRegistryPin(id: string, pin: string): Promise<boolean> {
  const r = await sql<{ pin_hash: string }>`SELECT pin_hash FROM registries WHERE id = ${id};`;
  if (!r.rows[0]) return false;
  return verifyPin(pin, r.rows[0].pin_hash);
}

export async function verifyRegistryByEmail(
  email: string, pin: string
): Promise<DbRegistry | null> {
  const r = await sql<DbRegistry & { pin_hash: string }>`
    SELECT id, email, pin_hash, owner_name, title, created_at
    FROM registries WHERE email = ${email.toLowerCase()};
  `;
  if (!r.rows[0]) return null;
  if (!verifyPin(pin, r.rows[0].pin_hash)) return null;
  const { pin_hash: _ph, ...reg } = r.rows[0];
  return reg;
}

export async function getRegistryItems(registryId: string): Promise<DbRegistryItem[]> {
  const r = await sql<DbRegistryItem>`
    SELECT * FROM registry_items WHERE registry_id = ${registryId} ORDER BY added_at DESC;
  `;
  return r.rows;
}

export async function addRegistryItem({
  registryId, productId, variantId, qtyWanted, note,
}: {
  registryId: string; productId: string; variantId?: string | null;
  qtyWanted?: number; note?: string;
}): Promise<DbRegistryItem> {
  // Upsert: if same product+variant already in registry, bump qty
  const existing = await sql<DbRegistryItem>`
    SELECT * FROM registry_items
    WHERE registry_id = ${registryId}
      AND product_id = ${productId}
      AND (variant_id IS NOT DISTINCT FROM ${variantId ?? null})
    LIMIT 1;
  `;
  if (existing.rows[0]) {
    const r = await sql<DbRegistryItem>`
      UPDATE registry_items
      SET qty_wanted = qty_wanted + ${qtyWanted ?? 1}
      WHERE id = ${existing.rows[0].id}
      RETURNING *;
    `;
    return r.rows[0];
  }
  const r = await sql<DbRegistryItem>`
    INSERT INTO registry_items (registry_id, product_id, variant_id, qty_wanted, note)
    VALUES (${registryId}, ${productId}, ${variantId ?? null}, ${qtyWanted ?? 1}, ${note ?? null})
    RETURNING *;
  `;
  return r.rows[0];
}

export async function removeRegistryItem(itemId: number, registryId: string): Promise<void> {
  await sql`DELETE FROM registry_items WHERE id = ${itemId} AND registry_id = ${registryId};`;
}

/** Set the desired quantity. Never drops below what's already been purchased. */
export async function setRegistryItemQty(
  itemId: number, registryId: string, qtyWanted: number
): Promise<void> {
  await sql`
    UPDATE registry_items
    SET qty_wanted = GREATEST(${qtyWanted}, qty_purchased, 1)
    WHERE id = ${itemId} AND registry_id = ${registryId};
  `;
}

export async function markItemPurchased(itemId: number, qty: number): Promise<void> {
  await sql`
    UPDATE registry_items
    SET qty_purchased = LEAST(qty_purchased + ${qty}, qty_wanted)
    WHERE id = ${itemId};
  `;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export type AdminRegistryRow = DbRegistry & {
  item_count: number;
  total_wanted: number;
  total_purchased: number;
};

/** All registries with aggregate item stats — newest first. */
export async function listAllRegistries(limit = 500): Promise<AdminRegistryRow[]> {
  await ensureRegistrySchema();
  const r = await sql<AdminRegistryRow>`
    SELECT
      r.id, r.email, r.owner_name, r.title, r.created_at,
      COUNT(i.id)::int                        AS item_count,
      COALESCE(SUM(i.qty_wanted), 0)::int     AS total_wanted,
      COALESCE(SUM(i.qty_purchased), 0)::int  AS total_purchased
    FROM registries r
    LEFT JOIN registry_items i ON i.registry_id = r.id
    GROUP BY r.id, r.email, r.owner_name, r.title, r.created_at
    ORDER BY r.created_at DESC
    LIMIT ${limit};
  `;
  return r.rows;
}

/** Full item list for one registry (admin view — no PIN required). */
export async function adminGetRegistryDetail(id: string) {
  await ensureRegistrySchema();
  const registry = await findRegistryById(id);
  if (!registry) return null;
  const items = await getRegistryItems(id);
  return { registry, items };
}

/** Permanently delete a registry. registry_items cascade automatically. */
/**
 * Permanently delete a registry and its items.
 *
 * Returns how many registry rows were removed so callers can tell a real
 * deletion from a no-op. A bare DELETE reports success even when it matches
 * nothing, which is indistinguishable from "it worked" at the UI layer.
 *
 * Items are removed explicitly rather than relying on ON DELETE CASCADE — if
 * the tables were ever created without that constraint, the cascade silently
 * doesn't happen and the delete fails on the foreign key instead.
 */
export async function deleteRegistry(id: string): Promise<number> {
  await ensureRegistrySchema();

  const items = await sql`DELETE FROM registry_items WHERE registry_id = ${id};`;
  const reg = await sql`DELETE FROM registries WHERE id = ${id};`;

  console.log(
    `[deleteRegistry] id=${id} removed ${reg.rowCount ?? 0} registry row(s) and ${items.rowCount ?? 0} item(s)`
  );
  return reg.rowCount ?? 0;
}

/** Admin PIN reset — lets support help a mom who forgot her PIN. */
export async function adminResetRegistryPin(id: string, newPin: string): Promise<void> {
  await ensureRegistrySchema();
  await sql`UPDATE registries SET pin_hash = ${makeStoredPin(newPin)} WHERE id = ${id};`;
}
