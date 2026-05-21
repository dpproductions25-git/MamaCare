import Link from 'next/link';
import Image from 'next/image';
import { getMergedProducts } from '@/lib/product-overrides';
import ProductRowEditor from './ProductRowEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Products — Admin', robots: { index: false, follow: false } };

export default async function AdminProductsPage() {
  const products = await getMergedProducts();

  return (
    <section className="container-page py-10">
      <nav className="text-sm text-ink-500 mb-4">
        <Link href="/admin" className="hover:text-blush-500">← Back to admin</Link>
      </nav>

      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl text-ink-900">Products</h1>
          <p className="text-ink-500 mt-1">
            Edit prices, stock, best-seller flag, and tagline.
            Changes go live on your store within seconds.
          </p>
        </div>
        <p className="text-sm text-ink-500">{products.length} products</p>
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
                <th className="px-4 py-3 text-left">Tagline</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-cream-100 shrink-0">
                        <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink-900 line-clamp-2 max-w-xs">{p.name}</p>
                        <p className="text-xs text-ink-500 capitalize">{p.category} · {p.id}</p>
                      </div>
                    </div>
                  </td>
                  <ProductRowEditor product={p} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 card p-5 bg-cream-100">
        <p className="text-sm text-ink-700">
          <strong>Want to add a new product or edit images, descriptions, or variants?</strong>{' '}
          Those still require a code change. Email{' '}
          <a href="mailto:david@example.com" className="underline">your developer</a>{' '}
          with details (CJ URL, price, category) and they&apos;ll add it for you.
        </p>
      </div>
    </section>
  );
}
