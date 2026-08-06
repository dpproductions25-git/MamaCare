import { sql } from '@vercel/postgres';

/**
 * Alt-text store.
 *
 * Keyed by image URL rather than by product, so the same description follows an
 * image wherever it appears — product gallery, cart, registry, search results —
 * and blog or hero images can use the same table without a second system.
 *
 * Alt text is currently absent site-wide: product images fall back to the
 * product name and gallery thumbnails use alt="", which makes them invisible to
 * screen readers and to Google Images.
 */

export type ImageAlt = {
  image_url: string;
  alt_text: string;
  source: 'ai' | 'manual';
  product_id: string | null;
  updated_at: string;
};

export async function ensureImageSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS image_alt_text (
      image_url TEXT PRIMARY KEY,
      alt_text TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'ai',
      product_id TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_alt_product ON image_alt_text(product_id);`;
}

/** url → alt text, for rendering. Never throws — missing alt is not fatal. */
export async function getAltMap(): Promise<Record<string, string>> {
  try {
    await ensureImageSchema();
    const r = await sql<{ image_url: string; alt_text: string }>`
      SELECT image_url, alt_text FROM image_alt_text;
    `;
    return Object.fromEntries(r.rows.map((x) => [x.image_url, x.alt_text]));
  } catch (e: any) {
    console.error('[alt-text] could not load map:', e?.message);
    return {};
  }
}

export async function listAlt(): Promise<ImageAlt[]> {
  await ensureImageSchema();
  const r = await sql<ImageAlt>`
    SELECT * FROM image_alt_text ORDER BY updated_at DESC LIMIT 1000;
  `;
  return r.rows;
}

/** Save many at once — used by the review-and-approve flow. */
export async function saveAltBatch(
  entries: { imageUrl: string; altText: string; productId?: string | null; source?: 'ai' | 'manual' }[]
): Promise<number> {
  await ensureImageSchema();
  let saved = 0;

  for (const e of entries) {
    const text = (e.altText || '').trim();
    if (!e.imageUrl || !text) continue;

    // Alt text longer than ~125 characters gets truncated by most screen
    // readers, so there is no benefit to storing more.
    const clipped = text.slice(0, 125);

    const r = await sql`
      INSERT INTO image_alt_text (image_url, alt_text, source, product_id, updated_at)
      VALUES (${e.imageUrl}, ${clipped}, ${e.source || 'ai'}, ${e.productId ?? null}, NOW())
      ON CONFLICT (image_url) DO UPDATE
        SET alt_text = EXCLUDED.alt_text,
            source = EXCLUDED.source,
            product_id = COALESCE(EXCLUDED.product_id, image_alt_text.product_id),
            updated_at = NOW()
      RETURNING image_url;
    `;
    saved += r.rows.length;
  }

  return saved;
}

export async function deleteAlt(imageUrl: string) {
  await ensureImageSchema();
  await sql`DELETE FROM image_alt_text WHERE image_url = ${imageUrl};`;
}
