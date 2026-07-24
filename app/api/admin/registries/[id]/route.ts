import { NextResponse } from 'next/server';
import { deleteRegistry, adminResetRegistryPin, adminGetRegistryDetail } from '@/lib/db-registry';
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
    await deleteRegistry(params.id);
    try {
      await logAudit(admin, 'deleted registry', params.id);
    } catch {/* audit table may not exist yet */}
    return NextResponse.json({ ok: true });
  } catch (e: any) {
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
