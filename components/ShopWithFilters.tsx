'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/lib/types';
import { categories } from '@/lib/products';

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
  const [maxPrice, setMaxPrice] = useState<number>(() =>
    Math.ceil(Math.max(...initialProducts.map((p) => p.price)))
  );
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');

  // ─── Derive available filter options from the catalog ───
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => p.variants?.forEach((v) => v.color && set.add(v.color)));
    return Array.from(set).sort();
  }, [initialProducts]);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => p.variants?.forEach((v) => v.size && set.add(v.size)));
    return Array.from(set);
  }, [initialProducts]);

  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(...initialProducts.map((p) => p.price))),
    [initialProducts]
  );

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
        p.variants?.some((v) => v.color && selectedColors.has(v.color))
      );
    }

    if (selectedSizes.size > 0) {
      list = list.filter((p) =>
        p.variants?.some((v) => v.size && selectedSizes.has(v.size))
      );
    }

    list = list.filter((p) => p.price <= maxPrice);

    if (onSaleOnly) list = list.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
    if (bestSellerOnly) list = list.filter((p) => p.bestSeller);

    switch (sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break;
      case 'newest':     list.reverse(); break;
      default: /* featured: best-sellers first, then default order */ {
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
    (maxPrice < priceCeiling ? 1 : 0);

  function clearAll() {
    setSelectedCategories(new Set());
    setSelectedColors(new Set());
    setSelectedSizes(new Set());
    setMaxPrice(priceCeiling);
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
          Price · up to ${maxPrice}
        </legend>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={5}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-blush-400"
        />
        <div className="flex justify-between text-xs text-ink-500 mt-1">
          <span>$0</span>
          <span>${priceCeiling}</span>
        </div>
      </fieldset>

      {/* Color */}
      {availableColors.length > 0 && (
        <fieldset>
          <legend className="font-medium text-ink-900 mb-3">Color</legend>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => {
              const active = selectedColors.has(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleSet(selectedColors, c, setSelectedColors)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? 'bg-blush-400 text-white border-blush-400'
                      : 'bg-white text-ink-700 border-ink-900/10 hover:border-blush-200'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Size */}
      {availableSizes.length > 0 && (
        <fieldset>
          <legend className="font-medium text-ink-900 mb-3">Size</legend>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((s) => {
              const active = selectedSizes.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSet(selectedSizes, s, setSelectedSizes)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? 'bg-blush-400 text-white border-blush-400'
                      : 'bg-white text-ink-700 border-ink-900/10 hover:border-blush-200'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Toggles */}
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
      <aside className="hidden lg:block sticky top-24 self-start">
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
            {Array.from(selectedColors).map((c) => (
              <button
                key={`col-${c}`}
                type="button"
                onClick={() => toggleSet(selectedColors, c, setSelectedColors)}
                className="text-xs px-3 py-1 rounded-full bg-blush-100 text-blush-500 hover:bg-blush-200"
              >
                {c} ✕
              </button>
            ))}
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
            {maxPrice < priceCeiling && (
              <button onClick={() => setMaxPrice(priceCeiling)} className="text-xs px-3 py-1 rounded-full bg-blush-100 text-blush-500 hover:bg-blush-200">
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
