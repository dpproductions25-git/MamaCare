'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CartItem, Product } from '@/lib/types';
import { useCart } from '@/lib/cart';
import { featuredScore } from '@/lib/featured';
import { trackMeta } from './MetaPixel';

const MAX_SUGGESTIONS = 3;

/**
 * "Add to your order" block for the checkout sidebar.
 *
 * Ranking is deterministic (no Math.random) so the server-rendered HTML and the
 * first client render agree. Products from categories the cart doesn't already
 * cover come first — someone buying a carrier is more likely to want a sleep
 * sack than a second carrier — then by the same popularity score the homepage
 * spotlight uses.
 */
export default function CheckoutSuggestions({
  products,
  items,
  subtotal,
  freeThreshold,
}: {
  products: Product[];
  items: CartItem[];
  subtotal: number;
  freeThreshold: number;
}) {
  const add = useCart((s) => s.add);

  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((i) => i.productId));
    const cartCategories = new Set(
      items
        .map((i) => products.find((p) => p.id === i.productId)?.category)
        .filter(Boolean)
    );

    return products
      .filter((p) => p.inStock && p.id !== 'mc-test' && p.image && !inCart.has(p.id))
      .map((p) => ({
        p,
        rank: (cartCategories.has(p.category) ? 0 : 1_000_000) + featuredScore(p),
      }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, MAX_SUGGESTIONS)
      .map((x) => x.p);
  }, [products, items]);

  if (suggestions.length === 0) return null;

  const remainingForFree = freeThreshold > 0 ? freeThreshold - subtotal : 0;

  function quickAdd(p: Product) {
    add(p.id, 1);
    trackMeta('AddToCart', {
      content_ids: [p.id],
      content_name: p.name,
      content_type: 'product',
      value: p.price,
      currency: 'USD',
    });
  }

  return (
    <div className="mt-6 pt-5 border-t border-ink-900/10">
      <h3 className="font-display text-lg text-ink-900">Add to your order</h3>
      {remainingForFree > 0 && (
        <p className="text-xs text-sage-600 mt-1">
          You&apos;re ${remainingForFree.toFixed(2)} away from free shipping.
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {suggestions.map((p) => {
          const hasVariants = (p.variants?.length ?? 0) > 0;
          const onSale = !!p.compareAtPrice && p.compareAtPrice > p.price;
          return (
            <li key={p.id} className="flex items-center gap-3">
              <Link
                href={`/products/${p.slug}`}
                className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-cream-100"
                aria-label={p.name}
              >
                <Image src={p.image} alt={p.name} fill sizes="64px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${p.slug}`}
                  className="text-sm text-ink-900 hover:text-blush-500 line-clamp-2 leading-snug"
                >
                  {p.name}
                </Link>
                <p className="text-sm mt-0.5">
                  <span className="font-medium text-ink-900">${p.price.toFixed(2)}</span>
                  {onSale && (
                    <span className="ml-1.5 text-xs text-ink-400 line-through">
                      ${p.compareAtPrice!.toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
              {hasVariants ? (
                <Link
                  href={`/products/${p.slug}`}
                  className="flex-shrink-0 text-xs font-medium text-blush-500 border border-blush-200 rounded-full px-3 py-1.5 hover:bg-blush-50"
                >
                  Options
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => quickAdd(p)}
                  className="flex-shrink-0 text-xs font-medium text-white bg-blush-400 hover:bg-blush-500 rounded-full px-3 py-1.5"
                  aria-label={`Add ${p.name} to your order`}
                >
                  + Add
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
