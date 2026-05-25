import { sql } from '@vercel/postgres';
import type { Category, ProductVariant } from './types';

export type OrderStatus =
  | 'pending' | 'paid' | 'fulfilling' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type DbOrder = {
  id: string;
  customer_id: number;
  customer_email: string;
  customer_name: string | null;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  payment_provider: 'stripe' | 'paypal';
  payment_id: string;
  shipping_json: any;
  items_json: any;
  cj_order_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbOverride = {
  product_id: string;
  name: string | null;
  short_description: string | null;
  description: string | null;
  seo_description: string | null;
  price: number | null;
  compare_at_price: number | null;
  image: string | null;
  images_json: string[] | null;
  category: string | null;
  tags_json: string[] | null;
  cj_product_id: string | null;
  cj_variant_id: string | null;
  variants_json: ProductVariant[] | null;
  in_stock: boolean | null;
  best_seller: boolean | null;
  visible: boolean | null;
  updated_by: string | null;
  updated_at: string;
};

export type DbCustomProduct = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  seo_description: string | null;
  price: number;
  compare_at_price: number | null;
  image: string;
  images: string[] | null;
  category: Category;
  tags: string[] | null;
  variants_json: ProductVariant[] | null;
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  best_seller: boolean;
  visible: boolean;
  cj_product_id: string | null;
  cj_variant_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DbSiteConfig = {
  key: string;
  value: string;
  updated_by: string | null;
  updated_at: string;
};

export type DbAuditEntry = {
  id: number;
  actor: string;
  action: string;
  target: string;
  details: any;
  created_at: string;
};

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT, phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      total_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      payment_provider TEXT NOT NULL,
      payment_id TEXT NOT NULL,
      shipping_json JSONB, items_json JSONB,
      cj_order_id TEXT, tracking_number TEXT, tracking_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders(created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`;

  // Product overrides — extended with all editable fields
  await sql`
    CREATE TABLE IF NOT EXISTS product_overrides (
      product_id TEXT PRIMARY KEY,
      name TEXT,
      short_description TEXT,
      description TEXT,
      seo_description TEXT,
      price NUMERIC(10,2),
      compare_at_price NUMERIC(10,2),
      image TEXT,
      images_json JSONB,
      category TEXT,
      tags_json JSONB,
      cj_product_id TEXT,
      cj_variant_id TEXT,
      variants_json JSONB,
      in_stock BOOLEAN,
      best_seller BOOLEAN,
      visible BOOLEAN,
      updated_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  // Add columns if upgrading from older schemas
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS visible BOOLEAN;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS name TEXT;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS description TEXT;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS seo_description TEXT;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS image TEXT;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS images_json JSONB;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS category TEXT;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS tags_json JSONB;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS cj_product_id TEXT;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS cj_variant_id TEXT;`;
  await sql`ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS variants_json JSONB;`;

  // Custom products
  await sql`
    CREATE TABLE IF NOT EXISTS custom_products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      seo_description TEXT,
      price NUMERIC(10,2) NOT NULL,
      compare_at_price NUMERIC(10,2),
      image TEXT NOT NULL,
      images JSONB,
      category TEXT NOT NULL,
      tags JSONB,
      variants_json JSONB,
      rating NUMERIC(2,1) DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      in_stock BOOLEAN NOT NULL DEFAULT TRUE,
      best_seller BOOLEAN NOT NULL DEFAULT FALSE,
      visible BOOLEAN NOT NULL DEFAULT TRUE,
      cj_product_id TEXT,
      cj_variant_id TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_custom_category ON custom_products(category);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_custom_visible  ON custom_products(visible);`;
  await sql`ALTER TABLE custom_products ADD COLUMN IF NOT EXISTS seo_description TEXT;`;
  await sql`ALTER TABLE custom_products ADD COLUMN IF NOT EXISTS variants_json JSONB;`;

  // Site config
  await sql`
    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);`;
}

// ─── Customers ───
export async function upsertCustomer({ email, name, phone }: { email: string; name?: string; phone?: string }) {
  const r = await sql<{ id: number }>`
    INSERT INTO customers (email, name, phone)
    VALUES (${email}, ${name ?? null}, ${phone ?? null})
    ON CONFLICT (email) DO UPDATE
      SET name = COALESCE(EXCLUDED.name, customers.name),
          phone = COALESCE(EXCLUDED.phone, customers.phone)
    RETURNING id;
  `;
  return r.rows[0].id;
}

// ─── Orders ───
export async function saveOrder(order: {
  id: string; customerId: number; totalCents: number; currency?: string;
  status?: OrderStatus; paymentProvider: 'stripe' | 'paypal'; paymentId: string;
  shipping: any; items: any;
}) {
  await sql`
    INSERT INTO orders (id, customer_id, total_cents, currency, status, payment_provider, payment_id, shipping_json, items_json)
    VALUES (${order.id}, ${order.customerId}, ${order.totalCents}, ${order.currency ?? 'USD'}, ${order.status ?? 'paid'},
            ${order.paymentProvider}, ${order.paymentId}, ${JSON.stringify(order.shipping)}::jsonb, ${JSON.stringify(order.items)}::jsonb)
    ON CONFLICT (id) DO NOTHING;
  `;
}

export async function setCjOrderId(orderId: string, cjOrderId: string) {
  await sql`UPDATE orders SET cj_order_id = ${cjOrderId}, status = 'fulfilling', updated_at = NOW() WHERE id = ${orderId};`;
}

export async function setTracking(orderId: string, trackingNumber: string, trackingUrl?: string) {
  await sql`
    UPDATE orders SET tracking_number = ${trackingNumber}, tracking_url = ${trackingUrl ?? null},
           status = 'shipped', updated_at = NOW()
     WHERE id = ${orderId};
  `;
}

export async function setStatus(orderId: string, status: OrderStatus) {
  await sql`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${orderId};`;
}

export async function listOrders(limit = 100): Promise<DbOrder[]> {
  const r = await sql<DbOrder>`
    SELECT o.*, c.email AS customer_email, c.name AS customer_name
      FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC LIMIT ${limit};
  `;
  return r.rows;
}

export async function getOrder(id: string): Promise<DbOrder | null> {
  const r = await sql<DbOrder>`
    SELECT o.*, c.email AS customer_email, c.name AS customer_name
      FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.id = ${id};
  `;
  return r.rows[0] || null;
}

// ─── Product overrides ───
export async function getAllOverrides(): Promise<Record<string, DbOverride>> {
  try {
    const r = await sql<DbOverride>`SELECT * FROM product_overrides;`;
    const map: Record<string, DbOverride> = {};
    for (const row of r.rows) map[row.product_id] = row;
    return map;
  } catch {
    return {};
  }
}

export async function upsertOverride(productId: string, fields: Partial<DbOverride> & { updated_by: string }) {
  // Build dynamic UPSERT — only set provided fields.
  const cols = ['product_id', 'updated_by', 'updated_at'];
  const vals: any[] = [productId, fields.updated_by, 'NOW()'];
  const placeholders = ['$1', '$2', 'NOW()'];
  let i = 3;
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'updated_by' || k === 'product_id' || k === 'updated_at') continue;
    if (v === undefined) continue;
    cols.push(k);
    if (k === 'images_json' || k === 'tags_json' || k === 'variants_json') {
      vals.push(v === null ? null : JSON.stringify(v));
      placeholders.push(`$${i++}::jsonb`);
    } else {
      vals.push(v);
      placeholders.push(`$${i++}`);
    }
  }
  const updateCols = cols.filter((c) => c !== 'product_id').map((c) => `${c} = EXCLUDED.${c}`).join(', ');
  const query = `
    INSERT INTO product_overrides (${cols.join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT (product_id) DO UPDATE SET ${updateCols};
  `;
  // @ts-ignore raw query
  await sql.query(query, vals);
}

export async function clearOverride(productId: string) {
  await sql`DELETE FROM product_overrides WHERE product_id = ${productId};`;
}

// ─── Custom products ───
export async function listCustomProducts(): Promise<DbCustomProduct[]> {
  try {
    const r = await sql<DbCustomProduct>`SELECT * FROM custom_products ORDER BY created_at DESC;`;
    return r.rows;
  } catch {
    return [];
  }
}

export async function getCustomProduct(id: string): Promise<DbCustomProduct | null> {
  try {
    const r = await sql<DbCustomProduct>`SELECT * FROM custom_products WHERE id = ${id};`;
    return r.rows[0] || null;
  } catch {
    return null;
  }
}

export async function insertCustomProduct(p: Omit<DbCustomProduct, 'created_at' | 'updated_at'>) {
  await sql`
    INSERT INTO custom_products
      (id, slug, name, short_description, description, seo_description, price, compare_at_price,
       image, images, category, tags, variants_json, rating, reviews_count,
       in_stock, best_seller, visible, cj_product_id, cj_variant_id, created_by)
    VALUES
      (${p.id}, ${p.slug}, ${p.name}, ${p.short_description}, ${p.description},
       ${p.seo_description ?? null}, ${p.price}, ${p.compare_at_price ?? null},
       ${p.image}, ${p.images ? JSON.stringify(p.images) : null}::jsonb,
       ${p.category}, ${p.tags ? JSON.stringify(p.tags) : null}::jsonb,
       ${p.variants_json ? JSON.stringify(p.variants_json) : null}::jsonb,
       ${p.rating ?? 5.0}, ${p.reviews_count ?? 0},
       ${p.in_stock}, ${p.best_seller}, ${p.visible},
       ${p.cj_product_id ?? null}, ${p.cj_variant_id ?? null}, ${p.created_by});
  `;
}

export async function updateCustomProduct(id: string, fields: Partial<DbCustomProduct>) {
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    if (k === 'created_at' || k === 'created_by' || k === 'id') continue;
    sets.push(`${k} = $${i++}`);
    if (k === 'images' || k === 'tags' || k === 'variants_json') {
      vals.push(v === null ? null : JSON.stringify(v));
    } else {
      vals.push(v);
    }
  }
  sets.push(`updated_at = NOW()`);
  if (sets.length === 1) return;
  vals.push(id);
  const query = `UPDATE custom_products SET ${sets.join(', ')} WHERE id = $${i};`;
  // @ts-ignore raw query
  await sql.query(query, vals);
}

export async function deleteCustomProduct(id: string) {
  await sql`DELETE FROM custom_products WHERE id = ${id};`;
}

// ─── Site config (homepage + page content) ───
export async function getConfig(key: string): Promise<string | null> {
  try {
    const r = await sql<{ value: string }>`SELECT value FROM site_config WHERE key = ${key};`;
    return r.rows[0]?.value || null;
  } catch {
    return null;
  }
}

export async function getAllConfig(): Promise<Record<string, string>> {
  try {
    const r = await sql<DbSiteConfig>`SELECT * FROM site_config;`;
    const out: Record<string, string> = {};
    for (const row of r.rows) out[row.key] = row.value;
    return out;
  } catch {
    return {};
  }
}

export async function setConfig(key: string, value: string, updatedBy: string) {
  await sql`
    INSERT INTO site_config (key, value, updated_by, updated_at)
    VALUES (${key}, ${value}, ${updatedBy}, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW();
  `;
}

// ─── Audit log ───
export async function logAudit(actor: string, action: string, target: string, details?: any) {
  try {
    await sql`
      INSERT INTO audit_log (actor, action, target, details)
      VALUES (${actor}, ${action}, ${target}, ${details ? JSON.stringify(details) : null}::jsonb);
    `;
  } catch (e) {
    console.error('audit log failed', e);
  }
}

export async function listAudit(limit = 100): Promise<DbAuditEntry[]> {
  try {
    const r = await sql<DbAuditEntry>`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ${limit};`;
    return r.rows;
  } catch {
    return [];
  }
}
