import { sql } from '@vercel/postgres';

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
  price: number | null;
  compare_at_price: number | null;
  short_description: string | null;
  in_stock: boolean | null;
  best_seller: boolean | null;
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
  // Customers
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Orders
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      total_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      payment_provider TEXT NOT NULL,
      payment_id TEXT NOT NULL,
      shipping_json JSONB,
      items_json JSONB,
      cj_order_id TEXT,
      tracking_number TEXT,
      tracking_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders(created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`;

  // Product overrides — admins edit these; public pages merge with static catalog.
  await sql`
    CREATE TABLE IF NOT EXISTS product_overrides (
      product_id TEXT PRIMARY KEY,
      price NUMERIC(10,2),
      compare_at_price NUMERIC(10,2),
      short_description TEXT,
      in_stock BOOLEAN,
      best_seller BOOLEAN,
      updated_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Audit log — who did what.
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
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
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
    // DB not initialized or no overrides
    return {};
  }
}

export async function getOverride(productId: string): Promise<DbOverride | null> {
  try {
    const r = await sql<DbOverride>`SELECT * FROM product_overrides WHERE product_id = ${productId};`;
    return r.rows[0] || null;
  } catch {
    return null;
  }
}

export async function upsertOverride(productId: string, fields: {
  price?: number | null;
  compare_at_price?: number | null;
  short_description?: string | null;
  in_stock?: boolean | null;
  best_seller?: boolean | null;
  updated_by: string;
}) {
  await sql`
    INSERT INTO product_overrides (product_id, price, compare_at_price, short_description, in_stock, best_seller, updated_by, updated_at)
    VALUES (${productId}, ${fields.price ?? null}, ${fields.compare_at_price ?? null},
            ${fields.short_description ?? null}, ${fields.in_stock ?? null}, ${fields.best_seller ?? null},
            ${fields.updated_by}, NOW())
    ON CONFLICT (product_id) DO UPDATE
      SET price             = COALESCE(EXCLUDED.price, product_overrides.price),
          compare_at_price  = COALESCE(EXCLUDED.compare_at_price, product_overrides.compare_at_price),
          short_description = COALESCE(EXCLUDED.short_description, product_overrides.short_description),
          in_stock          = COALESCE(EXCLUDED.in_stock, product_overrides.in_stock),
          best_seller       = COALESCE(EXCLUDED.best_seller, product_overrides.best_seller),
          updated_by        = EXCLUDED.updated_by,
          updated_at        = NOW();
  `;
}

export async function clearOverride(productId: string) {
  await sql`DELETE FROM product_overrides WHERE product_id = ${productId};`;
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
    const r = await sql<DbAuditEntry>`
      SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ${limit};
    `;
    return r.rows;
  } catch {
    return [];
  }
}
