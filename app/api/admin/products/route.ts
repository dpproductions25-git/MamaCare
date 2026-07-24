import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { insertCustomProduct, logAudit } from '@/lib/db';
import { parseCjUrl, slugify } from '@/lib/product-overrides';
import { products as staticProducts, categories } from '@/lib/products';
import { listCustomProducts } from '@/lib/db';
import type { Category } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const actor = headers().get('x-admin-name') || 'unknown';
  const body = await req.json();

  // Validate required fields
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name required.' }, { status: 400 });
  if (!body.short_description?.trim()) return NextResponse.json({ error: 'Short description required.' }, { status: 400 });
  if (!body.description?.trim()) return NextResponse.json({ error: 'Full description required.' }, { status: 400 });
  if (!body.image?.trim()) return NextResponse.json({ error: 'Image URL required.' }, { status: 400 });
  if (!body.price || isNaN(Number(body.price))) return NextResponse.json({ error: 'Valid price required.' }, { status: 400 });
  if (!body.category || !categories.some((c) => c.slug === body.category)) {
    return NextResponse.json({ error: 'Valid category required.' }, { status: 400 });
  }

  // Generate slug if not provided
  let slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);
  if (!slug) slug = `product-${Date.now()}`;

  // Make sure the slug doesn't clash with a static product OR an existing custom product
  const customs = await listCustomProducts();
  const allExistingSlugs = [
    ...staticProducts.map((p) => p.slug),
    ...customs.map((c) => c.slug)
  ];
  let finalSlug = slug;
  let counter = 2;
  while (allExistingSlugs.includes(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  // Generate unique ID
  const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Extract CJ Product ID from URL if provided
  const cjFromUrl = body.cj_url ? parseCjUrl(body.cj_url).pid : null;
  const cjProductId = cjFromUrl || body.cj_product_id?.trim() || null;
  const cjVariantId = body.cj_variant_id?.trim() || null;

  // Parse comma-separated extra image URLs
  const extraImages = body.extra_images?.trim()
    ? body.extra_images.split(',').map((s: string) => s.trim()).filter(Boolean)
    : null;
  const allImages = extraImages
    ? [body.image, ...extraImages]
    : null;

  // Parse tags
  const tags = body.tags?.trim()
    ? body.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [body.category, 'new'];

  // Parse variants if provided
  const variantsJson =
    Array.isArray(body.variants_json) && body.variants_json.length > 0
      ? body.variants_json
      : null;

  try {
    await insertCustomProduct({
      id,
      slug: finalSlug,
      name: body.name.trim(),
      short_description: body.short_description.trim(),
      description: body.description.trim(),
      seo_description: body.seo_description?.trim() || null,
      price: Number(body.price),
      compare_at_price: body.compare_at_price ? Number(body.compare_at_price) : null,
      image: body.image.trim(),
      images: allImages,
      category: body.category as Category,
      tags,
      variants_json: variantsJson,
      rating: 5.0,
      reviews_count: 0,
      in_stock: body.in_stock !== false,
      best_seller: !!body.best_seller,
      visible: true,
      cj_product_id: cjProductId,
      cj_variant_id: cjVariantId,
      created_by: actor
    });

    await logAudit(actor, 'product.create', id, {
      slug: finalSlug,
      name: body.name.trim(),
      price: Number(body.price),
      category: body.category
    });

    return NextResponse.json({ ok: true, id, slug: finalSlug });
  } catch (e: any) {
    console.error('insertCustomProduct failed', e);
    return NextResponse.json({ error: e.message || 'Create failed' }, { status: 500 });
  }
}
