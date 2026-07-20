'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/lib/cart';
import { colorSwatchStyle } from '@/lib/colors';

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
  // Auto-select the first size for the initial color (or first size overall)
  const [selectedSize, setSelectedSize] = useState<string | undefined>(initial?.size);

  // Which sizes are actually available for the currently selected color
  const sizesForColor = useMemo(() => {
    if (!selectedColor) return new Set(sizes);
    const set = new Set<string>();
    variants
      .filter((v) => v.color === selectedColor)
      .forEach((v) => v.size && set.add(v.size));
    return set;
  }, [variants, selectedColor, sizes]);

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
    // Auto-select first available size for the new color
    const sizesForNewColor = variants
      .filter((v) => v.color === c)
      .map((v) => v.size)
      .filter(Boolean) as string[];
    setSelectedSize(sizesForNewColor[0]);
    // Switch main image to this color's variant image
    const match = variants.find((v) => v.color === c);
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

  // Derive a label for the Add to Cart button
  const needsColor = colors.length > 0 && !selectedColor;
  const needsSize = sizes.length > 0 && !selectedSize;
  let cartLabel = 'Add to cart';
  if (added) cartLabel = 'Added!';
  else if (needsColor) cartLabel = 'Select a color';
  else if (needsSize) cartLabel = 'Select a size';

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      {/* ── Left: images ── */}
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

      {/* ── Right: details ── */}
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

        {/* ── Color picker ── */}
        {colors.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-medium text-ink-700 mb-3">
              Color
              {selectedColor
                ? <span className="ml-2 text-ink-900 capitalize">{selectedColor}</span>
                : <span className="ml-2 text-blush-400 font-normal">— please select</span>}
            </p>
            <div className="flex flex-wrap gap-3">
              {colors.map((c) => {
                const variantForColor = variants.find((v) => v.color === c);
                const hasImg = !!variantForColor?.image;
                const swatch = hasImg ? {} : colorSwatchStyle(c);
                const isActive = selectedColor === c;
                return (
                  <button
                    key={c}
                    onClick={() => pickColor(c)}
                    title={c}
                    aria-label={`Color: ${c}`}
                    aria-pressed={isActive}
                    className={`relative w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 transition-all border-2 ${
                      isActive
                        ? 'border-blush-400 ring-2 ring-blush-200 scale-105'
                        : 'border-transparent hover:border-blush-300 hover:scale-105'
                    }`}
                    style={swatch}
                  >
                    {hasImg && (
                      <Image
                        src={variantForColor!.image!}
                        alt={c}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    )}
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <svg className="w-5 h-5 drop-shadow" viewBox="0 0 20 20" fill="white">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Size picker ── */}
        {sizes.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-ink-700 mb-3">
              Size
              {selectedSize
                ? <span className="ml-2 text-ink-900">{selectedSize}</span>
                : selectedColor
                  ? <span className="ml-2 text-blush-400 font-normal">— please select</span>
                  : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const available = sizesForColor.has(s);
                const active = selectedSize === s;
                return (
                  <button
                    key={s}
                    onClick={() => available ? setSelectedSize(s) : undefined}
                    disabled={!available}
                    aria-pressed={active}
                    className={`min-w-[3rem] px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                      active
                        ? 'border-blush-400 bg-blush-50 text-blush-600'
                        : available
                          ? 'border-ink-900/15 bg-white text-ink-700 hover:border-blush-300'
                          : 'border-ink-900/8 bg-cream-50 text-ink-300 cursor-not-allowed line-through decoration-ink-300/70'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {colors.length > 0 && !selectedColor && (
              <p className="text-xs text-ink-400 mt-2">Select a color to see available sizes</p>
            )}
          </div>
        )}

        {/* ── Qty + Add to cart ── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="inline-flex items-center bg-white border border-ink-900/10 rounded-full">
            <button type="button" aria-label="Decrease quantity" className="w-10 h-10 text-ink-700 hover:text-blush-500" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span aria-live="polite" className="w-8 text-center">{qty}</span>
            <button type="button" aria-label="Increase quantity" className="w-10 h-10 text-ink-700 hover:text-blush-500" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <button
            onClick={handleAdd}
            disabled={(hasVariants && !selectedVariant) || added}
            className={`btn-primary w-full sm:w-auto transition-all disabled:opacity-60 disabled:cursor-not-allowed ${added ? 'bg-sage-500' : ''}`}
          >
            {cartLabel}
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
