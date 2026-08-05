import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CJ_BASE = process.env.CJ_API_BASE || 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * Admin-only CJ capability probe.
 *
 * The CJ docs site is a JavaScript-rendered SPA, so the endpoint list can't be
 * read programmatically. This asks the live API directly using your real
 * credentials — the definitive answer on what your account can actually do.
 *
 * Open /api/admin/diagnose/cj while logged into admin.
 */
async function getToken(): Promise<{ token?: string; error?: string }> {
  const email = process.env.CJ_API_EMAIL;
  const apiKey = process.env.CJ_API_KEY;
  if (!email || !apiKey) return { error: 'CJ_API_EMAIL and/or CJ_API_KEY not set in Vercel' };

  try {
    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, apiKey }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json?.result) {
      return { error: `auth failed (${res.status}): ${json?.message || 'unknown'}` };
    }
    return { token: json.data.accessToken };
  } catch (e: any) {
    return { error: `auth threw: ${e?.message}` };
  }
}

/** Try one endpoint and summarise the outcome without dumping huge payloads. */
async function probe(token: string, label: string, path: string) {
  try {
    const res = await fetch(`${CJ_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* non-JSON response */ }

    const list = json?.data?.list ?? json?.data?.content ?? null;
    return {
      label,
      path,
      httpStatus: res.status,
      cjResult: json?.result ?? null,
      cjMessage: json?.message ?? null,
      itemCount: Array.isArray(list) ? list.length : null,
      // A single sample row tells us the shape without flooding the response
      sample: Array.isArray(list) && list.length ? list[0] : null,
      rawPreview: json ? undefined : text.slice(0, 200),
    };
  } catch (e: any) {
    return { label, path, error: e?.message };
  }
}

export async function GET() {
  const { token, error } = await getToken();
  if (!token) {
    return NextResponse.json({
      auth: 'FAILED',
      error,
      hint: 'Set CJ_API_EMAIL and CJ_API_KEY in Vercel → Settings → Environment Variables.',
    }, { status: 500 });
  }

  // Endpoints worth testing. Several are educated guesses — the point is to
  // find out which actually exist on this account, not to assume.
  const results = [];
  results.push(await probe(token, 'Catalog search (known good)', '/product/list?pageNum=1&pageSize=3'));
  results.push(await probe(token, 'My product list (guess A)', '/product/myProduct/list?pageNum=1&pageSize=3'));
  results.push(await probe(token, 'My product list (guess B)', '/product/myProductList?pageNum=1&pageSize=3'));
  results.push(await probe(token, 'Connected/listed products (guess C)', '/product/listedProduct?pageNum=1&pageSize=3'));
  results.push(await probe(token, 'Product categories', '/product/getCategory'));
  results.push(await probe(token, 'Account settings', '/setting/get'));

  const works = results.filter((r: any) => r.cjResult === true).map((r: any) => r.label);

  return NextResponse.json({
    auth: 'OK',
    endpointsThatWork: works,
    note:
      'Look for any "My product list" entry with cjResult: true — that would let us sync ' +
      'the products you curate inside CJ. If only the catalog search works, we import by ' +
      'product URL instead and auto-sync price/stock from there.',
    results,
  });
}
