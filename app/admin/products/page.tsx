import Link from 'next/link';
import Image from 'next/image';
import { getAllProductsForAdmin } from '@/lib/product-overrides';
import ProductRowEditor from './ProductRowEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Products — Admin', robots: { index: false, follow: false } };

export default async function AdminProductsPage() {
  const listings = await getAllProductsForAdmin();

  return (
    <section className="container-page py-10">
      <nav className="text-sm text-ink-500 mb-4">
        <Link href="/admin" className="hover:text-blush-500">← Back to admin</Link>
      </nav>

      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl text-ink-900">Products</h1>
          <p className="text-ink-500 mt-1">
            Edit prices, hide products, or add new ones from CJ Dropshipping.
            Changes go live within seconds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-ink-500">
            {listings.length} total · {listings.filter((l) => l.visible).length} visible
          </p>
          <Link href="/admin/products/new" className="btn-primary text-sm py-2 px-4">
            + Add new product
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-cream-100 text-xs uppercase tracking-wider text-ink-700">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Compare-at</th>
                <th className="px-4 py-3 text-left">In stock</th>
                <th className="px-4 py-3 text-left">Best seller</th>
                <th className="px-4 py-3 text-left">Show on site</th>
                <th className="px-4 py-3 text-left">Tagline</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {listings.map(({ product: p, isCustom, visible }) => (
                <tr key={p.id} className={`hover:bg-cream-50 ${!visible ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-cream-100 shrink-0">
                        <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink-900 line-clamp-2 max-w-xs">{p.name}</p>
                        <p className="text-xs text-ink-500 capitalize">
                          {p.category} · {p.id}
                          {isCustom && <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-sage-100 text-sage-500 text-[10px]">custom</span>}
                          {!visible && <span className="ml-1 inline-block px-2 py-0.5 rounded-full bg-cream-200 text-ink-500 text-[10px]">hidden</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <ProductRowEditor product={p} isCustom={isCustom} visible={visible} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 card p-5 bg-cream-100">
        <p className="text-sm text-ink-700">
          <strong>What you can do here:</strong>
        </p>
        <ul className="text-sm text-ink-700 mt-2 ml-5 list-disc space-y-1">
          <li>Edit prices, taglines, stock, and best-seller flags inline</li>
          <li>Hide products with the &quot;Show on site&quot; toggle (without deleting them)</li>
          <li>Add brand-new products with the <strong>+ Add new product</strong> button — just paste the CJ URL and fill in the basics</li>
          <li>Delete custom products you created (static products only have a Reset button)</li>
        </ul>
      </div>
    </section>
  );
}
