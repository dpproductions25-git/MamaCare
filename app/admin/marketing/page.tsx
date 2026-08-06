import Link from 'next/link';
import { getShippingSettings, listCoupons, getTaxCodes, DEFAULT_TAX_CODE } from '@/lib/db-commerce';
import { TAX_ENABLED } from '@/lib/tax';
import { categories } from '@/lib/products';
import MarketingClient from '@/components/MarketingClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shipping & Discounts — Admin', robots: { index: false, follow: false } };

export default async function AdminMarketing() {
  let shipping = { freeThreshold: 50, flatRate: 6.99 };
  let coupons: any[] = [];
  let taxCodes = { default: DEFAULT_TAX_CODE, byCategory: {} as Record<string, string> };
  let error: string | null = null;

  try {
    shipping = await getShippingSettings();
    coupons = await listCoupons();
    taxCodes = await getTaxCodes();
  } catch (e: any) {
    error = e.message;
  }

  return (
    <section className="container-page py-10">
      <h1 className="font-display text-4xl text-ink-900">Shipping &amp; discounts</h1>
      <p className="text-ink-500 mt-2">
        Set your shipping rules and manage every discount code in one place.
      </p>

      {error && (
        <div className="card p-6 my-6 border border-blush-200">
          <p className="text-blush-500 font-medium">Could not load settings.</p>
          <p className="text-xs text-ink-500 mt-2">{error}</p>
        </div>
      )}

      <MarketingClient
        initialShipping={shipping}
        initialCoupons={JSON.parse(JSON.stringify(coupons))}
        initialTaxCodes={taxCodes}
        categories={categories.map((c) => ({ slug: c.slug, label: c.label }))}
        taxEnabled={TAX_ENABLED}
      />

      <p className="mt-10 text-xs text-ink-500">
        <Link href="/admin" className="underline">← Back to admin</Link>
      </p>
    </section>
  );
}
