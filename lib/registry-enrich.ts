import { getMergedProducts } from './product-overrides';
import type { DbRegistryItem } from './db-registry';

/**
 * A registry item with its product details resolved.
 *
 * IMPORTANT: enrichment MUST go through getMergedProducts() (not the static
 * `products` array) so that products created or edited in the admin panel
 * resolve correctly. Enriching from the static list silently drops
 * admin-created products, which makes them invisible — and therefore
 * impossible to delete — in the UI.
 */
export type EnrichedRegistryItem = {
  id: number;
  productId: string;
  variantId: string | null;
  qtyWanted: number;
  qtyPurchased: number;
  note: string | null;
  // Resolved product fields
  name: string;
  image: string;
  price: number;
  slug: string;
  inStock: boolean;
  /** True when the product no longer exists (deleted/hidden in admin) */
  unavailable: boolean;
};

export async function enrichRegistryItems(
  rows: DbRegistryItem[]
): Promise<EnrichedRegistryItem[]> {
  if (!rows.length) return [];

  let allProducts: Awaited<ReturnType<typeof getMergedProducts>> = [];
  try {
    allProducts = await getMergedProducts();
  } catch {
    // DB unavailable — fall through and mark everything unavailable rather
    // than dropping rows entirely, so the user can still remove them.
  }

  return rows.map((item) => {
    const product = allProducts.find((p) => p.id === item.product_id);
    const variant = item.variant_id
      ? product?.variants?.find((v) => v.vid === item.variant_id)
      : undefined;

    const base = {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id ?? null,
      qtyWanted: item.qty_wanted,
      qtyPurchased: item.qty_purchased,
      note: item.note ?? null,
    };

    // Never drop the row — a missing product still needs to be removable.
    if (!product) {
      return {
        ...base,
        name: 'This product is no longer available',
        image: '', // UI renders a fallback block instead of next/image
        price: 0,
        slug: '',
        inStock: false,
        unavailable: true,
      };
    }

    return {
      ...base,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      image: variant?.image || product.image,
      price: variant?.price ?? product.price,
      slug: product.slug,
      inStock: product.inStock,
      unavailable: false,
    };
  });
}
