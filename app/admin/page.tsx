import Link from 'next/link';
import { listOrders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminHome() {
  let stats = { total: 0, paid: 0, fulfilling: 0, shipped: 0, revenueCents: 0 };
  try {
    const all = await listOrders(1000);
    stats.total = all.length;
    for (const o of all) {
      if (o.status === 'paid') stats.paid++;
      if (o.status === 'fulfilling') stats.fulfilling++;
      if (o.status === 'shipped') stats.shipped++;
      stats.revenueCents += o.total_cents;
    }
  } catch {/* db not initialized */}

  return (
    <section className="container-page py-10">
      <h1 className="font-display text-4xl text-ink-900">MamaCare admin</h1>
      <p className="text-ink-500 mt-2">Quick stats and links.</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total orders" value={stats.total} />
        <Stat label="Awaiting fulfillment" value={stats.paid} />
        <Stat label="Fulfilling" value={stats.fulfilling} />
        <Stat label="Revenue" value={`$${(stats.revenueCents / 100).toFixed(2)}`} />
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        <Link href="/admin/orders" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">Orders →</h2>
          <p className="text-sm text-ink-500 mt-1">View, mark shipped, send tracking emails.</p>
        </Link>
        <a href="https://app.cjdropshipping.com/myCJ.html#/order/orderList/list/0" target="_blank" rel="noreferrer" className="card p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all">
          <h2 className="font-display text-xl text-ink-900">CJ Dropshipping ↗</h2>
          <p className="text-sm text-ink-500 mt-1">Confirm and pay your supplier orders.</p>
        </a>
      </div>
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
