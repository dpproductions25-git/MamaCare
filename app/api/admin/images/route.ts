import { NextResponse } from 'next/server';
import { getMergedProducts } from '@/lib/product-overrides';
import { getAltMap, saveAltBatch, deleteAlt } from '@/lib/db-images';
import { generateAltText, checkImageHealth, AI_ENABLED } from '@/lib/ai-alt-text';
import { logAudit } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type ImageRow = {
  imageUrl: string;
  productId: string;
  productName: string;
  category: string;
  isMain: boolean;
  currentAlt: string | null;
};

/** Every image in the catalogue, with whatever alt text already exists. */
async function collectImages(): Promise<ImageRow[]> {
  const [products, altMap] = await Promise.all([getMergedProducts(), getAltMap()]);
  const rows: ImageRow[] = [];
  const seen = new Set<string>();

  for (const p of products) {
    if (p.id === 'mc-test') continue;
    const urls = [p.image, ...(p.images || [])].filter(Boolean) as string[];

    for (const url of urls) {
      if (seen.has(url)) continue; // the same photo can appear on several products
      seen.add(url);
      rows.push({
        imageUrl: url,
        productId: p.id,
        productName: p.name,
        category: p.category,
        isMain: url === p.image,
        currentAlt: altMap[url] ?? null,
      });
    }
  }

  return rows;
}

// GET: the full image list plus coverage stats
export async function GET() {
  try {
    const images = await collectImages();
    const described = images.filter((i) => i.currentAlt).length;

    return NextResponse.json({
      aiEnabled: AI_ENABLED,
      total: images.length,
      described,
      missing: images.length - described,
      coveragePct: images.length ? Math.round((described / images.length) * 100) : 0,
      images,
    });
  } catch (e: any) {
    console.error('[admin/images GET]', e?.message);
    return NextResponse.json({ error: e?.message || 'Could not load images' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const actor = req.headers.get('x-admin-name') || 'admin';

  try {
    const body = await req.json();
    const action = String(body.action || '');

    switch (action) {
      /**
       * Generate suggestions. Deliberately does NOT save — vision models
       * occasionally misread a product, and wrong alt text is worse for
       * accessibility than none at all. Results go back for review.
       */
      case 'generate': {
        if (!AI_ENABLED) {
          return NextResponse.json(
            { error: 'OPENAI_API_KEY is not set in Vercel — add it, then redeploy.' },
            { status: 400 }
          );
        }

        const urls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls : [];
        if (!urls.length) {
          return NextResponse.json({ error: 'No images selected.' }, { status: 400 });
        }
        // Capped so one click can't run for minutes or rack up unexpected cost
        const batch = urls.slice(0, 25);

        const all = await collectImages();
        const byUrl = new Map(all.map((i) => [i.imageUrl, i]));

        const results = [];
        for (const url of batch) {
          const meta = byUrl.get(url);
          results.push(
            await generateAltText(url, {
              productName: meta?.productName,
              category: meta?.category,
            })
          );
        }

        return NextResponse.json({
          ok: true,
          generated: results.filter((r) => r.altText).length,
          failed: results.filter((r) => r.error).length,
          results,
        });
      }

      // Save approved alt text
      case 'save': {
        const entries = Array.isArray(body.entries) ? body.entries : [];
        if (!entries.length) {
          return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
        }
        const saved = await saveAltBatch(entries);
        try { await logAudit(actor, 'saved alt text', `${saved} image(s)`); } catch {}
        return NextResponse.json({ ok: true, saved });
      }

      case 'delete': {
        await deleteAlt(String(body.imageUrl || ''));
        return NextResponse.json({ ok: true });
      }

      // Find broken or very low-resolution images
      case 'health': {
        const images = await collectImages();
        const checked = [];
        for (const img of images.slice(0, 120)) {
          checked.push(await checkImageHealth(img.imageUrl));
        }
        const problems = checked.filter((c) => !c.ok || c.issue);
        return NextResponse.json({
          ok: true,
          checked: checked.length,
          problemCount: problems.length,
          problems,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('[admin/images POST]', e?.message);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
