'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';


interface Props {
  product: Product;
}

export default function FeaturedProduct({ product }: Props) {
  const variants = product.variants ?? [];

  // Build gallery exactly like ProductGallery does:
  // product.image first, then each variant's unique image, then product.images — deduped.
  const gallery: string[] = [];
  const seen = new Set<string>();
  const addUrl = (url?: string) => { if (url && !seen.has(url)) { seen.add(url); gallery.push(url); } };
  addUrl(product.image);
  variants.forEach((v) => addUrl(v.image));
  (product.images ?? []).forEach(addUrl);
  const displayGallery = gallery.slice(0, 6);

  // Active image and selected color both default to the first variant.
  const firstVariant = variants[0];
  const [activeImage, setActiveImage] = useState<string>(firstVariant?.image || product.image);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(firstVariant?.color);

  // Unique ordered color list
  const colorOrder: string[] = [];
  const colorToVariantImg = new Map<string, string>(); // color → variant image URL
  variants.forEach((v) => {
    if (v.color && v.image && !colorToVariantImg.has(v.color)) {
      colorToVariantImg.set(v.color, v.image);
      colorOrder.push(v.color);
    }
  });

  function pickColor(color: string) {
    setSelectedColor(color);
    const img = colorToVariantImg.get(color);
    if (img) setActiveImage(img);
  }

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const savingsAmt = onSale ? (product.compareAtPrice! - product.price).toFixed(0) : null;
  const savingsPct = onSale
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : null;

  const soldK = Math.floor((product.reviewsCount * 11) / 100) * 100;
  const soldLabel = soldK >= 1000 ? `${(soldK / 1000).toFixed(1)}k+` : `${soldK}+`;

  const uniqueSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const bullets: string[] = [];
  if (colorOrder.length > 1 && uniqueSizes.length > 1) {
    bullets.push(`${colorOrder.length} colors × ${uniqueSizes.length} sizes to choose from`);
  }
  bullets.push(product.shortDescription);
  if (product.bestSeller) bullets.push('Mama-approved — our #1 best seller this season');
  const finalBullets = [...new Set(bullets)].slice(0, 3);

  const stars = Math.round(product.rating);

  return (
    <section className="container-page py-12 sm:py-16">
      {/* ── Eyebrow ── */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-blush-500 font-semibold">
          <span aria-hidden>✦</span>
          Most loved this week
          <span aria-hidden>✦</span>
        </span>
      </div>

      {/* ── Card ── */}
      <div className="rounded-3xl overflow-hidden shadow-card grid lg:grid-cols-2">

        {/* ── Left: Image panel ── */}
        <div className="relative bg-cream-100 aspect-square lg:aspect-auto lg:min-h-[520px]">
          <Image
            src={activeImage}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-opacity duration-300"
            priority
          />

          {onSale && (
            <div className="absolute top-5 left-5 bg-blush-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              {savingsPct}% OFF
            </div>
          )}

          {/* Thumbnail strip — same URL-equality check as ProductGallery */}
          {displayGallery.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
              {displayGallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  aria-label="View image"
                  className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                    url === activeImage
                      ? 'border-blush-400 shadow-md scale-105'
                      : 'border-white/70 opacity-60 hover:opacity-100 hover:border-white'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="44px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Details panel ── */}
        <div className="bg-white p-8 sm:p-10 lg:p-14 flex flex-col justify-center">

          <div className="flex flex-wrap gap-2 mb-5">
            {product.bestSeller && (
              <span className="inline-flex items-center gap-1 bg-sage-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                #1 Best Seller
              </span>
            )}
            {onSale && (
              <span className="inline-flex items-center bg-blush-50 text-blush-600 text-xs font-semibold px-3 py-1 rounded-full border border-blush-200">
                Limited-time deal
              </span>
            )}
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-ink-900 leading-snug">
            {product.name}
          </h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
            <span className="text-blush-400 text-sm leading-none" aria-label={`${stars} stars`}>
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            </span>
            <span className="text-sm text-ink-500">{product.reviewsCount.toLocaleString()} reviews</span>
            <span className="w-px h-3.5 bg-ink-200 hidden sm:block" />
            <span className="text-sm font-semibold text-ink-700">{soldLabel} sold</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-4xl text-ink-900 tracking-tight">
              ${product.price.toFixed(2)}
            </span>
            {onSale && (
              <>
                <span className="text-ink-400 line-through text-xl">
                  ${product.compareAtPrice!.toFixed(2)}
                </span>
                <span className="inline-flex items-center bg-sage-50 text-sage-700 text-sm font-semibold px-3 py-1 rounded-full border border-sage-200">
                  Save ${savingsAmt}
                </span>
              </>
            )}
          </div>

          {/* Color swatches — use variant image as swatch thumbnail (same as ProductGallery) */}
          {colorOrder.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-ink-500 uppercase tracking-widest mb-2.5">
                Color{selectedColor && <span className="normal-case font-medium text-ink-700 ml-1">— {selectedColor}</span>}
              </p>
              <div className="flex gap-2 flex-wrap">
                {colorOrder.map((color) => {
                  const variantImg = colorToVariantImg.get(color)!;
                  const isActive = color === selectedColor;
                  return (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      aria-label={`Color: ${color}`}
                      aria-pressed={isActive}
                      onClick={() => pickColor(color)}
                      className={`relative w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all duration-150 ${
                        isActive
                          ? 'border-blush-400 ring-2 ring-blush-200 scale-105'
                          : 'border-transparent hover:border-blush-300 hover:scale-105'
                      }`}
                    >
                      <Image src={variantImg} alt={color} fill sizes="44px" className="object-cover" />
                      {isActive && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <svg className="w-4 h-4 drop-shadow" viewBox="0 0 20 20" fill="white">
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

          <ul className="mt-7 space-y-3">
            {finalBullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-ink-700 leading-relaxed">
                <span className="text-sage-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link href={`/products/${product.slug}`} className="btn-primary text-center sm:w-auto">
              Shop now →
            </Link>
            <Link href="/shop" className="btn-secondary text-center sm:w-auto">
              See all products
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-500">
            <span>🚚 Free U.S. shipping over $50</span>
            <span>↩ 14-day returns</span>
            <span>🔒 Secure checkout</span>
          </div>
        </div>
      </div>
    </section>
  );
}
