import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { findRegistryById, getRegistryItems, ensureRegistrySchema } from '@/lib/db-registry';
import { enrichRegistryItems } from '@/lib/registry-enrich';
import { buildMetadata } from '@/lib/seo';
import RegistryPublicActions from '@/components/RegistryPublicActions';
import RegistryShareButton from '@/components/RegistryShareButton';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params) {
  try {
    await ensureRegistrySchema();
    const reg = await findRegistryById(params.id);
    if (!reg) return buildMetadata({ title: 'Registry not found' });
    return buildMetadata({
      title: `${reg.owner_name}'s Baby Registry`,
      description: `${reg.title} — shop their wishlist on MamaCare`,
      path: `/registry/${params.id}`,
    });
  } catch {
    return buildMetadata({ title: 'Baby Registry' });
  }
}

export default async function RegistryPublicPage({ params }: Params) {
  await ensureRegistrySchema();
  const registry = await findRegistryById(params.id);
  if (!registry) return notFound();

  const rows = await getRegistryItems(params.id);
  const all = await enrichRegistryItems(rows);

  // Hide items whose product no longer exists from the public gift view
  const items = all.filter((i) => !i.unavailable);

  const totalWanted = items.reduce((n, i) => n + i.qtyWanted, 0);
  const totalPurchased = items.reduce((n, i) => n + i.qtyPurchased, 0);
  const progressPct = totalWanted > 0 ? Math.round((totalPurchased / totalWanted) * 100) : 0;

  const stillNeeded = items.filter((i) => i.qtyWanted - i.qtyPurchased > 0);
  const alreadyGifted = items.filter((i) => i.qtyWanted - i.qtyPurchased <= 0);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <div className="bg-white border-b border-ink-900/6">
        <div className="container-page py-12 sm:py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-blush-100 flex items-center justify-center text-3xl mx-auto">
            🎀
          </div>
          <h1 className="font-display text-3xl sm:text-5xl text-ink-900 mt-5">{registry.title}</h1>
          <p className="text-ink-500 mt-3">
            A wishlist by <strong className="text-ink-700 font-medium">{registry.owner_name}</strong>
          </p>

          {totalWanted > 0 && (
            <div className="max-w-md mx-auto mt-8">
              <div className="flex justify-between items-end text-sm mb-2">
                <span className="text-ink-700">
                  <strong className="font-display text-2xl text-ink-900">{totalPurchased}</strong>
                  <span className="text-ink-500"> of {totalWanted} gifted</span>
                </span>
                <span className="text-blush-500 font-medium">{progressPct}%</span>
              </div>
              <div className="h-3 rounded-full bg-cream-200 overflow-hidden">
                <div
                  className="h-full bg-blush-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {progressPct === 100 ? (
                <p className="text-sm text-sage-600 mt-3 font-medium">
                  🎉 This registry is fully gifted — how wonderful!
                </p>
              ) : (
                <p className="text-sm text-ink-500 mt-3">
                  {stillNeeded.length} {stillNeeded.length === 1 ? 'gift' : 'gifts'} still needed
                </p>
              )}
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <RegistryShareButton registryId={params.id} ownerName={registry.owner_name} />
            <Link
              href="/shop"
              className="px-6 py-3 rounded-full border border-ink-900/12 text-sm font-medium text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors"
            >
              Browse the shop
            </Link>
          </div>
        </div>
      </div>

      {/* How it works */}
      {stillNeeded.length > 0 && (
        <div className="bg-blush-50/50 border-b border-blush-100">
          <div className="container-page py-5">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-center text-sm">
              <Step n="1" text="Pick a gift below" />
              <Step n="2" text="Add it to your cart" />
              <Step n="3" text={`We'll tell ${registry.owner_name} it's covered`} />
            </div>
          </div>
        </div>
      )}

      <div className="container-page py-10 sm:py-12">
        {items.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center text-3xl mx-auto">
              ✨
            </div>
            <h2 className="font-display text-xl text-ink-900 mt-5">Nothing on the list yet</h2>
            <p className="text-ink-500 mt-2 text-sm">
              {registry.owner_name} hasn&apos;t added any items — check back soon!
            </p>
          </div>
        )}

        {/* Still needed */}
        {stillNeeded.length > 0 && (
          <>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-display text-2xl text-ink-900">Still needed</h2>
              <span className="text-sm text-ink-500">{stillNeeded.length} items</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {stillNeeded.map((item) => (
                <GiftCard key={item.id} item={item} registryId={params.id} />
              ))}
            </div>
          </>
        )}

        {/* Already gifted */}
        {alreadyGifted.length > 0 && (
          <>
            <div className="flex items-baseline justify-between mb-5 mt-14">
              <h2 className="font-display text-2xl text-ink-900">Already gifted</h2>
              <span className="text-sm text-sage-600">{alreadyGifted.length} covered 💚</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {alreadyGifted.map((item) => (
                <GiftCard key={item.id} item={item} registryId={params.id} fulfilled />
              ))}
            </div>
          </>
        )}

        <div className="text-center mt-16 pt-10 border-t border-ink-900/6">
          <p className="text-sm text-ink-500">Want to create a registry of your own?</p>
          <Link href="/shop" className="btn-primary inline-block mt-3">
            Start your MamaCare registry
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-6 h-6 rounded-full bg-blush-400 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <span className="text-ink-700">{text}</span>
    </div>
  );
}

function GiftCard({
  item,
  registryId,
  fulfilled = false,
}: {
  item: {
    id: number; productId: string; variantId: string | null;
    qtyWanted: number; qtyPurchased: number;
    name: string; image: string; price: number; slug: string; inStock: boolean;
  };
  registryId: string;
  fulfilled?: boolean;
}) {
  const remaining = item.qtyWanted - item.qtyPurchased;

  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden border border-ink-900/5 flex flex-col transition-all ${
        fulfilled ? 'opacity-70' : 'hover:shadow-soft hover:-translate-y-0.5'
      }`}
    >
      <Link href={`/products/${item.slug}`} className="relative aspect-square bg-cream-100 block">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
        {fulfilled && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75">
            <span className="bg-sage-400 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              ✓ All gifted
            </span>
          </div>
        )}
        {!fulfilled && item.qtyPurchased > 0 && (
          <span className="absolute top-3 left-3 bg-white/95 text-ink-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
            {remaining} still needed
          </span>
        )}
        {!fulfilled && !item.inStock && (
          <span className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
            Out of stock
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link
          href={`/products/${item.slug}`}
          className="font-medium text-sm text-ink-900 hover:text-blush-500 line-clamp-2 leading-snug flex-1"
        >
          {item.name}
        </Link>
        <p className="text-base text-ink-900 font-medium mt-2">${item.price.toFixed(2)}</p>

        {!fulfilled && (
          <p className="text-xs text-ink-400 mt-1">
            {item.qtyWanted > 1 ? `Wants ${item.qtyWanted} · ${remaining} left` : 'Wants 1'}
          </p>
        )}

        {!fulfilled && item.inStock && (
          <RegistryPublicActions
            registryId={registryId}
            itemId={item.id}
            productId={item.productId}
            variantId={item.variantId}
            slug={item.slug}
          />
        )}

        {!fulfilled && !item.inStock && (
          <p className="mt-3 text-center text-xs text-ink-400 py-2.5 border border-ink-900/8 rounded-full">
            Unavailable right now
          </p>
        )}
      </div>
    </div>
  );
}
