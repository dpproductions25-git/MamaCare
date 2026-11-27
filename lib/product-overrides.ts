import { products as staticProducts } from './products';
import { Product, Category, ProductVariant } from './types';
import {
  getAllOverrides, listCustomProducts, getStoreOverrides, getStoreCustomProducts,
  DbOverride, DbCustomProduct
} from './db';
import { repairImageList } from './image-url';
import { applySale } from './sale';

function val<T>(v: T | null | undefined, fallback: T): T {
  return v != null ? v : fallback;
}

/**
 * Safety net for CJ-imported variants. The old CJ import saved CJ's WHOLESALE
 * price (`variantSellPrice`) into each variant's `price`, and a variant price
 * overrides the product price everywhere (storefront, cart, Stripe, PayPal) —
 * so customers were shown and charged our cost (e.g. $3.93 instead of $22.50).
 *
 * A variant priced below half of the product price is never a real retail
 * price for these products, so drop it and let the variant inherit the product
 * price. Applied at read time so it covers existing database rows immediately.
 */
function sanitizeVariants(
  variants: ProductVariant[] | null | undefined,
  productPrice: number
): ProductVariant[] | undefined {
  if (!variants) return undefined;
  return variants.map((v) => {
    if (v.price != null && v.price < productPrice * 0.5) {
      const { price: _wholesale, ...rest } = v;
      return rest;
    }
    return v;
  });
}

function applyOverrideToStatic(p: Product, o?: DbOverride): Product {
  if (!o) return p;
  const price = o.price != null ? Number(o.price) : p.price;
  return {
    ...p,
    name: val(o.name, p.name),
    shortDescription: val(o.short_description, p.shortDescription),
    description: val(o.description, p.description),
    seoDescription: val(o.seo_description, p.seoDescription),
    price,
    compareAtPrice: o.compare_at_price != null ? Number(o.compare_at_price) : p.compareAtPrice,
    image: val(o.image, p.image),
    images: o.images_json != null ? repairImageList(o.images_json) : p.images,
    category: val(o.category as Category, p.category),
    tags: val(o.tags_json, p.tags),
    cjProductId: val(o.cj_product_id, p.cjProductId),
    cjVariantId: val(o.cj_variant_id, p.cjVariantId),
    variants: o.variants_json != null ? sanitizeVariants(o.variants_json, price) : p.variants,
    inStock: val(o.in_stock, p.inStock),
    bestSeller: val(o.best_seller, p.bestSeller)
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
    images: c.images ? repairImageList(c.images) : undefined,
    category: c.category as Category,
    tags: c.tags || [],
    rating: Number(c.rating),
    reviewsCount: c.reviews_count,
    inStock: c.in_stock,
    bestSeller: c.best_seller,
    cjProductId: c.cj_product_id || undefined,
    cjVariantId: c.cj_variant_id || undefined,
    variants: sanitizeVariants(c.variants_json, Number(c.price))
  };
}

export type AdminListing = {
  product: Product;
  isCustom: boolean;
  visible: boolean;
};

export async function getAllProductsForAdmin(): Promise<AdminListing[]> {
  const [overrides, customs] = await Promise.all([getAllOverrides(), listCustomProducts()]);
  return toListings(overrides, customs);
}

function toListings(
  overrides: Record<string, DbOverride>,
  customs: DbCustomProduct[]
): AdminListing[] {
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

export async function getAdminProduct(id: string): Promise<AdminListing | null> {
  const all = await getAllProductsForAdmin();
  return all.find((l) => l.product.id === id) || null;
}

// Sale pricing is applied here (the storefront/checkout view) and NOT in
// getAllProductsForAdmin, so the admin editor never saves a sale price. It is
// applied after any cache, so a sale starts and ends on time.
const toStorefront = (listings: AdminListing[]) =>
  applySale(listings.filter((l) => l.visible).map((l) => l.product));

/** The catalog for storefront pages — cached (lib/store-cache.ts). */
export async function getMergedProducts(): Promise<Product[]> {
  const [overrides, customs] = await Promise.all([getStoreOverrides(), getStoreCustomProducts()]);
  return toStorefront(toListings(overrides, customs));
}

/** The catalog read straight from the database — use wherever money or orders are involved. */
export async function getLiveProducts(): Promise<Product[]> {
  return toStorefront(await getAllProductsForAdmin());
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
export function parseCjUrl(url: string): { pid?: string } {
  if (!url) return {};
  const m = url.match(/-p-([A-Za-z0-9-]+)\.html/i);
  return m ? { pid: m[1] } : {};
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
