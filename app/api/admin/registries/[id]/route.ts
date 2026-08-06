import { NextResponse } from 'next/server';
import {
  deleteRegistry, adminResetRegistryPin, adminGetRegistryDetail, listAllRegistries,
} from '@/lib/db-registry';
import { logAudit } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Protected by middleware Basic Auth (matcher covers /api/admin/:path*)

// GET: full detail for one registry
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const detail = await adminGetRegistryDetail(params.id);
    if (!detail) return NextResponse.json({ error: 'Registry not found.' }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: permanently remove a registry and all its items
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = req.headers.get('x-admin-name') || 'admin';
  try {
    const removed = await deleteRegistry(params.id);

    // Zero rows means the id didn't match anything — report it instead of
    // returning a success the UI can't distinguish from a real deletion.
    if (removed === 0) {
      // Report exactly what was attempted against what's actually stored.
      // "No rows matched" has two very different causes — the row genuinely
      // isn't there, or the id we sent doesn't match the id in the column
      // (encoding, whitespace, wrong field) — and they need opposite fixes.
      const existing = await listAllRegistries(20);
      console.error(
        `[admin/registries DELETE] no match for "${params.id}". ` +
        `Stored ids: ${existing.map((r) => r.id).join(', ') || '(none)'}`
      );
      return NextResponse.json(
        {
          error: 'Nothing was deleted — no registry matched that id.',
          attemptedId: params.id,
          attemptedIdLength: params.id.length,
          storedIds: existing.map((r) => ({ id: r.id, length: r.id.length, email: r.email })),
          diagnosis:
            existing.length === 0
              ? 'The registries table is empty, yet the admin list showed rows — the list is reading from somewhere else.'
              : existing.some((r) => r.id.trim() === params.id.trim())
                ? 'An id matches once trimmed — there is stray whitespace in the stored value.'
                : 'The id sent is not among the stored ids.',
        },
        { status: 404 }
      );
    }

    try {
      await logAudit(admin, 'deleted registry', params.id);
    } catch {/* audit table may not exist yet */}

    return NextResponse.json({ ok: true, removed });
  } catch (e: any) {
    console.error('[admin/registries DELETE]', e?.message);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: reset the PIN for a registry (support flow — mom forgot her PIN)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = req.headers.get('x-admin-name') || 'admin';
  try {
    const { pin } = await req.json();
    if (!/^\d{4}$/.test(String(pin || ''))) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits.' }, { status: 400 });
    }
    await adminResetRegistryPin(params.id, String(pin));
    try {
      await logAudit(admin, 'reset registry PIN', params.id);
    } catch {/* audit table may not exist yet */}
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
