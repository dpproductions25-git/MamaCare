'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './types';
import { products } from './products';

type CartState = {
  items: CartItem[];
  add: (productId: string, qty?: number, variantId?: string) => void;
  remove: (productId: string, variantId?: string) => void;
  setQty: (productId: string, qty: number, variantId?: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

const sameLine = (i: CartItem, productId: string, variantId?: string) =>
  i.productId === productId && (i.variantId || '') === (variantId || '');

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (productId, qty = 1, variantId) =>
        set((state) => {
          const existing = state.items.find((i) => sameLine(i, productId, variantId));
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, productId, variantId) ? { ...i, qty: i.qty + qty } : i
              )
            };
          }
          return { items: [...state.items, { productId, qty, variantId }] };
        }),
      remove: (productId, variantId) =>
        set((state) => ({ items: state.items.filter((i) => !sameLine(i, productId, variantId)) })),
      setQty: (productId, qty, variantId) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => !sameLine(i, productId, variantId))
              : state.items.map((i) =>
                  sameLine(i, productId, variantId) ? { ...i, qty } : i
                )
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => {
          const product = products.find((p) => p.id === i.productId);
          if (!product) return sum;
          const variant = i.variantId
            ? product.variants?.find((v) => v.vid === i.variantId)
            : undefined;
          const price = variant?.price ?? product.price;
          return sum + price * i.qty;
        }, 0)
    }),
    { name: 'mamacare-cart' }
  )
);
