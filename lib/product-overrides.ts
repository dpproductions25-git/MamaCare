import { products as staticProducts } from './products';
import { Product } from './types';
import { getAllOverrides, DbOverride } from './db';

/**
 * Merges the static product catalog (from lib/products.ts) with admin-editable
 * overrides stored in Postgres. The override is the source of truth when set.
 *
 * Used on server pages + API routes so the live site reflects admin edits
 * within seconds without redeployment.
 */

function apply(p: Product, o?: DbOverride): Product {
  if (!o) return p;
  return {
    ...p,
    price: o.price != null ? Number(o.price) : p.price,
    compareAtPrice: o.compare_at_price != null ? Number(o.compare_at_price) : p.compareAtPrice,
    shortDescription: o.short_description != null ? o.short_description : p.shortDescription,
    inStock: o.in_stock != null ? o.in_stock : p.inStock,
    bestSeller: o.best_seller != null ? o.best_seller : p.bestSeller
  };
}

/** All products, with overrides applied. */
export async function getMergedProducts(): Promise<Product[]> {
  const overrides = await getAllOverrides();
  return staticProducts.map((p) => apply(p, overrides[p.id]));
}

/** One product by slug, with override applied. */
export async function getMergedProduct(slug: string): Promise<Product | undefined> {
  const overrides = await getAllOverrides();
  const p = staticProducts.find((x) => x.slug === slug);
  return p ? apply(p, overrides[p.id]) : undefined;
}

/** One product by ID, with override applied. */
export async function getMergedProductById(id: string): Promise<Product | undefined> {
  const overrides = await getAllOverrides();
  const p = staticProducts.find((x) => x.id === id);
  return p ? apply(p, overrides[p.id]) : undefined;
}

/** Sync helper used by checkout APIs (which already fetched overrides). */
export function applyOverridesToProducts(
  base: Product[],
  overrides: Record<string, DbOverride>
): Product[] {
  return base.map((p) => apply(p, overrides[p.id]));
}
