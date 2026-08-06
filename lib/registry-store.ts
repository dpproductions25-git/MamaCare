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

/**
 * The subset actually written to localStorage — identity only.
 *
 * Declared explicitly because partialize and migrate must agree on the shape.
 * When they disagreed, zustand inferred one shape from migrate and a different
 * one from partialize, which is the type error the build reported.
 */
type PersistedRegistry = Pick<
  RegistryState,
  'registryId' | 'email' | 'pin' | 'ownerName' | 'title'
>;

export const useRegistry = create<RegistryState>()(
  persist<RegistryState, [], [], PersistedRegistry>(
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
    {
      name: 'mamacare-registry',
      /**
       * Only persist identity — never items or isOpen.
       *
       * Persisting `items` meant a stale localStorage copy rendered before the
       * server responded, so adding a product briefly showed the WRONG items
       * (whatever was cached from a previous session). Persisting `isOpen`
       * also made the drawer spring open by itself on the next page load.
       *
       * Items are always fetched fresh from the server instead.
       */
      partialize: (s): PersistedRegistry => ({
        registryId: s.registryId,
        email: s.email,
        pin: s.pin,
        ownerName: s.ownerName,
        title: s.title,
      }),

      /**
       * partialize only controls what gets WRITTEN. Anyone who used the site
       * before this change still has a stale `items` array (and `isOpen`) sitting
       * in localStorage, and the default rehydrate would merge it straight back
       * in — showing the wrong products all over again.
       *
       * Bumping the version forces this migrate to run once per browser and
       * throw the old cached fields away.
       */
      version: 2,
      // Returns the PERSISTED subset only — items/isOpen are re-established by
      // merge below. Returning them here made the persisted type disagree with
      // partialize, which is what the build caught.
      migrate: (persisted: any): PersistedRegistry => ({
        registryId: persisted?.registryId ?? null,
        email: persisted?.email ?? null,
        pin: persisted?.pin ?? null,
        ownerName: persisted?.ownerName ?? null,
        title: persisted?.title ?? null,
      }),

      // Belt and braces: never let a persisted value win for items/isOpen.
      // Returns the FULL state, so items/isOpen are forced back to defaults
      // regardless of what an older localStorage entry contains.
      merge: (persisted: any, current): RegistryState => ({
        ...current,
        registryId: persisted?.registryId ?? null,
        email: persisted?.email ?? null,
        pin: persisted?.pin ?? null,
        ownerName: persisted?.ownerName ?? null,
        title: persisted?.title ?? null,
        items: [],
        isOpen: false,
      }),
    }
  )
);
