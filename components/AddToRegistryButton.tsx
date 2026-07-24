'use client';

import { useState } from 'react';
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

  const alreadyIn = items.some(
    (i) => i.productId === productId && (i.variantId || null) === (variantId || null)
  );

  async function handleClick() {
    setError('');
    if (!registryId || !pin) {
      setShowSetup(true);
      return;
    }
    if (alreadyIn) {
      open();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/registry/${registryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, productId, variantId: variantId || null, qtyWanted: qty }),
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
        setTimeout(() => setAdded(false), 2000);
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
  }

  let label = alreadyIn ? '✓ In registry' : 'Add to registry';
  if (added) label = '✓ Added to registry!';
  if (loading) label = 'Adding…';

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          onClick={handleClick}
          disabled={loading}
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
