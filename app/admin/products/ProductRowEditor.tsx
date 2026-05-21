'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';

export default function ProductRowEditor({ product }: { product: Product }) {
  const router = useRouter();
  const [price, setPrice] = useState(product.price);
  const [compareAt, setCompareAt] = useState<number | undefined>(product.compareAtPrice);
  const [inStock, setInStock] = useState(product.inStock);
  const [bestSeller, setBestSeller] = useState(product.bestSeller || false);
  const [shortDesc, setShortDesc] = useState(product.shortDescription);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const isDirty =
    price !== product.price ||
    (compareAt || null) !== (product.compareAtPrice || null) ||
    inStock !== product.inStock ||
    bestSeller !== (product.bestSeller || false) ||
    shortDesc !== product.shortDescription;

  async function save() {
    setSavedMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          compare_at_price: compareAt ?? null,
          in_stock: inStock,
          best_seller: bestSeller,
          short_description: shortDesc
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSavedMsg('Saved ✓');
      router.refresh();
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (e: any) {
      setSavedMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefaults() {
    if (!confirm('Reset this product to the original code defaults? All admin edits will be lost.')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Reset failed');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-ink-500 text-xs">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-20 rounded-lg bg-white border border-ink-900/10 px-2 py-1 text-sm"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-ink-500 text-xs">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="—"
            value={compareAt ?? ''}
            onChange={(e) => setCompareAt(e.target.value ? Number(e.target.value) : undefined)}
            className="w-20 rounded-lg bg-white border border-ink-900/10 px-2 py-1 text-sm"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="w-4 h-4 accent-blush-400"
          />
          <span className={`ml-2 text-xs ${inStock ? 'text-sage-500' : 'text-ink-500'}`}>
            {inStock ? 'Yes' : 'No'}
          </span>
        </label>
      </td>
      <td className="px-4 py-3">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={bestSeller}
            onChange={(e) => setBestSeller(e.target.checked)}
            className="w-4 h-4 accent-blush-400"
          />
          <span className={`ml-2 text-xs ${bestSeller ? 'text-blush-500' : 'text-ink-500'}`}>
            {bestSeller ? 'Yes' : 'No'}
          </span>
        </label>
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          className="w-full max-w-xs rounded-lg bg-white border border-ink-900/10 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="inline-flex gap-2 items-center">
          {savedMsg && <span className="text-xs text-sage-500">{savedMsg}</span>}
          <button
            type="button"
            disabled={!isDirty || saving}
            onClick={save}
            className="px-3 py-1 rounded-full text-xs bg-blush-400 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blush-500"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            className="px-3 py-1 rounded-full text-xs bg-white border border-ink-900/10 text-ink-700 hover:bg-cream-100"
            title="Revert to original code defaults"
          >
            Reset
          </button>
        </div>
      </td>
    </>
  );
}
