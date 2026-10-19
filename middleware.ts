import { NextResponse, type NextRequest } from 'next/server';

/**
 * Coarse route protection for the three portals. The session cookie is set by lib/auth.ts after the
 * demo sign-in. This is intentionally simple: in production, replace it with a signed session issued
 * by your auth backend and validated here.
 */
const HOME: Record<string, string> = { admin: '/admin', technician: '/employee', customer: '/customer' };

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const need = pathname.startsWith('/admin') ? 'admin' : pathname.startsWith('/employee') ? 'technician' : pathname.startsWith('/customer') ? 'customer' : null;
  if (!need) return NextResponse.next();
  const role = req.cookies.get('ah_role')?.value;
  if (!role || !HOME[role]) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (role !== need) {
    const url = req.nextUrl.clone();
    url.pathname = HOME[role];
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/employee/:path*', '/customer/:path*'] };
