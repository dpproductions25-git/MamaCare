'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';

export default function AddToCartButton({ productId, variantId }: { productId: string; variantId?: string }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  function handleAdd() {
    add(productId, qty, variantId);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="inline-flex items-center bg-white border border-ink-900/10 rounded-full">
        <button type="button" aria-label="Decrease quantity" className="w-10 h-10 text-ink-700 hover:text-blush-500" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
        <span aria-live="polite" className="w-8 text-center">{qty}</span>
        <button type="button" aria-label="Increase quantity" className="w-10 h-10 text-ink-700 hover:text-blush-500" onClick={() => setQty((q) => q + 1)}>+</button>
      </div>
      <button onClick={handleAdd} className="btn-primary w-full sm:w-auto">
        {added ? 'Added!' : 'Add to cart'}
      </button>
    </div>
  );
}
