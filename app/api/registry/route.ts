import { NextResponse } from 'next/server';
import { createRegistry, verifyRegistryByEmail, findRegistryByEmail } from '@/lib/db-registry';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: create a new registry
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`registry:create:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  try {
    const { email, pin, ownerName, title } = await req.json();
    if (!email || !pin || !/^\d{4}$/.test(String(pin))) {
      return NextResponse.json({ error: 'email and a 4-digit PIN are required.' }, { status: 400 });
    }
    // Prevent duplicate registries for same email
    const existing = await findRegistryByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'A registry already exists for this email. Please sign in instead.' },
        { status: 409 }
      );
    }
    const registry = await createRegistry({ email, pin: String(pin), ownerName: ownerName || 'Mom', title });
    return NextResponse.json({ registry });
  } catch (e: any) {
    console.error('registry create error', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

// GET: look up registry by email + PIN
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`registry:find:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || '';
  const pin = searchParams.get('pin') || '';
  if (!email || !pin) {
    return NextResponse.json({ error: 'email and pin are required.' }, { status: 400 });
  }
  try {
    const registry = await verifyRegistryByEmail(email, pin);
    if (!registry) {
      return NextResponse.json({ error: 'Invalid email or PIN.' }, { status: 401 });
    }
    return NextResponse.json({ registry });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
