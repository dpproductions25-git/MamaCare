'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';

const COLOR_HEX: Record<string, string> = {
  Cream: '#F5F0E8',
  Sand: '#D4BC94',
  Blush: '#F3A5B6',
  Sage: '#A8C5A0',
  Sky: '#A8C8E8',
  Charcoal: '#4A4A4A',
  White: '#F8F8F8',
  Gray: '#B0B0B0',
  Navy: '#2D3A5A',
  Pink: '#F4A7B9',
  Brown: '#8B6347',
  Black: '#2A2A33',
};

interface Props {
  product: Product;
}

export default function FeaturedProduct({ product }: Props) {
  const images = (product.images?.length ? product.images : [product.image]).slice(0, 6);
  const [activeImg, setActiveImg] = useState(0);

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const savingsAmt = onSale
    ? (product.compareAtPrice! - product.price).toFixed(0)
    : null;
  const savingsPct = onSale
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : null;

  // "X+ sold" proxy from review count (10–12× multiplier is industry-standard)
  const soldK = Math.floor((product.reviewsCount * 11) / 100) * 100;
  const soldLabel = soldK >= 1000 ? `${(soldK / 1000).toFixed(1)}k+` : `${soldK}+`;

  // Unique colors from variants (preserving insertion order)
  const colorMap = new Map<string, string>();
  product.variants?.forEach((v) => {
    if (v.color && v.image && !colorMap.has(v.color)) colorMap.set(v.color, v.image);
  });
  const colorEntries = [...colorMap.entries()];

  // Pick 3 selling-point bullets dynamically
  const uniqueSizes = [...new Set(product.variants?.map((v) => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(product.variants?.map((v) => v.color).filter(Boolean))];
  const bullets: string[] = [];
  if (uniqueColors.length > 1 && uniqueSizes.length > 1) {
    bullets.push(`${uniqueColors.length} colors × ${uniqueSizes.length} sizes to choose from`);
  }
  bullets.push(product.shortDescription);
  if (product.bestSeller) bullets.push('Mama-approved — our #1 best seller this season');
  // Trim to 3 unique
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
          {/* Main image */}
          <Image
            src={images[activeImg]}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-opacity duration-300"
            priority
          />

          {/* Sale ribbon */}
          {onSale && (
            <div className="absolute top-5 left-5 bg-blush-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              {savingsPct}% OFF
            </div>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                    i === activeImg
                      ? 'border-blush-400 shadow-md scale-105'
                      : 'border-white/70 opacity-60 hover:opacity-100 hover:border-white'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="44px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Details panel ── */}
        <div className="bg-white p-8 sm:p-10 lg:p-14 flex flex-col justify-center">

          {/* Badges */}
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

          {/* Title */}
          <h2 className="font-display text-2xl sm:text-3xl text-ink-900 leading-snug">
            {product.name}
          </h2>

          {/* Stars + social proof */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
            <span className="text-blush-400 text-sm leading-none" aria-label={`${stars} stars`}>
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            </span>
            <span className="text-sm text-ink-500">{product.reviewsCount.toLocaleString()} reviews</span>
            <span className="w-px h-3.5 bg-ink-200 hidden sm:block" />
            <span className="text-sm font-semibold text-ink-700">{soldLabel} sold</span>
          </div>

          {/* Price */}
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

          {/* Color swatches */}
          {colorEntries.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-ink-500 uppercase tracking-widest mb-2.5">
                Color — {[...colorMap.keys()].length} options
              </p>
              <div className="flex gap-2.5 flex-wrap">
                {colorEntries.map(([color, img]) => {
                  const imgIdx = images.indexOf(img);
                  const isActive = imgIdx >= 0 && imgIdx === activeImg;
                  return (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      onClick={() => imgIdx >= 0 && setActiveImg(imgIdx)}
                      className={`w-8 h-8 rounded-full transition-all duration-150 ${
                        isActive ? 'ring-2 ring-blush-400 ring-offset-2 scale-110' : 'hover:scale-110 ring-1 ring-ink-200'
                      }`}
                      style={{ backgroundColor: COLOR_HEX[color] ?? '#ccc' }}
                      aria-label={color}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Bullet points */}
          <ul className="mt-7 space-y-3">
            {finalBullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-ink-700 leading-relaxed">
                <span className="text-sage-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                {b}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/products/${product.slug}`}
              className="btn-primary text-center sm:w-auto"
            >
              Shop now →
            </Link>
            <Link
              href="/shop"
              className="btn-secondary text-center sm:w-auto"
            >
              See all products
            </Link>
          </div>

          {/* Trust signals */}
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
