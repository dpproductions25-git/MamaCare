'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/lib/types';
import { categories } from '@/lib/products';
import { colorSwatchStyle, colorFamily, COLOR_FAMILIES } from '@/lib/colors';

/** Sort sizes the way a shopper expects: XS…XXL, then ages/numbers, then the rest. */
const LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];
function sortSizes(sizes: string[]): string[] {
  const rank = (s: string): [number, number, string] => {
    const up = s.trim().toUpperCase();
    const li = LETTER_SIZES.indexOf(up);
    if (li >= 0) return [0, li, up];
    const num = parseFloat(up);
    if (Number.isFinite(num)) return [1, num, up];
    return [2, 0, up];
  };
  return sizes.slice().sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
  });
}
const SIZES_COLLAPSED = 12;

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export default function ShopWithFilters({
  initialProducts,
  lockedCategory
}: {
  initialProducts: Product[];
  lockedCategory?: Category;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  // null = no price limit. Kept separate from the slider's ceiling, which now
  // follows the category being viewed.
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');

  // The sale banner links to /shop?sale=1 — open with "On sale" already ticked.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('sale') === '1') setOnSaleOnly(true);
  }, []);

  // ─── Derive available filter options from the products being browsed ───
  // Only offer colors, sizes and prices that exist in the category on screen.
  // These used to be built from the whole catalog, so "Baby Gear" listed 121
  // colors and 39 sizes (most from unrelated products).
  const scopeProducts = useMemo(() => {
    if (lockedCategory) return initialProducts.filter((p) => p.category === lockedCategory);
    if (selectedCategories.size > 0) {
      return initialProducts.filter((p) => selectedCategories.has(p.category));
    }
    return initialProducts;
  }, [initialProducts, lockedCategory, selectedCategories]);

  const availableColors = useMemo(() => {
    const found = new Set<string>();
    scopeProducts.forEach((p) =>
      p.variants?.forEach((v) => {
        const f = colorFamily(v.color);
        if (f) found.add(f);
      })
    );
    return COLOR_FAMILIES.filter((f) => found.has(f)) as string[];
  }, [scopeProducts]);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    scopeProducts.forEach((p) =>
      p.variants?.forEach((v) => {
        const s = (v.size || '').trim();
        if (s) set.add(s);
      })
    );
    return sortSizes(Array.from(set));
  }, [scopeProducts]);

  const priceCeiling = useMemo(() => {
    const top = scopeProducts.reduce((m, p) => Math.max(m, p.price), 0);
    return Math.max(5, Math.ceil(top / 5) * 5);
  }, [scopeProducts]);
  const effectiveMaxPrice = Math.min(maxPrice ?? priceCeiling, priceCeiling);

  // ─── Apply filters ───
  const filtered = useMemo(() => {
    let list = initialProducts.slice();

    if (lockedCategory) {
      list = list.filter((p) => p.category === lockedCategory);
    } else if (selectedCategories.size > 0) {
      list = list.filter((p) => selectedCategories.has(p.category));
    }

    if (selectedColors.size > 0) {
      list = list.filter((p) =>
        p.variants?.some((v) => {
          const f = colorFamily(v.color);
          return !!f && selectedColors.has(f);
        })
      );
    }

    if (selectedSizes.size > 0) {
      list = list.filter((p) =>
        p.variants?.some((v) => v.size && selectedSizes.has(v.size))
      );
    }

    if (maxPrice != null) list = list.filter((p) => p.price <= maxPrice);

    if (onSaleOnly) list = list.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
    if (bestSellerOnly) list = list.filter((p) => p.bestSeller);

    switch (sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break;
      case 'newest':     list.reverse(); break;
      default: {
        list.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
      }
    }

    return list;
  }, [
    initialProducts, lockedCategory, selectedCategories, selectedColors,
    selectedSizes, maxPrice, onSaleOnly, bestSellerOnly, sort
  ]);

  const activeFilterCount =
    selectedCategories.size +
    selectedColors.size +
    selectedSizes.size +
    (onSaleOnly ? 1 : 0) +
    (bestSellerOnly ? 1 : 0) +
    (maxPrice != null && maxPrice < priceCeiling ? 1 : 0);

  function clearAll() {
    setSelectedCategories(new Set());
    setSelectedColors(new Set());
    setSelectedSizes(new Set());
    setMaxPrice(null);
    setOnSaleOnly(false);
    setBestSellerOnly(false);
  }

  function toggleSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const copy = new Set(set);
    if (copy.has(value)) copy.delete(value); else copy.add(value);
    setter(copy);
  }

  // ─── Filter UI (shared between sidebar + drawer) ───
  const FilterPanel = (
    <div className="space-y-7">
      {/* Category */}
      {!lockedCategory && (
        <fieldset>
          <legend className="font-medium text-ink-900 mb-3">Category</legend>
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <label key={c.slug} className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.has(c.slug)}
                  onChange={() => toggleSet(selectedCategories, c.slug, setSelectedCategories)}
                  className="w-4 h-4 accent-blush-400"
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Price */}
      <fieldset>
        <legend className="font-medium text-ink-900 mb-3">
          Price · up to ${effectiveMaxPrice}
        </legend>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={5}
          value={effectiveMaxPrice}
          onChange={(e) => {
            const v = Number(e.target.value);
            // Dragged back to the top = "no limit", so the cap follows the category
            setMaxPrice(v >= priceCeiling ? null : v);
          }}
          className="w-full accent-blush-400"
        />
        <div className="flex justify-between text-xs text-ink-500 mt-1">
          <span>$0</span>
          <span>${priceCeiling}</span>
        </div>
      </fieldset>

      {/* Color — swatch + name list */}
      {availableColors.length > 0 && (
        <fieldset>
          <legend className="font-medium text-ink-900 mb-3">Color</legend>
          <div className="flex flex-col gap-1">
            {availableColors.map((c) => {
              const active = selectedColors.has(c);
              const swatch = colorSwatchStyle(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleSet(selectedColors, c, setSelectedColors)}
                  className={`flex items-center gap-3 text-sm px-2 py-1.5 rounded-xl transition-colors text-left w-full ${
                    active
                      ? 'bg-blush-50 text-ink-900 font-medium'
                      : 'text-ink-700 hover:bg-cream-100'
                  }`}
                >
                  {/* Color swatch circle */}
                  <span
                    className={`w-5 h-5 rounded-full flex-shrink-0 border-2 shadow-sm transition-all ${
                      active ? 'border-blush-400 ring-2 ring-blush-200' : 'border-white'
                    }`}
                    style={swatch}
                  />
                  <span className="flex-1 capitalize">{c}</span>
                  {active && (
                    <svg className="w-3.5 h-3.5 text-blush-400 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M2.5 8.5L6 12L13.5 4" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Size — compact pill grid */}
      {availableSizes.length > 0 && (
        <fieldset>
          <legend className="font-medium text-ink-900 mb-3">Size</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {(showAllSizes ? availableSizes : availableSizes.slice(0, SIZES_COLLAPSED)).map((s) => {
              const active = selectedSizes.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSet(selectedSizes, s, setSelectedSizes)}
                  className={`text-xs py-2 px-1 rounded-lg border-2 font-medium text-center transition-colors ${
                    active
                      ? 'border-blush-400 bg-blush-50 text-blush-600'
                      : 'border-ink-900/10 bg-white text-ink-700 hover:border-blush-200'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {availableSizes.length > SIZES_COLLAPSED && (
            <button
              type="button"
              onClick={() => setShowAllSizes((v) => !v)}
              className="mt-2 text-xs text-ink-700 underline hover:text-blush-500"
            >
              {showAllSizes ? 'Show fewer sizes' : `Show all ${availableSizes.length} sizes`}
            </button>
          )}
        </fieldset>
      )}

      {/* Quick filters */}
      <fieldset className="space-y-2">
        <legend className="font-medium text-ink-900 mb-3">Quick filters</legend>
        <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={(e) => setOnSaleOnly(e.target.checked)}
            className="w-4 h-4 accent-blush-400"
          />
          On sale only
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
          <input
            type="checkbox"
            checked={bestSellerOnly}
            onChange={(e) => setBestSellerOnly(e.target.checked)}
            className="w-4 h-4 accent-blush-400"
          />
          Best sellers only
        </label>
      </fieldset>

      <button
        type="button"
        onClick={clearAll}
        className="w-full text-sm text-ink-700 underline hover:text-blush-500"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8">
      {/* ─── Desktop sidebar ─── */}
      {/* Sticky, so it must never be taller than the screen — otherwise the
          bottom of the filters (and "Clear all") can't be scrolled to. */}
      <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
        <h2 className="font-display text-2xl text-ink-900 mb-5">Filters</h2>
        {FilterPanel}
      </aside>

      <div>
        {/* ─── Sort + filter button row ─── */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            type="button"
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-ink-900/10 text-sm"
            onClick={() => setDrawerOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blush-400 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <p className="text-sm text-ink-500 hidden lg:block">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
          </p>

          <label className="inline-flex items-center gap-2 text-sm text-ink-700">
            Sort:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-full bg-white border border-ink-900/10 px-3 py-1.5 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        {/* ─── Active filter chips ─── */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {Array.from(selectedCategories).map((c) => {
              const label = categories.find((x) => x.slug === c)?.label || c;
              return (
                <button
                  key={`c-${c}`}
                  type="button"
                  onClick={() => toggleSet(selectedCategories, c, setSelectedCategories)}
                  className="text-xs px-3 py-1 rounded-full bg-blush-100 text-blush-500 hover:bg-blush-200"
                >
                  {label} ✕
                </button>
              );
            })}
            {Array.from(selectedColors).map((c) => {
              const swatch = colorSwatchStyle(c);
              return (
                <button
                  key={`col-${c}`}
                  type="button"
                  onClick={() => toggleSet(selectedColors, c, setSelectedColors)}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blush-100 text-blush-500 hover:bg-blush-200"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 border border-blush-200"
                    style={swatch}
                  />
                  {c} ✕
                </button>
              );
            })}
            {Array.from(selectedSizes).map((s) => (
              <button
                key={`s-${s}`}
                type="button"
                onClick={() => toggleSet(selectedSizes, s, setSelectedSizes)}
                className="text-xs px-3 py-1 rounded-full bg-blush-100 text-blush-500 hover:bg-blush-200"
              >
                {s} ✕
              </button>
            ))}
            {onSaleOnly && (
              <button onClick={() => setOnSaleOnly(false)} className="text-xs px-3 py-1 rounded-full bg-blush-100 text-blush-500 hover:bg-blush-200">
                On sale ✕
              </button>
            )}
            {bestSellerOnly && (
              <button onClick={() => setBestSellerOnly(false)} className="text-xs px-3 py-1 rounded-full bg-blush-100 text-blush-500 hover:bg-blush-200">
                Best sellers ✕
              </button>
            )}
            {maxPrice != null && maxPrice < priceCeiling && (
              <button onClick={() => setMaxPrice(null)} className="text-xs px-3 py-1 rounded-full bg-blush-100 text-blush-500 hover:bg-blush-200">
                Under ${maxPrice} ✕
              </button>
            )}
          </div>
        )}

        {/* ─── Product grid ─── */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-ink-700 mb-4">No products match those filters.</p>
            <button onClick={clearAll} className="btn-secondary">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Mobile filter drawer ─── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-cream-50 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-ink-900">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-cream-100 inline-flex items-center justify-center"
                aria-label="Close filters"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {FilterPanel}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="btn-primary w-full mt-8"
            >
              Show {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
