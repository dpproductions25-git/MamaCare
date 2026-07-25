import Link from 'next/link';
import { listAllRegistries, adminGetRegistryDetail } from '@/lib/db-registry';
import { enrichRegistryItems } from '@/lib/registry-enrich';
import RegistryAdminActions from '@/components/RegistryAdminActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registries — Admin', robots: { index: false, follow: false } };

export default async function AdminRegistries() {
  let registries: any[] = [];
  let error: string | null = null;
  try {
    registries = await listAllRegistries(500);
  } catch (e: any) {
    error = e.message;
  }

  // Pull item detail for each registry so the admin can expand and see contents
  const details = await Promise.all(
    registries.map(async (r) => {
      try {
        const d = await adminGetRegistryDetail(r.id);
        // Enrich so admin-created products resolve to real names, not raw IDs
        return d ? await enrichRegistryItems(d.items) : [];
      } catch {
        return [];
      }
    })
  );

  const totalItems = registries.reduce((n, r) => n + r.total_wanted, 0);
  const totalPurchased = registries.reduce((n, r) => n + r.total_purchased, 0);

  return (
    <section className="container-page py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-4xl text-ink-900">Baby registries</h1>
        <span className="text-sm text-ink-500">{registries.length} total</span>
      </div>
      <p className="text-ink-500">Every registry created on the site, newest first.</p>

      {error && (
        <div className="card p-6 my-6 border border-blush-200">
          <p className="text-blush-500 font-medium">Could not load registries.</p>
          <p className="text-xs text-ink-500 mt-2">{error}</p>
        </div>
      )}

      {registries.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Registries" value={registries.length} />
          <Stat label="Items wishlisted" value={totalItems} />
          <Stat label="Gifts purchased" value={totalPurchased} />
          <Stat
            label="Fulfilled"
            value={totalItems > 0 ? `${Math.round((totalPurchased / totalItems) * 100)}%` : '—'}
          />
        </div>
      )}

      {registries.length === 0 && !error && (
        <div className="card p-10 text-center mt-8">
          <p className="text-ink-700">No registries yet. They&apos;ll appear here as moms create them.</p>
        </div>
      )}

      <div className="space-y-4 mt-8">
        {registries.map((r, idx) => {
          const items = details[idx];
          const pct = r.total_wanted > 0 ? Math.round((r.total_purchased / r.total_wanted) * 100) : 0;
          return (
            <article key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div className="min-w-0">
                  <h2 className="font-display text-xl text-ink-900">🎀 {r.title}</h2>
                  <p className="text-sm text-ink-700 mt-0.5">
                    {r.owner_name} · <span className="text-ink-500">{r.email}</span>
                  </p>
                  <p className="text-xs text-ink-500 mt-1">
                    Created {new Date(r.created_at).toLocaleDateString()} · ID{' '}
                    <code className="bg-cream-100 px-1.5 py-0.5 rounded font-mono">{r.id}</code>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-ink-700">
                    <strong>{r.item_count}</strong> {r.item_count === 1 ? 'item' : 'items'}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {r.total_purchased} of {r.total_wanted} purchased
                  </p>
                </div>
              </div>

              {r.total_wanted > 0 && (
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                    <div className="h-full bg-blush-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-ink-700 hover:text-blush-500">
                    View {items.length} {items.length === 1 ? 'item' : 'items'}
                  </summary>
                  <ul className="mt-3 divide-y divide-ink-900/5 text-sm">
                    {items.map((it: any) => {
                      const done = it.qtyPurchased >= it.qtyWanted;
                      return (
                        <li key={it.id} className="py-2 flex justify-between items-center gap-3">
                          <span className={done ? 'text-ink-400 line-through' : 'text-ink-900'}>
                            {it.name}
                            {it.unavailable && (
                              <span className="ml-2 text-xs text-amber-600">(product removed)</span>
                            )}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
                              done ? 'bg-sage-100 text-sage-600' : 'bg-cream-100 text-ink-700'
                            }`}
                          >
                            {it.qtyPurchased} / {it.qtyWanted}
                            {done ? ' ✓' : ''}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              )}

              <RegistryAdminActions
                registryId={r.id}
                ownerName={r.owner_name}
                registryTitle={r.title}
                itemCount={r.item_count}
                purchasedCount={r.total_purchased}
              />
            </article>
          );
        })}
      </div>

      <p className="mt-10 text-xs text-ink-500">
        <Link href="/admin" className="underline">
          ← Back to admin
        </Link>
      </p>
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
