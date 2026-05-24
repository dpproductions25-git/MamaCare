import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { products as staticProducts } from '@/lib/products';
import {
  upsertOverride, clearOverride, logAudit,
  updateCustomProduct, deleteCustomProduct, getCustomProduct
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const actor = headers().get('x-admin-name') || 'unknown';
  const body = await req.json();

  const isCustom = !!body.is_custom;
  const isStatic = staticProducts.some((p) => p.id === params.id);
  const customProduct = !isStatic ? await getCustomProduct(params.id) : null;

  if (!isStatic && !customProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  try {
    if (isCustom || (!isStatic && customProduct)) {
      // Update custom product directly
      await updateCustomProduct(params.id, {
        price: typeof body.price === 'number' ? body.price : undefined,
        compare_at_price:
          body.compare_at_price === null ? null
            : typeof body.compare_at_price === 'number' ? body.compare_at_price
            : undefined,
        short_description: typeof body.short_description === 'string' ? body.short_description.trim() : undefined,
        in_stock: typeof body.in_stock === 'boolean' ? body.in_stock : undefined,
        best_seller: typeof body.best_seller === 'boolean' ? body.best_seller : undefined,
        visible: typeof body.visible === 'boolean' ? body.visible : undefined
      });
      await logAudit(actor, 'product.update', params.id, body);
    } else {
      // Apply override to static product
      await upsertOverride(params.id, {
        price: typeof body.price === 'number' ? body.price : undefined,
        compare_at_price:
          body.compare_at_price === null ? null
            : typeof body.compare_at_price === 'number' ? body.compare_at_price
            : undefined,
        short_description: typeof body.short_description === 'string' ? body.short_description.trim() : undefined,
        in_stock: typeof body.in_stock === 'boolean' ? body.in_stock : undefined,
        best_seller: typeof body.best_seller === 'boolean' ? body.best_seller : undefined,
        visible: typeof body.visible === 'boolean' ? body.visible : undefined,
        updated_by: actor
      });
      await logAudit(actor, 'product.update', params.id, body);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('product PATCH failed', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const actor = headers().get('x-admin-name') || 'unknown';
  const url = new URL(req.url);
  const isCustom = url.searchParams.get('is_custom') === 'true';

  try {
    if (isCustom) {
      // Truly delete the custom product
      await deleteCustomProduct(params.id);
      await logAudit(actor, 'product.delete', params.id);
    } else {
      // Static product — just clear the override (resets to code defaults)
      await clearOverride(params.id);
      await logAudit(actor, 'product.reset', params.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
