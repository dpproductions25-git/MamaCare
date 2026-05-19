import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protects /admin/* with HTTP Basic Auth.
 * Set ADMIN_USER + ADMIN_PASSWORD in Vercel env vars.
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  if (!url.pathname.startsWith('/admin')) return NextResponse.next();

  const user = process.env.ADMIN_USER || '';
  const pass = process.env.ADMIN_PASSWORD || '';
  if (!user || !pass) {
    return new NextResponse('Admin disabled: set ADMIN_USER and ADMIN_PASSWORD env vars.', { status: 503 });
  }

  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Basic ')) {
    const [u, p] = atob(auth.slice(6)).split(':');
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="MamaCare Admin"' }
  });
}

export const config = {
  matcher: ['/admin/:path*']
};
