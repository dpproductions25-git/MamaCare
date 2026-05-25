import { products as staticProducts } from './products';
import { Product, Category, ProductVariant } from './types';
import { getAllOverrides, listCustomProducts, DbOverride, DbCustomProduct } from './db';

function val<T>(v: T | null | undefined, fallback: T): T {
  return v != null ? v : fallback;
}

function applyOverrideToStatic(p: Product, o?: DbOverride): Product {
  if (!o) return p;
  return {
    ...p,
    name: val(o.name, p.name),
    shortDescription: val(o.short_description, p.shortDescription),
    description: val(o.description, p.description),
    seoDescription: val(o.seo_description, p.seoDescription),
    price: o.price != null ? Number(o.price) : p.price,
    compareAtPrice: o.compare_at_price != null ? Number(o.compare_at_price) : p.compareAtPrice,
    image: val(o.image, p.image),
    images: o.images_json != null ? o.images_json : p.images,
    category: val(o.category as Category, p.category),
    tags: val(o.tags_json, p.tags),
    cjProductId: val(o.cj_product_id, p.cjProductId),
    cjVariantId: val(o.cj_variant_id, p.cjVariantId),
    variants: o.variants_json != null ? o.variants_json : p.variants,
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
    images: c.images || undefined,
    category: c.category as Category,
    tags: c.tags || [],
    rating: Number(c.rating),
    reviewsCount: c.reviews_count,
    inStock: c.in_stock,
    bestSeller: c.best_seller,
    cjProductId: c.cj_product_id || undefined,
    cjVariantId: c.cj_variant_id || undefined,
    variants: c.variants_json || undefined
  };
}

export type AdminListing = {
  product: Product;
  isCustom: boolean;
  visible: boolean;
};

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

export async function getAdminProduct(id: string): Promise<AdminListing | null> {
  const all = await getAllProductsForAdmin();
  return all.find((l) => l.product.id === id) || null;
}

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
