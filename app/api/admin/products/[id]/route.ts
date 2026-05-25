import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { products as staticProducts } from '@/lib/products';
import {
  upsertOverride, clearOverride, logAudit,
  updateCustomProduct, deleteCustomProduct, getCustomProduct
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH a product. Supports all editable fields:
 *   name, short_description, description, seo_description,
 *   price, compare_at_price, image, images_json (array),
 *   category, tags_json (array), cj_product_id, cj_variant_id,
 *   variants_json (array of ProductVariant),
 *   in_stock, best_seller, visible
 *
 * Static products: writes to product_overrides.
 * Custom products: writes to custom_products.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const actor = headers().get('x-admin-name') || 'unknown';
  const body = await req.json();

  const isCustom = !!body.is_custom;
  const isStatic = staticProducts.some((p) => p.id === params.id);
  const customProduct = !isStatic ? await getCustomProduct(params.id) : null;

  if (!isStatic && !customProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Whitelist + normalize fields
  function pickFields() {
    const f: any = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
    if (has('name')) f.name = String(body.name || '').trim() || null;
    if (has('short_description')) f.short_description = String(body.short_description || '').trim() || null;
    if (has('description')) f.description = String(body.description || '').trim() || null;
    if (has('seo_description')) f.seo_description = body.seo_description == null ? null : String(body.seo_description).trim() || null;
    if (has('price')) f.price = body.price == null ? null : Number(body.price);
    if (has('compare_at_price')) f.compare_at_price = body.compare_at_price == null ? null : Number(body.compare_at_price);
    if (has('image')) f.image = String(body.image || '').trim() || null;
    if (has('images_json')) f.images_json = Array.isArray(body.images_json) ? body.images_json : null;
    if (has('category')) f.category = body.category || null;
    if (has('tags_json')) f.tags_json = Array.isArray(body.tags_json) ? body.tags_json : null;
    if (has('cj_product_id')) f.cj_product_id = body.cj_product_id || null;
    if (has('cj_variant_id')) f.cj_variant_id = body.cj_variant_id || null;
    if (has('variants_json')) f.variants_json = Array.isArray(body.variants_json) ? body.variants_json : null;
    if (has('in_stock')) f.in_stock = !!body.in_stock;
    if (has('best_seller')) f.best_seller = !!body.best_seller;
    if (has('visible')) f.visible = !!body.visible;
    return f;
  }

  const fields = pickFields();

  try {
    if (isCustom || (!isStatic && customProduct)) {
      // Map override-field names → custom_products column names where they differ
      const customFields: any = { ...fields };
      // custom_products uses 'images' not 'images_json'; 'tags' not 'tags_json'
      if ('images_json' in customFields) {
        customFields.images = customFields.images_json;
        delete customFields.images_json;
      }
      if ('tags_json' in customFields) {
        customFields.tags = customFields.tags_json;
        delete customFields.tags_json;
      }
      await updateCustomProduct(params.id, customFields);
    } else {
      await upsertOverride(params.id, { ...fields, updated_by: actor });
    }
    await logAudit(actor, 'product.update', params.id, fields);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('product PATCH failed', e);
    return NextResponse.json({ error: e.message || 'Save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const actor = headers().get('x-admin-name') || 'unknown';
  const url = new URL(req.url);
  const isCustom = url.searchParams.get('is_custom') === 'true';

  try {
    if (isCustom) {
      await deleteCustomProduct(params.id);
      await logAudit(actor, 'product.delete', params.id);
    } else {
      await clearOverride(params.id);
      await logAudit(actor, 'product.reset', params.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
