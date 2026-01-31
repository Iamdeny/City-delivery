import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { AUTH_COOKIE, cookieOptions } from '@/lib/authCookies';

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get(AUTH_COOKIE.refresh)?.value || '';
  let accessToken = request.cookies.get(AUTH_COOKIE.access)?.value || '';

  const refresh = async () => {
    if (!refreshToken) return null;
    const res = await fetch(`${API_CONFIG.BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { error: raw || `Backend error: ${res.status}` };
    }
    if (!res.ok || !data?.accessToken) return null;
    return data as { accessToken: string; refreshToken?: string };
  };

  if (!accessToken && refreshToken) {
    const tokens = await refresh();
    if (tokens?.accessToken) accessToken = tokens.accessToken;
  }

  if (!accessToken) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const res = await fetch(`${API_CONFIG.BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { error: raw || `Backend error: ${res.status}` };
  }

  // retry once on 401
  if (res.status === 401 && refreshToken) {
    const tokens = await refresh();
    if (tokens?.accessToken) {
      accessToken = tokens.accessToken;
      const res2 = await fetch(`${API_CONFIG.BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      const raw2 = await res2.text();
      let data2: any = null;
      try {
        data2 = raw2 ? JSON.parse(raw2) : null;
      } catch {
        data2 = { error: raw2 || `Backend error: ${res2.status}` };
      }
      const out2 = NextResponse.json(data2 ?? { success: false }, { status: res2.status });
      const base = cookieOptions();
      out2.cookies.set(AUTH_COOKIE.access, accessToken, base);
      if (tokens.refreshToken) out2.cookies.set(AUTH_COOKIE.refresh, tokens.refreshToken, base);
      return out2;
    }
  }

  const out = NextResponse.json(data ?? { success: false }, { status: res.status });
  // If we refreshed before /me call, persist new access token
  if (accessToken && request.cookies.get(AUTH_COOKIE.access)?.value !== accessToken) {
    out.cookies.set(AUTH_COOKIE.access, accessToken, cookieOptions());
  }
  return out;
}

