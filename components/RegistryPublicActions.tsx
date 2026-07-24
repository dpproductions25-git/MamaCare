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

export default function RegistryPublicActions({ registryId, itemId, productId, variantId }: Props) {
  const addToCart = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    // Pass registry metadata into the cart item so the checkout webhook can
    // mark the item as purchased and email the registry owner automatically.
    addToCart(productId, 1, variantId || undefined, registryId, itemId);
    setAdded(true);
  }

  if (added) {
    return (
      <div className="mt-3 text-center py-2.5 px-4 rounded-full bg-sage-50 border border-sage-200">
        <p className="text-xs font-medium text-sage-600">✓ In your cart</p>
        <p className="text-[11px] text-sage-500 mt-0.5">Registry updates automatically after purchase</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      className="mt-3 w-full btn-primary text-sm py-2.5"
    >
      Add to cart 🎁
    </button>
  );
}
