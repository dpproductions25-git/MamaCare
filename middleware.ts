import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protects /admin/* with HTTP Basic Auth.
 *
 * Two ways to configure admins:
 *
 *   Single admin (legacy):
 *     ADMIN_USER, ADMIN_PASSWORD
 *
 *   Two named admins (preferred):
 *     ADMIN_USER_1, ADMIN_PASSWORD_1, ADMIN_NAME_1   (e.g. "David")
 *     ADMIN_USER_2, ADMIN_PASSWORD_2, ADMIN_NAME_2   (e.g. "Co-admin name")
 *
 * The matched admin's NAME is set on the `x-admin-name` request header so
 * server pages and API routes can log who did what.
 */

type AdminAccount = { user: string; password: string; name: string };

/**
 * Constant-time byte comparison — prevents timing attacks on password checks.
 * Both buffers are padded to the longer length before XOR-ing so the loop
 * always runs the same number of iterations regardless of content.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1; // length mismatch = fail
  for (let i = 0; i < len; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function loadAdmins(): AdminAccount[] {
  const list: AdminAccount[] = [];

  if (process.env.ADMIN_USER_1 && process.env.ADMIN_PASSWORD_1) {
    list.push({
      user: process.env.ADMIN_USER_1,
      password: process.env.ADMIN_PASSWORD_1,
      name: process.env.ADMIN_NAME_1 || process.env.ADMIN_USER_1
    });
  }
  if (process.env.ADMIN_USER_2 && process.env.ADMIN_PASSWORD_2) {
    list.push({
      user: process.env.ADMIN_USER_2,
      password: process.env.ADMIN_PASSWORD_2,
      name: process.env.ADMIN_NAME_2 || process.env.ADMIN_USER_2
    });
  }

  // Backwards compatibility: single ADMIN_USER / ADMIN_PASSWORD still works.
  if (list.length === 0 && process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) {
    list.push({
      user: process.env.ADMIN_USER,
      password: process.env.ADMIN_PASSWORD,
      name: process.env.ADMIN_USER
    });
  }

  return list;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  const admins = loadAdmins();
  if (admins.length === 0) {
    return new NextResponse(
      'Admin disabled: set ADMIN_USER_1 + ADMIN_PASSWORD_1 (and optionally ADMIN_USER_2 + ADMIN_PASSWORD_2) env vars.',
      { status: 503 }
    );
  }

  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Basic ')) {
    let decoded = '';
    try { decoded = atob(auth.slice(6)); } catch { /* malformed base64 */ }

    const colonIdx = decoded.indexOf(':');
    if (colonIdx > 0) {
      const u = decoded.slice(0, colonIdx);
      const p = decoded.slice(colonIdx + 1);
      const enc = new TextEncoder();

      // Timing-safe comparison: prevents attackers measuring response time
      // to guess valid usernames/passwords character by character.
      const matchedAdmin = admins.find((a) => {
        const userMatch = timingSafeEqual(enc.encode(a.user), enc.encode(u));
        const passMatch = timingSafeEqual(enc.encode(a.password), enc.encode(p));
        return userMatch && passMatch;
      });

      if (matchedAdmin) {
        const reqHeaders = new Headers(req.headers);
        reqHeaders.set('x-admin-name', matchedAdmin.name);
        return NextResponse.next({ request: { headers: reqHeaders } });
      }
    }
  }

  // Generic message — don't reveal whether user or password was wrong
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="MamaCare Admin"' }
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
