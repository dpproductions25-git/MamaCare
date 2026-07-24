'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';

type Props = {
  registryId: string;
  itemId: number;
  productId: string;
  variantId: string | null;
  slug: string;
};

export default function RegistryPublicActions({ registryId, itemId, productId, variantId, slug }: Props) {
  const addToCart = useCart((s) => s.add);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  async function handleAddToCart() {
    addToCart(productId, 1, variantId || undefined);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);

    // Optimistically mark as purchased on the registry
    setMarking(true);
    try {
      await fetch(`/api/registry/${registryId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, qty: 1 }),
      });
      setMarked(true);
    } finally {
      setMarking(false);
    }
  }

  if (marked) {
    return (
      <div className="mt-3 text-center text-xs text-sage-500 font-medium py-2 border border-sage-200 rounded-full bg-sage-50">
        ✓ Added to cart!
      </div>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={marking}
      className="mt-3 w-full btn-primary text-sm py-2.5 disabled:opacity-60"
    >
      {addedToCart ? '✓ Added to cart!' : marking ? 'Adding…' : 'Add to cart'}
    </button>
  );
}
