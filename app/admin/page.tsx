import Link from 'next/link';
import { headers } from 'next/headers';
import { listOrders, listAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminHome() {
  const admin = headers().get('x-admin-name') || 'admin';

  let stats = { total: 0, paid: 0, fulfilling: 0, shipped: 0, revenueCents: 0 };
  let recentAudit: any[] = [];
  try {
    const all = await listOrders(1000);
    stats.total = all.length;
    for (const o of all) {
      if (o.status === 'paid') stats.paid++;
      if (o.status === 'fulfilling') stats.fulfilling++;
      if (o.status === 'shipped') stats.shipped++;
      stats.revenueCents += o.total_cents;
    }
    recentAudit = await listAudit(8);
  } catch {/* db not initialized */}

  return (
    <section className="container-page py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-ink-900">MamaCare admin</h1>
        <span className="text-sm text-ink-500">Signed in as <strong>{admin}</strong></span>
      </div>
      <p className="text-ink-500 mt-2">Quick stats and links.</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total orders" value={stats.total} />
        <Stat label="Awaiting fulfillment" value={stats.paid} />
        <Stat label="Fulfilling" value={stats.fulfilling} />
        <Stat label="Revenue" value={`$${(stats.revenueCents / 100).toFixed(2)}`} />
      </div>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/orders" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">Orders →</h2>
          <p className="text-sm text-ink-500 mt-1">View, mark shipped, send tracking emails.</p>
        </Link>
        <Link href="/admin/products" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">Products →</h2>
          <p className="text-sm text-ink-500 mt-1">Add, edit, hide products. Manage prices and stock.</p>
        </Link>
        <Link href="/admin/homepage" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">Homepage →</h2>
          <p className="text-sm text-ink-500 mt-1">Edit the hero photo, headline, and call-to-action.</p>
        </Link>
        <Link href="/admin/pages" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">Pages →</h2>
          <p className="text-sm text-ink-500 mt-1">Edit About, FAQ, Shipping, Returns, Privacy, Terms.</p>
        </Link>
        <a href="https://app.cjdropshipping.com/myCJ.html#/order/orderList/list/0" target="_blank" rel="noreferrer" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">CJ Dropshipping ↗</h2>
          <p className="text-sm text-ink-500 mt-1">Confirm and pay supplier orders.</p>
        </a>
        <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noreferrer" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">Stripe payments ↗</h2>
          <p className="text-sm text-ink-500 mt-1">View charges, refunds, payouts.</p>
        </a>
        <a href="https://resend.com/emails" target="_blank" rel="noreferrer" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">Email log ↗</h2>
          <p className="text-sm text-ink-500 mt-1">See order emails sent via Resend.</p>
        </a>
      </div>

      {recentAudit.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-2xl text-ink-900 mb-4">Recent activity</h2>
          <div className="card p-2">
            <ul className="divide-y divide-ink-900/5">
              {recentAudit.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm flex justify-between items-start gap-4">
                  <div>
                    <strong className="text-ink-900">{a.actor}</strong>{' '}
                    <span className="text-ink-700">{a.action}</span>{' '}
                    <span className="text-ink-500">{a.target}</span>
                  </div>
                  <span className="text-xs text-ink-500 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-ink-500 uppercase tracking-wider">{label}</p>
      <p className="font-display text-3xl text-ink-900 mt-2">{value}</p>
    </div>
  );
}
