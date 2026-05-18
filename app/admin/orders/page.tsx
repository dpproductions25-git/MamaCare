import { listOrders } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Orders — Admin', robots: { index: false, follow: false } };

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-sage-100 text-sage-500',
  fulfilling: 'bg-sky-100 text-sky-300',
  shipped: 'bg-blush-100 text-blush-500',
  delivered: 'bg-sage-200 text-sage-500',
  cancelled: 'bg-cream-200 text-ink-500',
  refunded: 'bg-cream-200 text-ink-500'
};

export default async function AdminOrders() {
  let orders: any[] = [];
  let error: string | null = null;
  try {
    orders = await listOrders(200);
  } catch (e: any) {
    error = e.message;
  }

  return (
    <section className="container-page py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl text-ink-900">Orders</h1>
        <span className="text-sm text-ink-500">{orders.length} total</span>
      </div>

      {error && (
        <div className="card p-6 mb-6 border border-blush-200">
          <p className="text-blush-500 font-medium">Database not ready.</p>
          <p className="text-sm text-ink-700 mt-2">
            Visit <code className="bg-cream-100 px-2 py-1 rounded">/api/admin/init-db?secret=YOUR_ADMIN_SECRET</code> once
            to create the tables, then refresh.
          </p>
          <p className="text-xs text-ink-500 mt-3">Underlying error: {error}</p>
        </div>
      )}

      {orders.length === 0 && !error && (
        <div className="card p-10 text-center">
          <p className="text-ink-700">No orders yet. Place a test order to see it here.</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((o) => (
          <article key={o.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div>
                <p className="font-mono text-xs text-ink-500">{o.id}</p>
                <p className="font-medium text-ink-900">{o.customer_email || '—'}</p>
                <p className="text-sm text-ink-500">{new Date(o.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[o.status] || 'bg-cream-100 text-ink-700'}`}>
                  {o.status}
                </span>
                <span className="text-lg font-medium">${(o.total_cents / 100).toFixed(2)}</span>
              </div>
            </div>

            {o.shipping_json && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-ink-700 hover:text-blush-500">Shipping & items</summary>
                <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="font-medium text-ink-900 mb-1">Ship to</h3>
                    <p>{o.shipping_json.fullName}</p>
                    <p>{o.shipping_json.line1}{o.shipping_json.line2 ? `, ${o.shipping_json.line2}` : ''}</p>
                    <p>{o.shipping_json.city}, {o.shipping_json.state} {o.shipping_json.postalCode}</p>
                    <p>{o.shipping_json.country}</p>
                    {o.shipping_json.phone && <p>📞 {o.shipping_json.phone}</p>}
                  </div>
                  <div>
                    <h3 className="font-medium text-ink-900 mb-1">Items</h3>
                    <ul>
                      {(o.items_json || []).map((it: any) => (
                        <li key={it.productId}>{it.productId} × {it.qty}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-ink-500">Payment: {o.payment_provider} · {o.payment_id}</p>
                    {o.cj_order_id && <p className="text-ink-500">CJ order: {o.cj_order_id}</p>}
                    {o.tracking_number && (
                      <p className="text-ink-700">Tracking: {o.tracking_number}</p>
                    )}
                  </div>
                </div>

                <ShipForm orderId={o.id} />
              </details>
            )}
          </article>
        ))}
      </div>

      <p className="mt-10 text-xs text-ink-500">
        <Link href="/" className="underline">← Back to site</Link>
      </p>
    </section>
  );
}

function ShipForm({ orderId }: { orderId: string }) {
  return (
    <form action="/api/admin/ship" method="post" className="mt-4 flex flex-col sm:flex-row gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input
        name="tracking"
        required
        placeholder="Tracking number"
        className="flex-1 px-4 py-2 rounded-full bg-white border border-ink-900/10"
      />
      <input
        name="url"
        placeholder="Tracking URL (optional)"
        className="flex-1 px-4 py-2 rounded-full bg-white border border-ink-900/10"
      />
      <button className="btn-primary">Mark shipped + email</button>
    </form>
  );
}
