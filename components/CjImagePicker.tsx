'use client';

/**
 * CjImagePicker
 *
 * Paste a CJ product URL → fetch all product photos AND full variant details
 * (size, color, price, SKU) in one click.
 *
 * Props:
 *   initialMain    – current main image URL
 *   initialGallery – current gallery URLs
 *   onApply(main, gallery)          – called when admin confirms photo selection
 *   onApplyVariants(variants)       – called when admin imports CJ variants
 */

import { useState, useCallback, useMemo } from 'react';
import { colorSwatchStyle } from '@/lib/colors';
import { ProductVariant } from '@/lib/types';

type VariantImg = { vid: string; color: string; image: string; sku?: string };

type VariantDetail = {
  vid: string;
  sku?: string;
  name: string;
  color?: string;
  size?: string;
  price?: number;
  image?: string;
};

type FetchedData = {
  pid: string;
  productImages: string[];
  variantImages: VariantImg[];
  variantDetails: VariantDetail[];
};

type Props = {
  initialMain?: string;
  initialGallery?: string[];
  onApply: (main: string, gallery: string[]) => void;
  onApplyVariants?: (variants: ProductVariant[]) => void;
};

export default function CjImagePicker({
  initialMain = '',
  initialGallery = [],
  onApply,
  onApplyVariants,
}: Props) {
  const [cjUrl, setCjUrl]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [fetched, setFetched] = useState<FetchedData | null>(null);

  // ── Photo selection ──────────────────────────────────────────────────
  const [selected, setSelected] = useState<string[]>(() => {
    const list = initialMain ? [initialMain] : [];
    initialGallery.forEach((u) => { if (u && !list.includes(u)) list.push(u); });
    return list;
  });
  const [main, setMain] = useState<string>(initialMain);

  // ── Variant selection ────────────────────────────────────────────────
  const [selectedVids, setSelectedVids] = useState<Set<string>>(new Set());
  const [variantTab, setVariantTab]     = useState<'photos' | 'variants'>('photos');

  // ── Fetch ────────────────────────────────────────────────────────────
  async function fetchProduct() {
    setError(null);
    const trimmed = cjUrl.trim();
    if (!trimmed) { setError('Paste a CJ product URL first.'); return; }
    if (!trimmed.includes('cjdropshipping.com')) {
      setError('Please paste a full CJ Dropshipping product URL.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/cj/images?url=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fetch failed');
      setFetched(data as FetchedData);
      // Auto-select all variants
      setSelectedVids(new Set((data.variantDetails || []).map((v: VariantDetail) => v.vid)));
      // Switch to variants tab if we got any
      if ((data.variantDetails || []).length > 0) setVariantTab('variants');
    } catch (e: any) {
      setError(e.message === 'CJ_API_REQUIRED' ? 'CJ_API_REQUIRED' : e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Photo helpers ────────────────────────────────────────────────────
  const toggle = useCallback((url: string) => {
    setSelected((prev) => {
      if (prev.includes(url)) {
        const next = prev.filter((u) => u !== url);
        setMain((m) => (m === url ? (next[0] || '') : m));
        return next;
      }
      const next = [...prev, url];
      setMain((m) => m || url);
      return next;
    });
  }, []);

  function move(url: string, dir: -1 | 1) {
    setSelected((prev) => {
      const i    = prev.indexOf(url);
      const next = [...prev];
      const swap = i + dir;
      if (i < 0 || swap < 0 || swap >= next.length) return prev;
      [next[i], next[swap]] = [next[swap], next[i]];
      return next;
    });
  }

  // ── Variant helpers ──────────────────────────────────────────────────
  function toggleVid(vid: string) {
    setSelectedVids((prev) => {
      const next = new Set(prev);
      next.has(vid) ? next.delete(vid) : next.add(vid);
      return next;
    });
  }

  function toggleColorGroup(vids: string[], allSelected: boolean) {
    setSelectedVids((prev) => {
      const next = new Set(prev);
      if (allSelected) vids.forEach((v) => next.delete(v));
      else             vids.forEach((v) => next.add(v));
      return next;
    });
  }

  // ── Derived data ─────────────────────────────────────────────────────
  const productOnlyImages = fetched
    ? fetched.productImages.filter(
        (u) => !fetched.variantImages.some((v) => v.image === u)
      )
    : [];

  /** variantDetails grouped by color */
  const colorGroups = useMemo(() => {
    if (!fetched?.variantDetails) return [];
    const map = new Map<string, { image?: string; variants: VariantDetail[] }>();
    fetched.variantDetails.forEach((v) => {
      const key = v.color || '(no color)';
      if (!map.has(key)) map.set(key, { image: v.image, variants: [] });
      const g = map.get(key)!;
      if (!g.image && v.image) g.image = v.image;
      g.variants.push(v);
    });
    return Array.from(map.entries()).map(([color, g]) => ({ color, ...g }));
  }, [fetched]);

  const totalVariants     = fetched?.variantDetails?.length ?? 0;
  const selectedCount     = selectedVids.size;

  return (
    <div className="space-y-5">

      {/* ── URL input ── */}
      <div>
        <p className="text-sm font-medium text-ink-900 mb-1">CJ product URL</p>
        <p className="text-xs text-ink-500 mb-2">
          Paste the CJ product link — photos and variants (sizes, colors, prices) are fetched in one click.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={cjUrl}
            onChange={(e) => setCjUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchProduct(); } }}
            placeholder="https://www.cjdropshipping.com/product/name-p-XXXXXXX.html"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={fetchProduct}
            disabled={loading}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? 'Fetching…' : 'Fetch from CJ'}
          </button>
        </div>

        {error && error !== 'CJ_API_REQUIRED' && (
          <p className="text-xs text-blush-500 mt-1">{error}</p>
        )}
        {error === 'CJ_API_REQUIRED' && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-2">
            <p className="font-medium text-amber-800">CJ API credentials needed</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              CJ blocks automated fetching from cloud servers. Add your free CJ API credentials to Vercel:
            </p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Go to <strong>developers.cjdropshipping.com</strong> and sign in</li>
              <li>Create a free API key</li>
              <li>Add <code className="font-mono bg-amber-100 rounded px-1">CJ_API_EMAIL</code> and <code className="font-mono bg-amber-100 rounded px-1">CJ_API_KEY</code> to Vercel env vars</li>
              <li>Redeploy — fetching will work instantly</li>
            </ol>
          </div>
        )}
      </div>

      {/* ── Results: tab switcher ── */}
      {fetched && (
        <div className="border border-ink-900/10 rounded-2xl overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-ink-900/10 bg-cream-50">
            <TabBtn
              active={variantTab === 'photos'}
              onClick={() => setVariantTab('photos')}
              label={`Photos (${fetched.productImages.length})`}
            />
            {totalVariants > 0 && (
              <TabBtn
                active={variantTab === 'variants'}
                onClick={() => setVariantTab('variants')}
                label={`Sizes & Colors (${totalVariants})`}
                badge={selectedCount}
              />
            )}
          </div>

          {/* ── Photo tab ── */}
          {variantTab === 'photos' && (
            <div className="p-4 space-y-4">
              {productOnlyImages.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2">
                    Product photos
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {productOnlyImages.map((url) => (
                      <ImageThumb
                        key={url} url={url}
                        selected={selected.includes(url)}
                        isMain={main === url}
                        onToggle={() => toggle(url)}
                        onSetMain={() => { if (!selected.includes(url)) toggle(url); setMain(url); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {fetched.variantImages.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2">
                    Variant photos — by color
                  </p>
                  <div className="space-y-3">
                    {(() => {
                      const map = new Map<string, string[]>();
                      fetched.variantImages.forEach(({ color, image }) => {
                        const key = color || 'No color';
                        if (!map.has(key)) map.set(key, []);
                        if (!map.get(key)!.includes(image)) map.get(key)!.push(image);
                      });
                      return Array.from(map.entries()).map(([color, imgs]) => (
                        <div key={color}>
                          <p className="text-xs text-ink-500 mb-1 capitalize">{color}</p>
                          <div className="flex flex-wrap gap-2">
                            {imgs.map((url) => (
                              <ImageThumb
                                key={url} url={url}
                                selected={selected.includes(url)}
                                isMain={main === url}
                                onToggle={() => toggle(url)}
                                onSetMain={() => { if (!selected.includes(url)) toggle(url); setMain(url); }}
                              />
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {fetched.productImages.length === 0 && (
                <p className="text-sm text-ink-500 italic">No images found for this product.</p>
              )}

              {/* Apply photos button */}
              <button
                type="button"
                disabled={selected.length === 0}
                onClick={() => {
                  const m = main || selected[0] || '';
                  onApply(m, selected.filter((u) => u !== m));
                }}
                className="btn-primary text-sm disabled:opacity-50"
              >
                Apply {selected.length > 0 ? `${selected.length} photo${selected.length !== 1 ? 's' : ''}` : 'photos'} to product
              </button>
            </div>
          )}

          {/* ── Variants tab ── */}
          {variantTab === 'variants' && totalVariants > 0 && (
            <div className="p-4 space-y-4">
              {/* Header controls */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-700">
                  <span className="font-medium text-ink-900">{selectedCount}</span> of {totalVariants} selected
                </p>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedVids(new Set(fetched.variantDetails.map((v) => v.vid)))}
                    className="text-blush-500 hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVids(new Set())}
                    className="text-ink-500 hover:underline"
                  >
                    Deselect all
                  </button>
                </div>
              </div>

              {/* Color groups */}
              <div className="space-y-3">
                {colorGroups.map(({ color, image, variants }) => {
                  const groupVids  = variants.map((v) => v.vid);
                  const allChecked = groupVids.every((vid) => selectedVids.has(vid));
                  const swatch     = colorSwatchStyle(color);

                  return (
                    <div
                      key={color}
                      className="rounded-xl border border-ink-900/8 overflow-hidden"
                    >
                      {/* Color header row */}
                      <button
                        type="button"
                        onClick={() => toggleColorGroup(groupVids, allChecked)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-cream-50 hover:bg-cream-100 transition-colors text-left"
                      >
                        {/* Checkbox */}
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${allChecked ? 'bg-blush-400 border-blush-400 text-white' : 'border-ink-900/20 bg-white'}`}>
                          {allChecked && <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1.5 5L4 7.5L8.5 2.5"/></svg>}
                        </span>

                        {/* Color swatch / image */}
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={color} className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-ink-900/10" />
                        ) : (
                          <span className="w-5 h-5 rounded-full flex-shrink-0 border border-white shadow-sm" style={swatch} />
                        )}

                        <span className="text-sm font-medium text-ink-900 capitalize flex-1">{color}</span>
                        <span className="text-xs text-ink-400">{variants.length} size{variants.length !== 1 ? 's' : ''}</span>
                      </button>

                      {/* Size chips */}
                      <div className="flex flex-wrap gap-2 p-3">
                        {variants.map((v) => {
                          const checked = selectedVids.has(v.vid);
                          return (
                            <button
                              key={v.vid}
                              type="button"
                              onClick={() => toggleVid(v.vid)}
                              title={v.sku ? `SKU: ${v.sku}` : undefined}
                              className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 text-xs transition-all min-w-[3.5rem] ${
                                checked
                                  ? 'border-blush-400 bg-blush-50 text-blush-600'
                                  : 'border-ink-900/10 bg-white text-ink-700 hover:border-blush-200'
                              }`}
                            >
                              <span className="font-semibold">{v.size || v.name || '—'}</span>
                              {v.price != null && (
                                <span className={`text-[10px] mt-0.5 ${checked ? 'text-blush-400' : 'text-ink-400'}`}>
                                  ${v.price.toFixed(2)}
                                </span>
                              )}
                              {v.sku && (
                                <span className={`text-[9px] mt-0.5 font-mono ${checked ? 'text-blush-300' : 'text-ink-300'}`}>
                                  {v.sku.slice(0, 10)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Import button */}
              {onApplyVariants && (
                <div className="pt-2 border-t border-ink-900/8">
                  <p className="text-xs text-ink-400 mb-3">
                    Importing will replace your current variants. You can reorder and edit them in the Variants section below.
                  </p>
                  <button
                    type="button"
                    disabled={selectedCount === 0}
                    onClick={() => {
                      const toImport = (fetched.variantDetails || [])
                        .filter((v) => selectedVids.has(v.vid))
                        .map((v): ProductVariant => ({
                          vid:   v.vid,
                          sku:   v.sku,
                          name:  v.name,
                          color: v.color,
                          size:  v.size,
                          price: v.price,
                          image: v.image,
                        }));
                      onApplyVariants(toImport);
                    }}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    Import {selectedCount} variant{selectedCount !== 1 ? 's' : ''} into product
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Selected gallery strip (shown only in photos tab or when no fetched data) ── */}
      {selected.length > 0 && (variantTab === 'photos' || !fetched) && (
        <div className="border border-ink-900/10 rounded-2xl p-4 bg-cream-50">
          <p className="text-xs font-medium text-ink-700 uppercase tracking-wider mb-3">
            Your gallery ({selected.length}) — ★ = main image
          </p>
          <div className="flex flex-wrap gap-3">
            {selected.map((url, i) => (
              <div key={url} className="relative group flex flex-col items-center gap-1">
                <div className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 ${main === url ? 'border-blush-400' : 'border-transparent'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {main === url && (
                    <span className="absolute top-1 left-1 bg-blush-400 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">★ main</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <button type="button" title="Set as main" onClick={() => setMain(url)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${main === url ? 'bg-blush-400 text-white border-blush-400' : 'bg-white text-ink-500 border-ink-900/10 hover:border-blush-300'}`}>
                    ★
                  </button>
                  <button type="button" title="Move left" disabled={i === 0} onClick={() => move(url, -1)}
                    className="w-6 h-6 rounded-full border bg-white text-ink-500 border-ink-900/10 flex items-center justify-center disabled:opacity-30 hover:border-ink-900/30">
                    ←
                  </button>
                  <button type="button" title="Move right" disabled={i === selected.length - 1} onClick={() => move(url, 1)}
                    className="w-6 h-6 rounded-full border bg-white text-ink-500 border-ink-900/10 flex items-center justify-center disabled:opacity-30 hover:border-ink-900/30">
                    →
                  </button>
                  <button type="button" title="Remove" onClick={() => toggle(url)}
                    className="w-6 h-6 rounded-full border bg-white text-blush-400 border-ink-900/10 flex items-center justify-center hover:border-blush-300">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({
  active, onClick, label, badge,
}: {
  active: boolean; onClick: () => void; label: string; badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors relative ${
        active
          ? 'text-blush-600 border-b-2 border-blush-400 bg-white'
          : 'text-ink-500 hover:text-ink-700 border-b-2 border-transparent'
      }`}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className="ml-1.5 bg-blush-400 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Single image thumbnail ───────────────────────────────────────────────────
function ImageThumb({
  url, selected, isMain, onToggle, onSetMain,
}: {
  url: string; selected: boolean; isMain: boolean;
  onToggle: () => void; onSetMain: () => void;
}) {
  return (
    <div className="relative group cursor-pointer" onClick={onToggle}>
      <div className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
        selected ? (isMain ? 'border-blush-400' : 'border-sage-400') : 'border-transparent hover:border-ink-900/20'
      }`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="w-full h-full object-cover" />
        {selected && (
          <div className="absolute inset-0 bg-sage-400/20 flex items-center justify-center">
            <span className="text-white text-lg font-bold drop-shadow">✓</span>
          </div>
        )}
        {isMain && (
          <span className="absolute top-0.5 left-0.5 bg-blush-400 text-white text-[9px] rounded px-1 leading-4">★</span>
        )}
      </div>
      {selected && !isMain && (
        <button
          type="button"
          title="Set as main"
          onClick={(e) => { e.stopPropagation(); onSetMain(); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blush-400 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ★
        </button>
      )}
    </div>
  );
}
