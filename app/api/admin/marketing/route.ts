import { NextResponse } from 'next/server';
import {
  saveShippingSettings, upsertCoupon, deleteCoupon, setCouponActive,
  generateCodeBatch, listCoupons,
} from '@/lib/db-commerce';
import { logAudit } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Protected by middleware Basic Auth (matcher covers /api/admin/:path*)

function admin(req: Request) {
  return req.headers.get('x-admin-name') || 'admin';
}

async function audit(actor: string, action: string, target: string) {
  try { await logAudit(actor, action, target); } catch {/* audit table optional */}
}

// GET: current coupon list (used to refresh the admin table)
export async function GET() {
  try {
    return NextResponse.json({ coupons: await listCoupons() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const actor = admin(req);
  try {
    const body = await req.json();
    const action = String(body.action || '');

    switch (action) {
      // ── Shipping ──────────────────────────────────────────────────────────
      case 'save-shipping': {
        const freeThreshold = Number(body.freeThreshold);
        const flatRate = Number(body.flatRate);
        if (!Number.isFinite(freeThreshold) || freeThreshold < 0) {
          return NextResponse.json({ error: 'Free-shipping threshold must be 0 or more.' }, { status: 400 });
        }
        if (!Number.isFinite(flatRate) || flatRate < 0) {
          return NextResponse.json({ error: 'Flat rate must be 0 or more.' }, { status: 400 });
        }
        await saveShippingSettings(
          { freeThreshold: +freeThreshold.toFixed(2), flatRate: +flatRate.toFixed(2) },
          actor
        );
        await audit(actor, 'updated shipping settings', `free≥$${freeThreshold}, flat $${flatRate}`);
        return NextResponse.json({ ok: true });
      }

      // ── Create / edit a public code ────────────────────────────────────────
      case 'save-coupon': {
        const code = String(body.code || '').trim().toUpperCase();
        if (!/^[A-Z0-9._-]{3,32}$/.test(code)) {
          return NextResponse.json(
            { error: 'Code must be 3–32 characters: letters, numbers, . _ - only.' },
            { status: 400 }
          );
        }
        const type = String(body.type || '');
        if (!['percent', 'fixed', 'free-shipping'].includes(type)) {
          return NextResponse.json({ error: 'Invalid discount type.' }, { status: 400 });
        }

        let value: number | null = null;
        if (type !== 'free-shipping') {
          value = Number(body.value);
          if (!Number.isFinite(value) || value <= 0) {
            return NextResponse.json({ error: 'Enter a discount value greater than 0.' }, { status: 400 });
          }
          if (type === 'percent' && value > 100) {
            return NextResponse.json({ error: 'Percentage cannot exceed 100.' }, { status: 400 });
          }
        }

        const coupon = await upsertCoupon({
          code,
          type: type as any,
          value,
          description: String(body.description || '').slice(0, 200),
          active: body.active !== false,
          expiresAt: body.expiresAt || null,
          minSubtotal: body.minSubtotal != null && body.minSubtotal !== '' ? Number(body.minSubtotal) : null,
          maxRedemptions: body.maxRedemptions != null && body.maxRedemptions !== '' ? Number(body.maxRedemptions) : null,
        });
        await audit(actor, 'saved discount code', code);
        return NextResponse.json({ ok: true, coupon });
      }

      // ── Toggle / delete ───────────────────────────────────────────────────
      case 'toggle-coupon': {
        const code = String(body.code || '');
        await setCouponActive(code, !!body.active);
        await audit(actor, body.active ? 'activated code' : 'deactivated code', code);
        return NextResponse.json({ ok: true });
      }

      case 'delete-coupon': {
        const code = String(body.code || '');
        await deleteCoupon(code);
        await audit(actor, 'deleted discount code', code);
        return NextResponse.json({ ok: true });
      }

      // ── Batch generate single-use codes ───────────────────────────────────
      case 'generate-batch': {
        const count = Number(body.count);
        if (!Number.isFinite(count) || count < 1 || count > 200) {
          return NextResponse.json({ error: 'Generate between 1 and 200 codes.' }, { status: 400 });
        }
        const type = String(body.type || 'percent');
        if (!['percent', 'fixed', 'free-shipping'].includes(type)) {
          return NextResponse.json({ error: 'Invalid discount type.' }, { status: 400 });
        }
        let value: number | null = null;
        if (type !== 'free-shipping') {
          value = Number(body.value);
          if (!Number.isFinite(value) || value <= 0) {
            return NextResponse.json({ error: 'Enter a discount value greater than 0.' }, { status: 400 });
          }
        }

        const codes = await generateCodeBatch(count, {
          prefix: String(body.prefix || 'MAMA'),
          type: type as any,
          value,
          description: String(body.description || 'Single-use code').slice(0, 200),
          expiresAt: body.expiresAt || null,
          minSubtotal: body.minSubtotal != null && body.minSubtotal !== '' ? Number(body.minSubtotal) : null,
        });
        await audit(actor, `generated ${codes.length} single-use codes`, String(body.prefix || 'MAMA'));
        return NextResponse.json({ ok: true, codes: codes.map((c) => c.code) });
      }

      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('[admin/marketing]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
