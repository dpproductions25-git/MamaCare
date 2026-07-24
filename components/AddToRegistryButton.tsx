'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRegistry } from '@/lib/registry-store';
import RegistrySetup from './RegistrySetup';

type Props = {
  productId: string;
  variantId?: string | null;
  qty?: number;
};

export default function AddToRegistryButton({ productId, variantId, qty = 1 }: Props) {
  const { registryId, pin, items, setItems, open } = useRegistry();
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  // Tracks that the user clicked "Add" before having a registry — will auto-add once one is created
  const [pendingAdd, setPendingAdd] = useState(false);

  const alreadyIn = items.some(
    (i) => i.productId === productId && (i.variantId || null) === (variantId || null)
  );

  const doAdd = useCallback(async (rid: string, p: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/registry/${rid}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p, productId, variantId: variantId || null, qtyWanted: qty }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems(
          data.items.map((i: any) => ({
            id: i.id,
            productId: i.product_id,
            variantId: i.variant_id ?? null,
            qtyWanted: i.qty_wanted,
            qtyPurchased: i.qty_purchased,
            note: i.note ?? null,
          }))
        );
        setAdded(true);
        open();
        setTimeout(() => setAdded(false), 2500);
      } else {
        setError(data.error || 'Could not add to registry.');
        setTimeout(() => setError(''), 4000);
      }
    } catch {
      setError('Network error — please try again.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  }, [productId, variantId, qty, setItems, open]);

  // After setup creates/finds a registry, auto-complete the add the user originally clicked
  useEffect(() => {
    if (pendingAdd && registryId && pin && !alreadyIn) {
      setPendingAdd(false);
      doAdd(registryId, pin);
    }
  }, [pendingAdd, registryId, pin, alreadyIn, doAdd]);

  function handleClick() {
    setError('');
    if (!registryId || !pin) {
      setPendingAdd(true);
      setShowSetup(true);
      return;
    }
    if (alreadyIn) {
      open();
      return;
    }
    doAdd(registryId, pin);
  }

  let label = alreadyIn ? '✓ In registry' : 'Add to registry';
  if (added) label = '✓ Added to registry!';
  if (loading || (pendingAdd && !registryId)) label = 'Adding…';

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          onClick={handleClick}
          disabled={loading || (pendingAdd && !registryId)}
          className={`flex items-center gap-2 border-2 rounded-full py-3 px-6 font-medium text-sm transition-all disabled:opacity-60 ${
            alreadyIn
              ? 'border-sage-400 text-sage-600 bg-sage-50'
              : 'border-blush-300 text-blush-600 hover:bg-blush-50 hover:border-blush-400'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {label}
        </button>
        {error && <p className="text-xs text-red-500 px-2">{error}</p>}
      </div>
      {showSetup && <RegistrySetup onClose={() => setShowSetup(false)} />}
    </>
  );
}
