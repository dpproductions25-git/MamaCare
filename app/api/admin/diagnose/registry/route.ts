import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureRegistrySchema } from '@/lib/db-registry';
import { getAllProductsForAdmin } from '@/lib/product-overrides';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only diagnostic for the "wrong product shows in registry" bug.
 *
 * Open /api/admin/diagnose/registry in the browser while logged into admin.
 * Protected by the middleware Basic Auth (matcher covers /api/admin/:path*).
 */
export async function GET() {
  try {
    await ensureRegistrySchema();

    const listings = await getAllProductsForAdmin();

    // 1) Duplicate IDs or slugs would make .find() return the wrong product
    const idCounts = new Map<string, number>();
    const slugCounts = new Map<string, number>();
    for (const l of listings) {
      idCounts.set(l.product.id, (idCounts.get(l.product.id) || 0) + 1);
      slugCounts.set(l.product.slug, (slugCounts.get(l.product.slug) || 0) + 1);
    }
    const duplicateIds = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id, n]) => ({ id, count: n }));
    const duplicateSlugs = [...slugCounts.entries()].filter(([, n]) => n > 1).map(([slug, n]) => ({ slug, count: n }));

    // 2) Raw registry rows, exactly as stored
    const rows = await sql<{
      id: number; registry_id: string; product_id: string;
      variant_id: string | null; qty_wanted: number; qty_purchased: number; added_at: string;
    }>`SELECT * FROM registry_items ORDER BY added_at DESC LIMIT 200;`;

    const items = rows.rows.map((r) => {
      const matches = listings.filter((l) => l.product.id === r.product_id);
      return {
        itemId: r.id,
        registryId: r.registry_id,
        storedProductId: r.product_id,
        storedVariantId: r.variant_id,
        qtyWanted: r.qty_wanted,
        qtyPurchased: r.qty_purchased,
        addedAt: r.added_at,
        matchCount: matches.length,
        resolvesTo: matches.map((m) => ({
          name: m.product.name,
          price: m.product.price,
          slug: m.product.slug,
          isCustom: m.isCustom,
          visible: m.visible,
        })),
      };
    });

    // 3) Anything in the catalog that looks like a test product
    const testish = listings
      .filter((l) => /test/i.test(l.product.name) || l.product.price === 0)
      .map((l) => ({
        id: l.product.id, name: l.product.name, slug: l.product.slug,
        price: l.product.price, isCustom: l.isCustom, visible: l.visible,
      }));

    return NextResponse.json({
      catalogSize: listings.length,
      duplicateIds,
      duplicateSlugs,
      suspectTestProducts: testish,
      registryItems: items,
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
