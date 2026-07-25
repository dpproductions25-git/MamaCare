'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRegistry, RegistryItem } from '@/lib/registry-store';
import RegistrySetup from './RegistrySetup';

export default function RegistryDrawer() {
  const {
    isOpen, close, registryId, pin, ownerName, title, items, setItems, clearRegistry,
  } = useRegistry();

  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyItem, setBusyItem] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [undo, setUndo] = useState<{ item: RegistryItem; timer: any } | null>(null);

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    if (!registryId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/registry/${registryId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
      else setError(data.error || 'Could not load your registry.');
    } catch {
      setError('Network error — check your connection.');
    } finally {
      setLoading(false);
    }
  }, [registryId, setItems]);

  /**
   * Items are never persisted to localStorage, so we hydrate from the server:
   *   - on mount (this drawer lives in the root layout, so it always runs)
   *   - whenever the drawer is opened, to pick up gifts bought since last look
   *
   * Hydrating on mount also keeps AddToRegistryButton's "already in registry"
   * check accurate — without it, a fresh page load would re-POST an item that
   * was already saved and silently bump its quantity.
   */
  useEffect(() => {
    if (registryId) loadItems();
  }, [isOpen, registryId, loadItems]);

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  async function removeItem(item: RegistryItem) {
    if (!pin || !registryId) return;
    setBusyItem(item.id);
    setError('');

    const snapshot = items;
    setItems(items.filter((i) => i.id !== item.id)); // optimistic

    try {
      const res = await fetch(`/api/registry/${registryId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, itemId: item.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        if (undo?.timer) clearTimeout(undo.timer);
        const timer = setTimeout(() => setUndo(null), 6000);
        setUndo({ item, timer });
      } else {
        setItems(snapshot);
        setError(data.error || 'Could not remove that item.');
      }
    } catch {
      setItems(snapshot);
      setError('Network error — item was not removed.');
    } finally {
      setBusyItem(null);
    }
  }

  async function restoreItem(item: RegistryItem) {
    if (!pin || !registryId) return;
    if (undo?.timer) clearTimeout(undo.timer);
    setUndo(null);
    setBusyItem(item.id);
    try {
      const res = await fetch(`/api/registry/${registryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          productId: item.productId,
          variantId: item.variantId,
          qtyWanted: item.qtyWanted,
        }),
      });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
      else setError(data.error || 'Could not restore that item.');
    } catch {
      setError('Network error — could not restore.');
    } finally {
      setBusyItem(null);
    }
  }

  async function changeQty(item: RegistryItem, next: number) {
    if (!pin || !registryId) return;
    if (next < Math.max(1, item.qtyPurchased) || next > 99) return;
    setBusyItem(item.id);
    setError('');

    const snapshot = items;
    setItems(items.map((i) => (i.id === item.id ? { ...i, qtyWanted: next } : i)));

    try {
      const res = await fetch(`/api/registry/${registryId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, itemId: item.id, qtyWanted: next }),
      });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
      else { setItems(snapshot); setError(data.error || 'Could not update quantity.'); }
    } catch {
      setItems(snapshot);
      setError('Network error — quantity unchanged.');
    } finally {
      setBusyItem(null);
    }
  }

  /** Owner deletes their whole registry. PIN-verified server-side. */
  async function deleteRegistry() {
    if (!registryId || !pin) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/registry/${registryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok) {
        clearRegistry();   // wipes local identity + items
        setConfirmDelete(false);
        close();
      } else {
        setError(data.error || 'Could not delete your registry.');
        setConfirmDelete(false);
      }
    } catch {
      setError('Network error — your registry was not deleted.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  function copyLink() {
    if (!registryId) return;
    const url = `${window.location.origin}/registry/${registryId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  async function shareRegistry() {
    if (!registryId) return;
    const url = `${window.location.origin}/registry/${registryId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: title || 'My Baby Registry', url });
        return;
      } catch { /* cancelled — fall through to copy */ }
    }
    copyLink();
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalWanted = items.reduce((n, i) => n + i.qtyWanted, 0);
  const totalPurchased = items.reduce((n, i) => n + i.qtyPurchased, 0);
  const progressPct = totalWanted > 0 ? Math.round((totalPurchased / totalWanted) * 100) : 0;
  const estTotal = items.reduce((sum, i) => sum + i.price * (i.qtyWanted - i.qtyPurchased), 0);

  if (!isOpen) return null;

  // ── Signed-out state ───────────────────────────────────────────────────────
  if (!registryId) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm" onClick={close} />
        <aside className="fixed right-0 top-0 h-full w-full sm:w-[440px] z-50 bg-cream-50 shadow-2xl flex flex-col animate-slideInRight">
          <DrawerHeader title="Baby Registry" onClose={close} />
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-blush-100 flex items-center justify-center text-4xl">🎀</div>
            <div>
              <h3 className="font-display text-2xl text-ink-900">Your wishlist awaits</h3>
              <p className="text-sm text-ink-500 mt-2 leading-relaxed">
                Save your favourite things in one place, then share a single link with
                family and friends. We&apos;ll track what&apos;s been bought so nobody doubles up.
              </p>
            </div>
            <ul className="text-left text-sm text-ink-700 space-y-2 mt-1">
              <li className="flex gap-2"><span className="text-blush-400">✓</span> Free, no account needed</li>
              <li className="flex gap-2"><span className="text-blush-400">✓</span> Just your email and a 4-digit PIN</li>
              <li className="flex gap-2"><span className="text-blush-400">✓</span> Get an email when someone gifts you</li>
            </ul>
            <button onClick={() => setShowSetup(true)} className="btn-primary w-full mt-2">
              Create my registry
            </button>
            <button
              onClick={() => setShowSetup(true)}
              className="text-sm text-ink-500 hover:text-blush-500 transition-colors"
            >
              I already have one →
            </button>
          </div>
        </aside>
        {showSetup && <RegistrySetup onClose={() => setShowSetup(false)} />}
      </>
    );
  }

  // ── Signed-in state ────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm" onClick={close} />

      <aside
        className="fixed right-0 top-0 h-full w-full sm:w-[440px] z-50 bg-cream-50 shadow-2xl flex flex-col animate-slideInRight"
        role="dialog"
        aria-label="Your baby registry"
      >
        {/* Header */}
        <div className="bg-white px-6 pt-5 pb-4 border-b border-ink-900/6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl text-ink-900 truncate">🎀 {title || 'My Baby Registry'}</h2>
              <p className="text-xs text-ink-500 mt-0.5">{ownerName}&apos;s registry</p>
            </div>
            <button
              onClick={close}
              aria-label="Close registry"
              className="text-ink-400 hover:text-ink-900 hover:bg-cream-100 rounded-full p-1.5 transition-colors -mt-1 -mr-1"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {totalWanted > 0 && (
            <div className="mt-4">
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-xs text-ink-500">
                  <strong className="text-ink-900 text-sm">{totalPurchased}</strong> of {totalWanted} gifted
                </span>
                <span className="text-xs font-medium text-blush-500">{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                <div
                  className="h-full bg-blush-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {progressPct === 100 && (
                <p className="text-xs text-sage-600 mt-2 font-medium">
                  🎉 Everything on your registry has been gifted!
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={shareRegistry}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blush-400 text-white rounded-full py-2.5 text-sm font-medium hover:bg-blush-500 transition-colors"
            >
              {copied ? '✓ Link copied!' : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" strokeLinecap="round" />
                  </svg>
                  Share registry
                </>
              )}
            </button>
            <Link
              href={`/registry/${registryId}`}
              onClick={close}
              className="px-4 flex items-center justify-center border border-ink-900/12 rounded-full text-sm font-medium text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors whitespace-nowrap"
            >
              Preview
            </Link>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
            <span className="text-red-400 text-sm">⚠</span>
            <p className="text-xs text-red-500 flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-500 text-xs">✕</button>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && items.length === 0 && <SkeletonList />}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center text-3xl">✨</div>
              <div>
                <h3 className="font-display text-lg text-ink-900">Nothing here yet</h3>
                <p className="text-sm text-ink-500 mt-1.5 max-w-[15rem]">
                  Browse the shop and tap &ldquo;Add to registry&rdquo; to save your first item.
                </p>
              </div>
              <Link href="/shop" onClick={close} className="btn-primary mt-1">Browse products</Link>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item) => {
              const remaining = item.qtyWanted - item.qtyPurchased;
              const fulfilled = remaining <= 0;
              const busy = busyItem === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-3 flex gap-3 border border-ink-900/5 transition-all ${
                    busy ? 'opacity-50' : ''
                  }`}
                >
                  {item.unavailable || !item.image ? (
                    <div className="w-[72px] h-[72px] flex-shrink-0 rounded-xl bg-cream-200 flex items-center justify-center text-ink-400 text-xl">
                      ?
                    </div>
                  ) : (
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={close}
                      className="relative w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden bg-cream-100"
                    >
                      <Image src={item.image} alt={item.name} fill sizes="72px" className="object-cover" />
                    </Link>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      {item.unavailable ? (
                        <p className="text-sm text-ink-400 italic line-clamp-2">{item.name}</p>
                      ) : (
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={close}
                          className="text-sm font-medium text-ink-900 hover:text-blush-500 line-clamp-2 leading-snug"
                        >
                          {item.name}
                        </Link>
                      )}
                      <button
                        onClick={() => removeItem(item)}
                        disabled={busy}
                        aria-label={`Remove ${item.name} from registry`}
                        className="text-ink-300 hover:text-red-400 hover:bg-red-50 rounded-lg p-1 transition-colors flex-shrink-0"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    {!item.unavailable && (
                      <p className="text-sm text-ink-700 font-medium mt-0.5">${item.price.toFixed(2)}</p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-2">
                      {fulfilled ? (
                        <span className="text-xs font-medium text-sage-600 bg-sage-100 px-2.5 py-1 rounded-full">
                          ✓ All gifted
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => changeQty(item, item.qtyWanted - 1)}
                            disabled={busy || item.qtyWanted <= Math.max(1, item.qtyPurchased)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 hover:text-blush-500 disabled:opacity-30 transition-colors flex items-center justify-center text-sm leading-none"
                          >
                            −
                          </button>
                          <span className="text-xs text-ink-700 tabular-nums w-14 text-center">
                            want {item.qtyWanted}
                          </span>
                          <button
                            onClick={() => changeQty(item, item.qtyWanted + 1)}
                            disabled={busy || item.qtyWanted >= 99}
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded-full border border-ink-900/12 text-ink-700 hover:border-blush-400 hover:text-blush-500 disabled:opacity-30 transition-colors flex items-center justify-center text-sm leading-none"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {item.qtyPurchased > 0 && !fulfilled && (
                        <span className="text-xs text-sage-600 font-medium whitespace-nowrap">
                          {item.qtyPurchased} gifted
                        </span>
                      )}
                    </div>

                    {!item.unavailable && !item.inStock && (
                      <p className="text-xs text-amber-600 mt-1.5">Currently out of stock</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {undo && (
            <div className="sticky bottom-2 mt-4 bg-ink-900 text-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
              <span className="text-xs truncate">Removed from registry</span>
              <button
                onClick={() => restoreItem(undo.item)}
                className="text-xs font-semibold text-blush-200 hover:text-white transition-colors whitespace-nowrap"
              >
                Undo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink-900/8 bg-white">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-ink-500">
              {items.length} {items.length === 1 ? 'item' : 'items'} on registry
            </span>
            <span className="font-medium text-ink-900">${estTotal.toFixed(2)} left</span>
          </div>

          {/* Delete confirmation takes over the footer when active */}
          {confirmDelete ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm font-medium text-red-600">Delete this registry?</p>
              <p className="text-xs text-ink-700 mt-1.5 leading-relaxed">
                This permanently removes <strong>{title || 'your registry'}</strong> and all{' '}
                {items.length} {items.length === 1 ? 'item' : 'items'}. Your share link will stop
                working for anyone you sent it to. This can&apos;t be undone.
              </p>
              {totalPurchased > 0 && (
                <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Heads up — {totalPurchased} {totalPurchased === 1 ? 'gift has' : 'gifts have'} already
                  been bought from this registry.
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={deleteRegistry}
                  disabled={deleting}
                  className="flex-1 bg-red-500 text-white rounded-full py-2.5 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete permanently'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="px-5 rounded-full border border-ink-900/12 text-sm font-medium text-ink-700 hover:border-ink-900/25 transition-colors"
                >
                  Keep it
                </button>
              </div>
            </div>
          ) : confirmSignOut ? (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-ink-700">Sign out? Your registry stays saved.</span>
              <button
                onClick={() => { clearRegistry(); setConfirmSignOut(false); }}
                className="font-medium text-blush-500 hover:text-blush-600"
              >
                Yes, sign out
              </button>
              <button onClick={() => setConfirmSignOut(false)} className="text-ink-400 hover:text-ink-700">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setConfirmSignOut(true)}
                className="text-xs text-ink-400 hover:text-ink-700 transition-colors"
              >
                Sign out of registry
              </button>
              <button
                onClick={() => { setConfirmDelete(true); setError(''); }}
                className="text-xs text-ink-400 hover:text-red-500 transition-colors"
              >
                Delete registry
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-ink-900/6 bg-white">
      <h2 className="font-display text-xl text-ink-900">🎀 {title}</h2>
      <button
        onClick={onClose}
        aria-label="Close"
        className="text-ink-400 hover:text-ink-900 hover:bg-cream-100 rounded-full p-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-3 flex gap-3 border border-ink-900/5">
          <div className="w-[72px] h-[72px] rounded-xl bg-cream-200 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-cream-200 rounded-full animate-pulse w-3/4" />
            <div className="h-3 bg-cream-200 rounded-full animate-pulse w-1/3" />
            <div className="h-5 bg-cream-100 rounded-full animate-pulse w-24 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
