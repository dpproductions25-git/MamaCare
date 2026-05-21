import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { products } from '@/lib/products';
import { upsertOverride, clearOverride, logAudit } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const actor = headers().get('x-admin-name') || 'unknown';
  const body = await req.json();

  // Whitelist editable fields
  const fields = {
    price: typeof body.price === 'number' ? body.price : undefined,
    compare_at_price:
      body.compare_at_price === null
        ? null
        : typeof body.compare_at_price === 'number'
          ? body.compare_at_price
          : undefined,
    short_description:
      typeof body.short_description === 'string' ? body.short_description.trim() : undefined,
    in_stock: typeof body.in_stock === 'boolean' ? body.in_stock : undefined,
    best_seller: typeof body.best_seller === 'boolean' ? body.best_seller : undefined,
    updated_by: actor
  };

  try {
    await upsertOverride(params.id, fields);
    await logAudit(actor, 'product.update', params.id, fields);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('upsertOverride failed', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const actor = headers().get('x-admin-name') || 'unknown';
  try {
    await clearOverride(params.id);
    await logAudit(actor, 'product.reset', params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
