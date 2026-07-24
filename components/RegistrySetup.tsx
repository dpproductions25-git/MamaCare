'use client';

import { useState } from 'react';
import { useRegistry, RegistryItem } from '@/lib/registry-store';

type Mode = 'choose' | 'create' | 'find';

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

export default function RegistrySetup({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (registryId: string, pin: string) => void;
}) {
  const { setRegistry, setItems, open } = useRegistry();
  const [mode, setMode] = useState<Mode>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPin, setCPin] = useState('');
  const [cTitle, setCTitle] = useState('');

  // Find form
  const [fEmail, setFEmail] = useState('');
  const [fPin, setFPin] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(cPin)) { setError('PIN must be exactly 4 digits.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cEmail, pin: cPin, ownerName: cName, title: cTitle || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create registry.'); return; }
      setRegistry({
        id: data.registry.id,
        email: data.registry.email,
        pin: cPin,
        ownerName: data.registry.owner_name,
        title: data.registry.title,
      });
      setItems([]);
      onSuccess?.(data.registry.id, cPin);
      open();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({ email: fEmail, pin: fPin });
      const res = await fetch(`/api/registry?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not find registry.'); return; }
      // Also load items
      const itemsRes = await fetch(`/api/registry/${data.registry.id}`);
      const itemsData = await itemsRes.json();
      setRegistry({
        id: data.registry.id,
        email: data.registry.email,
        pin: fPin,
        ownerName: data.registry.owner_name,
        title: data.registry.title,
      });
      setItems(mapItems(itemsData.items || []));
      open();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm animate-fadeUp">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-ink-400 hover:text-ink-700"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-7">
          <span className="text-3xl">🎀</span>
          <h2 className="font-display text-2xl text-ink-900 mt-2">Baby Registry</h2>
          <p className="text-sm text-ink-500 mt-1">Save your favourite items and share with family &amp; friends</p>
        </div>

        {/* Choose mode */}
        {mode === 'choose' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode('create')}
              className="btn-primary w-full text-center"
            >
              Create a new registry
            </button>
            <button
              onClick={() => setMode('find')}
              className="w-full border-2 border-ink-900/10 rounded-full py-3 px-6 font-medium text-ink-700 hover:border-blush-400 hover:text-blush-500 transition-colors"
            >
              Access my existing registry
            </button>
          </div>
        )}

        {/* Create form */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Your name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="w-full border border-ink-900/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Email address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                className="w-full border border-ink-900/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">4-digit PIN</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
                placeholder="e.g. 1234"
                value={cPin}
                onChange={(e) => setCPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-ink-900/15 rounded-xl px-4 py-3 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
              <p className="text-xs text-ink-400 mt-1">Remember this PIN — you'll need it to add or remove items.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Registry name <span className="text-ink-400 font-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Baby Emma's Wishlist"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                className="w-full border border-ink-900/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Creating…' : 'Create registry'}
            </button>
            <button type="button" onClick={() => { setMode('choose'); setError(''); }} className="text-sm text-ink-400 hover:text-ink-700 text-center">
              ← Back
            </button>
          </form>
        )}

        {/* Find form */}
        {mode === 'find' && (
          <form onSubmit={handleFind} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Email address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={fEmail}
                onChange={(e) => setFEmail(e.target.value)}
                className="w-full border border-ink-900/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">4-digit PIN</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
                placeholder="••••"
                value={fPin}
                onChange={(e) => setFPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-ink-900/15 rounded-xl px-4 py-3 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Looking up…' : 'Access my registry'}
            </button>
            <button type="button" onClick={() => { setMode('choose'); setError(''); }} className="text-sm text-ink-400 hover:text-ink-700 text-center">
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
