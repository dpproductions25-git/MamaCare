import { sql } from '@vercel/postgres';
import { getProductDetail, getStockByVid, normalizeImageSet } from './cj';
import { getAllProductsForAdmin } from './product-overrides';
import { upsertOverride, updateCustomProduct } from './db';

/**
 * Scheduled CJ sync.
 *
 * CJ has no webhooks for custom storefronts — their "connect store" feature
 * only supports Shopify/WooCommerce/eBay. So this polls CJ on a schedule for
 * every product that has a cjProductId stored.
 *
 * What it does:
 *   - stock      → marks a product out of stock when CJ has none, back in when restocked
 *   - cost price → records CJ's cost and FLAGS changes for review (never repricing
 *                  automatically, because retail prices are set by hand)
 *   - photos     → pulls in new CJ images, preserving the chosen main image
 */

export type SyncOutcome = {
  productId: string;
  name: string;
  stockChanged?: string;
  costChanged?: string;
  photosChanged?: string;
  error?: string;
};

export async function ensureCjSyncSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS cj_sync_state (
      product_id TEXT PRIMARY KEY,
      cj_product_id TEXT,
      last_cost NUMERIC,
      last_stock INT,
      cost_changed_at TIMESTAMPTZ,
      previous_cost NUMERIC,
      acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
      last_synced_at TIMESTAMPTZ DEFAULT NOW(),
      last_error TEXT
    );
  `;
}

/** Cost changes awaiting your review, newest first. */
export async function listCostAlerts() {
  await ensureCjSyncSchema();
  const r = await sql<{
    product_id: string; cj_product_id: string;
    last_cost: string; previous_cost: string; cost_changed_at: string;
  }>`
    SELECT product_id, cj_product_id, last_cost, previous_cost, cost_changed_at
    FROM cj_sync_state
    WHERE acknowledged = FALSE AND cost_changed_at IS NOT NULL
    ORDER BY cost_changed_at DESC
    LIMIT 200;
  `;
  return r.rows;
}

export async function acknowledgeCostAlert(productId: string) {
  await ensureCjSyncSchema();
  await sql`UPDATE cj_sync_state SET acknowledged = TRUE WHERE product_id = ${productId};`;
}

/** Sync one product against CJ. Never throws — failures are reported, not fatal. */
async function syncOne(listing: {
  id: string; name: string; cjProductId: string; isCustom: boolean;
  image?: string; images?: string[];
}, opts: { syncPhotos: boolean }): Promise<SyncOutcome> {
  const out: SyncOutcome = { productId: listing.id, name: listing.name };

  try {
    const detail = await getProductDetail(listing.cjProductId);

    // ── Stock ───────────────────────────────────────────────────────────────
    let totalStock: number | null = null;
    const variants = detail.variants || [];
    if (variants.length) {
      let sum = 0;
      // Cap the number of variant lookups — a product with 40 variants would
      // otherwise blow the function's time budget.
      for (const v of variants.slice(0, 10)) {
        try {
          const rows = await getStockByVid(v.vid);
          sum += rows.reduce((n, r) => n + (Number(r.storageNum) || 0), 0);
        } catch { /* one variant failing shouldn't void the whole product */ }
      }
      totalStock = sum;
    }

    // ── Cost ────────────────────────────────────────────────────────────────
    const cost = Number(detail.sellPrice);
    const costValid = Number.isFinite(cost) && cost > 0;

    await ensureCjSyncSchema();
    const prev = await sql<{ last_cost: string; last_stock: number }>`
      SELECT last_cost, last_stock FROM cj_sync_state WHERE product_id = ${listing.id};
    `;
    const previousCost = prev.rows[0]?.last_cost != null ? Number(prev.rows[0].last_cost) : null;

    const costMoved =
      costValid && previousCost != null && Math.abs(cost - previousCost) > 0.009;

    if (costMoved) {
      out.costChanged = `$${previousCost!.toFixed(2)} → $${cost.toFixed(2)}`;
      await sql`
        UPDATE cj_sync_state
        SET last_cost = ${cost}, previous_cost = ${previousCost},
            cost_changed_at = NOW(), acknowledged = FALSE, last_synced_at = NOW()
        WHERE product_id = ${listing.id};
      `;
    } else {
      await sql`
        INSERT INTO cj_sync_state (product_id, cj_product_id, last_cost, last_stock, last_synced_at)
        VALUES (${listing.id}, ${listing.cjProductId}, ${costValid ? cost : null}, ${totalStock}, NOW())
        ON CONFLICT (product_id) DO UPDATE
          SET cj_product_id = EXCLUDED.cj_product_id,
              last_cost = COALESCE(EXCLUDED.last_cost, cj_sync_state.last_cost),
              last_stock = EXCLUDED.last_stock,
              last_synced_at = NOW(),
              last_error = NULL;
      `;
    }

    // ── Apply changes to the product ────────────────────────────────────────
    const fields: any = {};

    if (totalStock !== null) {
      const shouldBeInStock = totalStock > 0;
      fields.in_stock = shouldBeInStock;
      const wasStock = prev.rows[0]?.last_stock;
      if (wasStock != null && (wasStock > 0) !== shouldBeInStock) {
        out.stockChanged = shouldBeInStock ? `back in stock (${totalStock})` : 'out of stock';
      }
    }

    if (opts.syncPhotos) {
      const cjImages = normalizeImageSet(detail.productImageSet);
      if (cjImages.length) {
        const current = listing.images || [];
        const fresh = cjImages.filter((u) => !current.includes(u));
        if (fresh.length) {
          // Append rather than replace, and keep the existing main image if it
          // still exists — so curation done in admin isn't wiped out.
          const merged = [...current, ...fresh];
          fields.images_json = merged;
          out.photosChanged = `+${fresh.length} new photo${fresh.length === 1 ? '' : 's'}`;
        }
      }
    }

    if (Object.keys(fields).length) {
      if (listing.isCustom) {
        const cf: any = { ...fields };
        if ('images_json' in cf) { cf.images = cf.images_json; delete cf.images_json; }
        await updateCustomProduct(listing.id, cf);
      } else {
        await upsertOverride(listing.id, { ...fields, updated_by: 'cj-sync' });
      }
    }

    return out;
  } catch (e: any) {
    out.error = e?.message || 'unknown error';
    try {
      await sql`
        INSERT INTO cj_sync_state (product_id, cj_product_id, last_error, last_synced_at)
        VALUES (${listing.id}, ${listing.cjProductId}, ${out.error}, NOW())
        ON CONFLICT (product_id) DO UPDATE
          SET last_error = EXCLUDED.last_error, last_synced_at = NOW();
      `;
    } catch { /* state table unavailable — the outcome is still reported */ }
    return out;
  }
}

/** Sync every product that has a CJ product id linked. */
export async function syncAllFromCj(opts: { syncPhotos?: boolean; limit?: number } = {}) {
  const listings = await getAllProductsForAdmin();
  const linked = listings
    .filter((l) => !!l.product.cjProductId)
    .slice(0, opts.limit ?? 40);

  const results: SyncOutcome[] = [];
  for (const l of linked) {
    results.push(
      await syncOne(
        {
          id: l.product.id,
          name: l.product.name,
          cjProductId: l.product.cjProductId!,
          isCustom: l.isCustom,
          image: l.product.image,
          images: l.product.images,
        },
        { syncPhotos: opts.syncPhotos !== false }
      )
    );
  }

  return {
    checked: linked.length,
    totalLinked: listings.filter((l) => !!l.product.cjProductId).length,
    changed: results.filter((r) => r.stockChanged || r.costChanged || r.photosChanged),
    errors: results.filter((r) => r.error),
  };
}
