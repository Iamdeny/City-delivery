import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/authCookies';

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Guard checkout for ops accounts (admin/manager).
  // Ops users should operate inside /ops (Wolt Merchant style), not consumer checkout.
  if (pathname === '/order' || pathname === '/cart') {
    const access = request.cookies.get(AUTH_COOKIE.access)?.value;
    if (access) {
      const payload = decodeJwtPayload(access);
      const role = String(payload?.role || '');
      if (role === 'admin' || role === 'manager') {
        const url = request.nextUrl.clone();
        url.pathname = '/ops/orders';
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith('/ops')) return NextResponse.next();

  const hasAccess = Boolean(request.cookies.get(AUTH_COOKIE.access)?.value);
  const hasRefresh = Boolean(request.cookies.get(AUTH_COOKIE.refresh)?.value);

  if (!hasAccess && !hasRefresh) {
    const next = request.nextUrl.pathname + request.nextUrl.search;
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ops/:path*', '/order', '/cart'],
};

