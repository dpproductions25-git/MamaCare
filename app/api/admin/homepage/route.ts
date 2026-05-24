import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { setConfig, logAudit } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = [
  'hero_image',
  'hero_eyebrow',
  'hero_headline',
  'hero_subhead',
  'hero_cta_text',
  'hero_cta_link'
];

export async function POST(req: Request) {
  const actor = headers().get('x-admin-name') || 'unknown';
  const body = await req.json();

  try {
    const updated: string[] = [];
    for (const key of ALLOWED_KEYS) {
      if (typeof body[key] === 'string' && body[key].trim()) {
        await setConfig(key, body[key].trim(), actor);
        updated.push(key);
      }
    }
    await logAudit(actor, 'homepage.update', 'hero', { keys: updated });
    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    console.error('homepage save failed', e);
    return NextResponse.json({ error: e.message || 'Save failed' }, { status: 500 });
  }
}
