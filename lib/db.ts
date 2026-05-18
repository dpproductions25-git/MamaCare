import { sql } from '@vercel/postgres';

/**
 * Vercel Postgres client + helpers.
 *
 * The schema is created idempotently via `npm run db:init` (or by visiting
 * /api/admin/init-db once). Tables:
 *
 *   customers (id, email UNIQUE, name, phone, created_at)
 *   orders    (id, customer_id, total_cents, currency, status,
 *              payment_provider, payment_id, shipping_json,
 *              items_json, cj_order_id, tracking_number,
 *              created_at, updated_at)
 */

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'fulfilling'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

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

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
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
}

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

export async function saveOrder(order: {
  id: string;
  customerId: number;
  totalCents: number;
  currency?: string;
  status?: OrderStatus;
  paymentProvider: 'stripe' | 'paypal';
  paymentId: string;
  shipping: any;
  items: any;
}) {
  await sql`
    INSERT INTO orders (
      id, customer_id, total_cents, currency, status,
      payment_provider, payment_id, shipping_json, items_json
    ) VALUES (
      ${order.id}, ${order.customerId}, ${order.totalCents},
      ${order.currency ?? 'USD'}, ${order.status ?? 'paid'},
      ${order.paymentProvider}, ${order.paymentId},
      ${JSON.stringify(order.shipping)}::jsonb,
      ${JSON.stringify(order.items)}::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
  `;
}

export async function setCjOrderId(orderId: string, cjOrderId: string) {
  await sql`
    UPDATE orders
       SET cj_order_id = ${cjOrderId},
           status      = 'fulfilling',
           updated_at  = NOW()
     WHERE id = ${orderId};
  `;
}

export async function setTracking(orderId: string, trackingNumber: string, trackingUrl?: string) {
  await sql`
    UPDATE orders
       SET tracking_number = ${trackingNumber},
           tracking_url    = ${trackingUrl ?? null},
           status          = 'shipped',
           updated_at      = NOW()
     WHERE id = ${orderId};
  `;
}

export async function setStatus(orderId: string, status: OrderStatus) {
  await sql`
    UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${orderId};
  `;
}

export async function listOrders(limit = 100): Promise<DbOrder[]> {
  const r = await sql<DbOrder>`
    SELECT o.*, c.email AS customer_email, c.name AS customer_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC
     LIMIT ${limit};
  `;
  return r.rows;
}

export async function getOrder(id: string): Promise<DbOrder | null> {
  const r = await sql<DbOrder>`
    SELECT o.*, c.email AS customer_email, c.name AS customer_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.id = ${id};
  `;
  return r.rows[0] || null;
}
