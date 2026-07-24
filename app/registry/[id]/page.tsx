import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { findRegistryById, getRegistryItems } from '@/lib/db-registry';
import { getMergedProducts } from '@/lib/product-overrides';
import { buildMetadata } from '@/lib/seo';
import RegistryPublicActions from '@/components/RegistryPublicActions';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params) {
  const reg = await findRegistryById(params.id);
  if (!reg) return buildMetadata({ title: 'Registry not found' });
  return buildMetadata({
    title: `${reg.owner_name}'s Baby Registry`,
    description: `${reg.title} — shop their wishlist on MamaCare`,
    path: `/registry/${params.id}`,
  });
}

export default async function RegistryPublicPage({ params }: Params) {
  const registry = await findRegistryById(params.id);
  if (!registry) return notFound();

  const [rawItems, allProducts] = await Promise.all([
    getRegistryItems(params.id),
    getMergedProducts(),
  ]);

  const items = rawItems.map((item) => {
    const product = allProducts.find((p) => p.id === item.product_id);
    if (!product) return null;
    const variant = item.variant_id ? product.variants?.find((v) => v.vid === item.variant_id) : undefined;
    return {
      ...item,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      image: variant?.image || product.image,
      price: variant?.price ?? product.price,
      slug: product.slug,
    };
  }).filter(Boolean) as Array<{
    id: number; product_id: string; variant_id: string | null;
    qty_wanted: number; qty_purchased: number;
    name: string; image: string; price: number; slug: string;
  }>;

  const totalWanted = items.reduce((n, i) => n + i.qty_wanted, 0);
  const totalPurchased = items.reduce((n, i) => n + i.qty_purchased, 0);
  const progressPct = totalWanted > 0 ? Math.round((totalPurchased / totalWanted) * 100) : 0;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <div className="bg-white border-b border-ink-900/6">
        <div className="container-page py-10 sm:py-14 text-center">
          <span className="text-4xl">🎀</span>
          <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mt-4">
            {registry.title}
          </h1>
          <p className="text-ink-500 mt-2">Curated by {registry.owner_name}</p>

          {totalWanted > 0 && (
            <div className="max-w-sm mx-auto mt-6">
              <div className="flex justify-between text-sm text-ink-500 mb-2">
                <span>{totalPurchased} of {totalWanted} items purchased</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-3 rounded-full bg-cream-200 overflow-hidden">
                <div
                  className="h-full bg-blush-400 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items grid */}
      <div className="container-page py-10">
        {items.length === 0 ? (
          <div className="text-center py-20 text-ink-400">
            <p className="text-5xl mb-4">✨</p>
            <p>No items on the registry yet — check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => {
              const remaining = item.qty_wanted - item.qty_purchased;
              const fulfilled = remaining <= 0;
              return (
                <div
                  key={item.id}
                  className={`card flex flex-col ${fulfilled ? 'opacity-60' : ''}`}
                >
                  <Link href={`/products/${item.slug}`} className="relative aspect-square bg-cream-100 overflow-hidden rounded-t-2xl block">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                    {fulfilled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <span className="bg-sage-400 text-white text-xs font-medium px-3 py-1 rounded-full">All purchased!</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <Link href={`/products/${item.slug}`} className="font-display text-base text-ink-900 hover:text-blush-500 line-clamp-2 flex-1">
                      {item.name}
                    </Link>
                    <p className="text-sm text-ink-700 font-medium mt-1">${item.price.toFixed(2)}</p>
                    <p className="text-xs text-ink-400 mt-1">
                      {fulfilled ? 'Fully purchased' : `${remaining} still needed`}
                    </p>
                    {!fulfilled && (
                      <RegistryPublicActions
                        registryId={params.id}
                        itemId={item.id}
                        productId={item.product_id}
                        variantId={item.variant_id}
                        slug={item.slug}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-sm text-ink-400">Looking for more gift ideas?</p>
          <Link href="/shop" className="btn-primary inline-block mt-3">Browse MamaCare Shop</Link>
        </div>
      </div>
    </div>
  );
}
