import { products as staticProducts } from './products';
import { Product, Category } from './types';
import { getAllOverrides, listCustomProducts, DbOverride, DbCustomProduct } from './db';

/**
 * Merge logic for the live catalog:
 *
 *   final = (static products + DB overrides) ∪ (custom DB products)
 *
 * - Static products get their fields overridden by `product_overrides` row.
 * - Hidden products (visible=false in override OR in custom) are filtered out
 *   for PUBLIC consumers but stay visible to admin.
 * - Custom products are entirely DB-backed (created via /admin/products/new).
 */

function applyOverrideToStatic(p: Product, o?: DbOverride): Product {
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

function customToProduct(c: DbCustomProduct): Product {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    shortDescription: c.short_description,
    description: c.description,
    seoDescription: c.seo_description || undefined,
    price: Number(c.price),
    compareAtPrice: c.compare_at_price != null ? Number(c.compare_at_price) : undefined,
    currency: 'USD',
    image: c.image,
    images: c.images || undefined,
    category: c.category as Category,
    tags: c.tags || [],
    rating: Number(c.rating),
    reviewsCount: c.reviews_count,
    inStock: c.in_stock,
    bestSeller: c.best_seller,
    cjProductId: c.cj_product_id || undefined,
    cjVariantId: c.cj_variant_id || undefined
  };
}

export type AdminListing = {
  product: Product;
  isCustom: boolean;
  visible: boolean;
};

/** All products including hidden ones (for admin pages). */
export async function getAllProductsForAdmin(): Promise<AdminListing[]> {
  const [overrides, customs] = await Promise.all([getAllOverrides(), listCustomProducts()]);

  const staticListings: AdminListing[] = staticProducts.map((p) => {
    const o = overrides[p.id];
    return {
      product: applyOverrideToStatic(p, o),
      isCustom: false,
      visible: o?.visible !== false
    };
  });

  const customListings: AdminListing[] = customs.map((c) => ({
    product: customToProduct(c),
    isCustom: true,
    visible: c.visible
  }));

  return [...staticListings, ...customListings];
}

/** Products for PUBLIC pages — hidden ones filtered out. */
export async function getMergedProducts(): Promise<Product[]> {
  const listings = await getAllProductsForAdmin();
  return listings.filter((l) => l.visible).map((l) => l.product);
}

export async function getMergedProduct(slug: string): Promise<Product | undefined> {
  const list = await getMergedProducts();
  return list.find((p) => p.slug === slug);
}

export async function getMergedProductById(id: string): Promise<Product | undefined> {
  const list = await getMergedProducts();
  return list.find((p) => p.id === id);
}

export function buildFullCatalog(
  overrides: Record<string, DbOverride>,
  customs: DbCustomProduct[]
): Product[] {
  const staticOut = staticProducts.map((p) => applyOverrideToStatic(p, overrides[p.id]));
  const customOut = customs.map(customToProduct);
  return [...staticOut, ...customOut];
}

export function applyOverridesToProducts(
  base: Product[],
  overrides: Record<string, DbOverride>
): Product[] {
  return base.map((p) => applyOverrideToStatic(p, overrides[p.id]));
}

// ─── CJ URL parsing ───

/**
 * Parse a CJ Dropshipping product URL and extract the product ID.
 * Examples:
 *   https://www.cjdropshipping.com/product/cute-product-p-2001551585737940994.html
 *      → "2001551585737940994"
 *   https://www.cjdropshipping.com/product/another-p-CDD1C382-6B37-4FCE-BF8A-DD604986F4E1.html
 *      → "CDD1C382-6B37-4FCE-BF8A-DD604986F4E1"
 */
export function parseCjUrl(url: string): { pid?: string } {
  if (!url) return {};
  const m = url.match(/-p-([A-Za-z0-9-]+)\.html/i);
  return m ? { pid: m[1] } : {};
}

/** Generate a URL-friendly slug from a name. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
