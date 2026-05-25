import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { EDITABLE_PAGES, savePageContent, resetPageContent, PageId } from '@/lib/page-content';
import { logAudit } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validSlug(slug: string): slug is PageId {
  return EDITABLE_PAGES.some((p) => p.id === slug);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const actor = headers().get('x-admin-name') || 'unknown';
  if (!validSlug(params.slug)) {
    return NextResponse.json({ error: 'Unknown page' }, { status: 404 });
  }
  const body = await req.json();
  try {
    await savePageContent(params.slug, {
      title:   typeof body.title === 'string'   ? body.title   : undefined,
      meta:    typeof body.meta === 'string'    ? body.meta    : undefined,
      heading: typeof body.heading === 'string' ? body.heading : undefined,
      body:    typeof body.body === 'string'    ? body.body    : undefined
    }, actor);
    await logAudit(actor, 'page.update', params.slug, { fields: Object.keys(body) });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('page save failed', e);
    return NextResponse.json({ error: e.message || 'Save failed' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { slug: string } }) {
  const actor = headers().get('x-admin-name') || 'unknown';
  if (!validSlug(params.slug)) {
    return NextResponse.json({ error: 'Unknown page' }, { status: 404 });
  }
  try {
    await resetPageContent(params.slug);
    await logAudit(actor, 'page.reset', params.slug);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
