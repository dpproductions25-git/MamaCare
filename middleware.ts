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
    const [u, p] = atob(auth.slice(6)).split(':');
    const match = admins.find((a) => a.user === u && a.password === p);
    if (match) {
      const res = NextResponse.next();
      // Pass admin identity downstream so pages/APIs can audit it.
      res.headers.set('x-admin-name', match.name);
      // Also forward into the request headers for server components.
      const reqHeaders = new Headers(req.headers);
      reqHeaders.set('x-admin-name', match.name);
      return NextResponse.next({ request: { headers: reqHeaders } });
    }
  }

  return new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="MamaCare Admin"' }
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
