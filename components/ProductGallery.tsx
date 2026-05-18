'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/lib/cart';

export default function ProductGallery({ product }: { product: Product }) {
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[],
    [variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[],
    [variants]
  );

  const initial = hasVariants ? variants[0] : null;
  const [selectedColor, setSelectedColor] = useState<string | undefined>(initial?.color);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(initial?.size);

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!hasVariants) return undefined;
    return variants.find(
      (v) =>
        (selectedColor === undefined || v.color === selectedColor) &&
        (selectedSize === undefined || v.size === selectedSize)
    );
  }, [variants, selectedColor, selectedSize, hasVariants]);

  const gallery = useMemo(() => {
    const seen = new Set<string>();
    const add = (url?: string) => { if (url && !seen.has(url)) seen.add(url); };
    add(product.image);
    variants.forEach((v) => add(v.image));
    (product.images || []).forEach(add);
    return Array.from(seen);
  }, [product, variants]);

  const [activeImage, setActiveImage] = useState<string>(selectedVariant?.image || product.image);

  function pickColor(c: string) {
    setSelectedColor(c);
    const match = variants.find((v) => v.color === c && (selectedSize === undefined || v.size === selectedSize));
    if (match?.image) setActiveImage(match.image);
  }

  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  function handleAdd() {
    add(product.id, qty, selectedVariant?.vid);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const displayPrice = selectedVariant?.price ?? product.price;

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <div>
        <div className="relative aspect-square rounded-4xl overflow-hidden bg-cream-100">
          <Image src={activeImage} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </div>
        {gallery.length > 1 && (
          <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
            {gallery.map((url) => (
              <button
                key={url}
                onClick={() => setActiveImage(url)}
                className={`relative aspect-square rounded-2xl overflow-hidden bg-cream-100 border-2 transition-colors ${activeImage === url ? 'border-blush-400' : 'border-transparent hover:border-blush-200'}`}
                aria-label="View image"
              >
                <Image src={url} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium capitalize">{product.category}</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mt-2">{product.name}</h1>

        <div className="flex items-center gap-3 mt-3 text-sm text-ink-500">
          <span aria-label={`${product.rating} stars`}>
            {'★'.repeat(Math.round(product.rating))}
            <span className="text-ink-500/30">{'★'.repeat(5 - Math.round(product.rating))}</span>
          </span>
          <span>{product.rating.toFixed(1)} ({product.reviewsCount} reviews)</span>
        </div>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-3xl text-ink-900 font-medium">${displayPrice.toFixed(2)}</span>
          {onSale && <span className="text-ink-500 line-through">${product.compareAtPrice!.toFixed(2)}</span>}
          {onSale && <span className="bg-blush-100 text-blush-500 text-xs px-2 py-1 rounded-full">Save ${(product.compareAtPrice! - product.price).toFixed(2)}</span>}
        </div>

        <p className="text-ink-700 mt-6 leading-relaxed">{product.description}</p>

        {colors.length > 0 && (
          <div className="mt-8">
            <p className="text-sm text-ink-700 mb-3">Color: <span className="font-medium text-ink-900">{selectedColor}</span></p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const variantImage = variants.find((v) => v.color === c)?.image;
                const isActive = selectedColor === c;
                return (
                  <button
                    key={c}
                    onClick={() => pickColor(c)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-colors text-sm ${isActive ? 'border-blush-400 bg-blush-50 text-ink-900' : 'border-ink-900/10 hover:border-blush-200 bg-white text-ink-700'}`}
                  >
                    {variantImage && (
                      <span className="relative w-6 h-6 rounded-full overflow-hidden bg-cream-100">
                        <Image src={variantImage} alt="" fill sizes="24px" className="object-cover" />
                      </span>
                    )}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-ink-700 mb-3">Size: <span className="font-medium text-ink-900">{selectedSize}</span></p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 rounded-full border-2 transition-colors text-sm ${selectedSize === s ? 'border-blush-400 bg-blush-50 text-ink-900' : 'border-ink-900/10 hover:border-blush-200 bg-white text-ink-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="inline-flex items-center bg-white border border-ink-900/10 rounded-full">
            <button type="button" aria-label="Decrease quantity" className="w-10 h-10 text-ink-700 hover:text-blush-500" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span aria-live="polite" className="w-8 text-center">{qty}</span>
            <button type="button" aria-label="Increase quantity" className="w-10 h-10 text-ink-700 hover:text-blush-500" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <button
            onClick={handleAdd}
            disabled={hasVariants && !selectedVariant}
            className="btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {added ? 'Added!' : hasVariants && !selectedVariant ? 'Select options' : 'Add to cart'}
          </button>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-4 text-sm text-ink-700">
          <li className="flex items-center gap-2">🚚 Free U.S. shipping over $50</li>
          <li className="flex items-center gap-2">↩ 14-day easy returns</li>
          <li className="flex items-center gap-2">🌿 Thoughtfully sourced</li>
          <li className="flex items-center gap-2">💳 Secure checkout</li>
        </ul>
      </div>
    </div>
  );
}
