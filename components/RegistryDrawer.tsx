'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRegistry, RegistryItem } from '@/lib/registry-store';
import RegistrySetup from './RegistrySetup';

type EnrichedItem = RegistryItem & {
  name: string;
  image: string;
  price: number;
  slug: string;
};

function mapItems(raw: any[]): RegistryItem[] {
  return raw.map((i) => ({
    id: i.id,
    productId: i.product_id,
    variantId: i.variant_id ?? null,
    qtyWanted: i.qty_wanted,
    qtyPurchased: i.qty_purchased,
    note: i.note ?? null,
  }));
}

export default function RegistryDrawer() {
  const {
    isOpen, close, registryId, pin, ownerName, title, items, setItems, clearRegistry,
  } = useRegistry();
  const [showSetup, setShowSetup] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedItem[]>([]);
  const [removing, setRemoving] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  // Load items from server when drawer opens
  const loadItems = useCallback(async () => {
    if (!registryId) return;
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/registry/${registryId}`);
      const data = await res.json();
      if (res.ok) setItems(mapItems(data.items || []));
    } finally {
      setLoadingItems(false);
    }
  }, [registryId, setItems]);

  useEffect(() => {
    if (isOpen && registryId) loadItems();
  }, [isOpen, registryId, loadItems]);

  // Enrich items with product data from static list
  useEffect(() => {
    if (!items.length) { setEnriched([]); return; }
    import('@/lib/products').then(({ products }) => {
      const result: EnrichedItem[] = items.map((item) => {
        const p = products.find((x) => x.id === item.productId);
        if (!p) return null;
        const variant = item.variantId ? p.variants?.find((v) => v.vid === item.variantId) : undefined;
        return {
          ...item,
          name: variant ? `${p.name} — ${variant.name}` : p.name,
          image: variant?.image || p.image,
          price: variant?.price ?? p.price,
          slug: p.slug,
        };
      }).filter(Boolean) as EnrichedItem[];
      setEnriched(result);
    });
  }, [items]);

  async function removeItem(itemId: number) {
    if (!pin || !registryId) return;
    setRemoving(itemId);
    try {
      const res = await fetch(`/api/registry/${registryId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, itemId }),
      });
      const data = await res.json();
      if (res.ok) setItems(mapItems(data.items));
    } finally {
      setRemoving(null);
    }
  }

  function copyLink() {
    if (!registryId) return;
    const url = `${window.location.origin}/registry/${registryId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const shareUrl = registryId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/registry/${registryId}` : '';
  const totalWanted = items.reduce((n, i) => n + i.qtyWanted, 0);
  const totalPurchased = items.reduce((n, i) => n + i.qtyPurchased, 0);
  const progressPct = totalWanted > 0 ? Math.round((totalPurchased / totalWanted) * 100) : 0;

  if (!isOpen) return null;

  // Not signed in — show setup
  if (!registryId) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-sm" onClick={close} />
        <aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-50 bg-white shadow-2xl flex flex-col animate-slideInRight">
          <div className="flex items-center justify-between px-6 py-5 border-b border-ink-900/8">
            <h2 className="font-display text-xl text-ink-900">🎀 Baby Registry</h2>
            <button onClick={close} aria-label="Close" className="text-ink-400 hover:text-ink-700">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 text-center">
            <div className="text-5xl">🌸</div>
            <div>
              <h3 className="font-display text-xl text-ink-900">Your wishlist awaits</h3>
              <p className="text-sm text-ink-500 mt-2">Create a registry to save favourites and share a link with family and friends.</p>
            </div>
            <button onClick={() => setShowSetup(true)} className="btn-primary w-full">
              Get started
            </button>
          </div>
        </aside>
        {showSetup && <RegistrySetup onClose={() => setShowSetup(false)} />}
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-sm" onClick={close} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-50 bg-white shadow-2xl flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="px-6 py-5 border-b border-ink-900/8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl text-ink-900">🎀 {title || 'My Baby Registry'}</h2>
              <p className="text-xs text-ink-500 mt-0.5">{ownerName}'s registry · {items.length} items</p>
            </div>
            <button onClick={close} aria-label="Close" className="text-ink-400 hover:text-ink-700 mt-1">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          {totalWanted > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
                <span>{totalPurchased} of {totalWanted} items purchased</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                <div
                  className="h-full bg-blush-400 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Share + view links */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 border border-ink-900/12 rounded-full py-2 text-sm font-medium text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors"
            >
              {copied ? (
                <>✓ Copied!</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round"/>
                  </svg>
                  Share link
                </>
              )}
            </button>
            <Link
              href={`/registry/${registryId}`}
              onClick={close}
              className="flex-1 flex items-center justify-center gap-1 border border-ink-900/12 rounded-full py-2 text-sm font-medium text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors"
            >
              View full registry →
            </Link>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingItems && (
            <div className="flex items-center justify-center py-12 text-ink-400 text-sm">Loading…</div>
          )}
          {!loadingItems && enriched.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <span className="text-4xl">✨</span>
              <p className="text-ink-500 text-sm">No items yet — browse the shop and tap "Add to registry"!</p>
              <Link href="/shop" onClick={close} className="btn-primary mt-2">Browse products</Link>
            </div>
          )}
          {!loadingItems && enriched.map((item) => {
            const remaining = item.qtyWanted - item.qtyPurchased;
            return (
              <div key={item.id} className="flex gap-4 py-4 border-b border-ink-900/6 last:border-0">
                <Link href={`/products/${item.slug}`} onClick={close} className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-cream-100">
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={close}
                    className="text-sm font-medium text-ink-900 hover:text-blush-500 line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-ink-700 mt-0.5">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-ink-500">
                    <span>Wants {item.qtyWanted}</span>
                    {item.qtyPurchased > 0 && (
                      <span className="text-sage-500 font-medium">{item.qtyPurchased} purchased</span>
                    )}
                    {remaining > 0 && item.qtyPurchased > 0 && (
                      <span className="text-blush-500">{remaining} still needed</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={removing === item.id}
                  aria-label="Remove from registry"
                  className="text-ink-300 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0"
                >
                  {removing === item.id ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink-900/8 bg-cream-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            <button
              onClick={() => clearRegistry()}
              className="text-ink-400 hover:text-red-400 text-xs transition-colors"
            >
              Sign out of registry
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
