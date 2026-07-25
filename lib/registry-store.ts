'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Items are enriched server-side (see lib/registry-enrich.ts) so the client
 * never has to resolve product data itself. Client-side enrichment from the
 * static product list used to silently drop admin-created products.
 */
export type RegistryItem = {
  id: number;
  productId: string;
  variantId: string | null;
  qtyWanted: number;
  qtyPurchased: number;
  note: string | null;
  name: string;
  image: string;
  price: number;
  slug: string;
  inStock: boolean;
  unavailable: boolean;
};

type RegistryState = {
  registryId: string | null;
  email: string | null;
  pin: string | null; // stored so the user doesn't re-enter on every action
  ownerName: string | null;
  title: string | null;
  items: RegistryItem[];
  isOpen: boolean;

  open: () => void;
  close: () => void;
  setRegistry: (r: { id: string; email: string; pin: string; ownerName: string; title: string }) => void;
  clearRegistry: () => void;
  setItems: (items: RegistryItem[]) => void;
};

export const useRegistry = create<RegistryState>()(
  persist(
    (set) => ({
      registryId: null,
      email: null,
      pin: null,
      ownerName: null,
      title: null,
      items: [],
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      setRegistry: ({ id, email, pin, ownerName, title }) =>
        set({ registryId: id, email, pin, ownerName, title }),

      clearRegistry: () =>
        set({ registryId: null, email: null, pin: null, ownerName: null, title: null, items: [] }),

      setItems: (items) => set({ items }),
    }),
    { name: 'mamacare-registry' }
  )
);
