'use client';

/**
 * CjImagePicker
 *
 * Paste a CJ product URL → fetch all product + variant images → click to
 * select → reorder → apply to the product form.
 *
 * Props:
 *   initialMain    – current main image URL (pre-selects it)
 *   initialGallery – current gallery URLs (pre-selects them)
 *   onApply(main, gallery) – called when admin clicks "Apply"
 */

import { useState, useCallback } from 'react';

type VariantImg = { vid: string; color: string; image: string; sku?: string };

type FetchedData = {
  pid: string;
  productImages: string[];
  variantImages: VariantImg[];
};

type Props = {
  initialMain?: string;
  initialGallery?: string[];
  onApply: (main: string, gallery: string[]) => void;
};

export default function CjImagePicker({ initialMain = '', initialGallery = [], onApply }: Props) {
  const [cjUrl, setCjUrl]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [fetched, setFetched]   = useState<FetchedData | null>(null);

  // Selected gallery = ordered list of URLs. First = main unless overridden.
  const [selected, setSelected] = useState<string[]>(() => {
    const list = initialMain ? [initialMain] : [];
    initialGallery.forEach((u) => { if (u && !list.includes(u)) list.push(u); });
    return list;
  });
  const [main, setMain] = useState<string>(initialMain);

  // ── Fetch ──────────────────────────────────────────────────────────
  async function fetchImages() {
    setError(null);
    const trimmed = cjUrl.trim();
    if (!trimmed) { setError('Paste a CJ product URL first.'); return; }
    if (!trimmed.includes('cjdropshipping.com')) {
      setError('Please paste a full CJ Dropshipping product URL (cjdropshipping.com/product/...).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/cj/images?url=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fetch failed');
      setFetched(data);
    } catch (e: any) {
      setError(e.message === 'CJ_API_REQUIRED' ? 'CJ_API_REQUIRED' : e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Selection helpers ──────────────────────────────────────────────
  const toggle = useCallback((url: string) => {
    setSelected((prev) => {
      if (prev.includes(url)) {
        const next = prev.filter((u) => u !== url);
        // If we removed the current main, reassign main to first remaining
        setMain((m) => (m === url ? (next[0] || '') : m));
        return next;
      }
      const next = [...prev, url];
      setMain((m) => m || url); // auto-set main if nothing selected yet
      return next;
    });
  }, []);

  const isSelected = (url: string) => selected.includes(url);

  function move(url: string, dir: -1 | 1) {
    setSelected((prev) => {
      const i = prev.indexOf(url);
      if (i < 0) return prev;
      const next = [...prev];
      const swap = i + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[i], next[swap]] = [next[swap], next[i]];
      return next;
    });
  }

  // Group variant images by colour (de-dupe same image under multiple colours)
  const variantGroups: { color: string; images: string[] }[] = [];
  if (fetched?.variantImages) {
    const map = new Map<string, string[]>();
    fetched.variantImages.forEach(({ color, image }) => {
      const key = color || 'No colour';
      if (!map.has(key)) map.set(key, []);
      if (!map.get(key)!.includes(image)) map.get(key)!.push(image);
    });
    map.forEach((images, color) => variantGroups.push({ color, images }));
  }

  // All unique product images (excludes variant images already shown separately)
  const productOnlyImages = fetched
    ? fetched.productImages.filter(
        (u) => !fetched.variantImages.some((v) => v.image === u)
      )
    : [];

  return (
    <div className="space-y-5">
      {/* ── URL input + fetch button ── */}
      <div>
        <p className="text-sm font-medium text-ink-900 mb-1">CJ product URL</p>
        <p className="text-xs text-ink-500 mb-2">
          Paste the link to the CJ Dropshipping product page. All photos will be pulled automatically.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={cjUrl}
            onChange={(e) => setCjUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchImages(); }}}
            placeholder="https://www.cjdropshipping.com/product/name-p-XXXXXXX.html"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={fetchImages}
            disabled={loading}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? 'Fetching…' : 'Fetch photos'}
          </button>
        </div>
        {error && error !== 'CJ_API_REQUIRED' && (
          <p className="text-xs text-blush-500 mt-1">{error}</p>
        )}
        {error === 'CJ_API_REQUIRED' && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-2">
            <p className="font-medium text-amber-800">CJ API credentials needed</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              CJ blocks automated image fetching from cloud servers. To enable this feature, add your free CJ API credentials to Vercel:
            </p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Go to <strong>developers.cjdropshipping.com</strong> and sign in with your CJ account</li>
              <li>Create an API key — it's free for CJ store members</li>
              <li>In your <strong>Vercel project → Settings → Environment Variables</strong>, add:<br />
                <code className="font-mono bg-amber-100 rounded px-1">CJ_API_EMAIL</code> and <code className="font-mono bg-amber-100 rounded px-1">CJ_API_KEY</code>
              </li>
              <li>Redeploy — photo fetching will work instantly</li>
            </ol>
            <p className="text-xs text-amber-600 pt-1">
              In the meantime, right-click images on the CJ product page → <em>Copy image address</em> → paste in the URL fields below.
            </p>
          </div>
        )}
      </div>

      {fetched && (
        <>
          {/* ── Product gallery images ── */}
          {productOnlyImages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-700 uppercase tracking-wider mb-2">
                Product photos ({productOnlyImages.length})
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {productOnlyImages.map((url) => (
                  <ImageThumb
                    key={url} url={url}
                    selected={isSelected(url)}
                    isMain={main === url}
                    onToggle={() => toggle(url)}
                    onSetMain={() => { if (!isSelected(url)) toggle(url); setMain(url); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Variant images grouped by colour ── */}
          {variantGroups.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-700 uppercase tracking-wider mb-2">
                Variant photos — click to select, ★ to set as main
              </p>
              <div className="space-y-3">
                {variantGroups.map(({ color, images }) => (
                  <div key={color}>
                    <p className="text-xs text-ink-500 mb-1">{color}</p>
                    <div className="flex flex-wrap gap-2">
                      {images.map((url) => (
                        <ImageThumb
                          key={url} url={url}
                          selected={isSelected(url)}
                          isMain={main === url}
                          onToggle={() => toggle(url)}
                          onSetMain={() => { if (!isSelected(url)) toggle(url); setMain(url); }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fetched.productImages.length === 0 && variantGroups.length === 0 && (
            <p className="text-sm text-ink-500 italic">No images found for this product ID.</p>
          )}
        </>
      )}

      {/* ── Selected gallery ── */}
      {selected.length > 0 && (
        <div className="border border-ink-900/10 rounded-2xl p-4 bg-cream-50">
          <p className="text-xs font-medium text-ink-700 uppercase tracking-wider mb-3">
            Your gallery ({selected.length} photo{selected.length !== 1 ? 's' : ''}) — ★ = main image shown on cards
          </p>
          <div className="flex flex-wrap gap-3">
            {selected.map((url, i) => (
              <div key={url} className="relative group flex flex-col items-center gap-1">
                {/* Thumbnail */}
                <div className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 ${main === url ? 'border-blush-400' : 'border-transparent'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {main === url && (
                    <span className="absolute top-1 left-1 bg-blush-400 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">★ main</span>
                  )}
                </div>
                {/* Controls */}
                <div className="flex items-center gap-1 text-xs">
                  <button type="button" title="Set as main image" onClick={() => setMain(url)}
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

      {/* ── Apply button ── */}
      <button
        type="button"
        disabled={selected.length === 0}
        onClick={() => {
          const resolvedMain = main || selected[0] || '';
          const gallery = selected.filter((u) => u !== resolvedMain);
          onApply(resolvedMain, gallery);
        }}
        className="btn-primary text-sm disabled:opacity-50"
      >
        Apply {selected.length > 0 ? `${selected.length} photo${selected.length !== 1 ? 's' : ''}` : 'photos'} to product
      </button>
    </div>
  );
}

// ── Single thumbnail with selected/main state ────────────────────────
function ImageThumb({
  url, selected, isMain, onToggle, onSetMain
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
      {/* Set as main — shows on hover */}
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
