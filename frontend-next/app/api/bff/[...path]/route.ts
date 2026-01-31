import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { AUTH_COOKIE, cookieOptions } from '@/lib/authCookies';

type RouteContext = { params: Promise<{ path?: string[] }> };

function buildBackendUrl(req: NextRequest, pathParts: string[]) {
  const joined = pathParts.join('/');
  const qs = req.nextUrl.searchParams.toString();
  const base = `${API_CONFIG.BASE_URL}/api/${joined}`;
  return qs ? `${base}?${qs}` : base;
}

async function refreshTokens(refreshToken: string) {
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
  return { ok: res.ok, status: res.status, data };
}

async function proxy(req: NextRequest, ctx: RouteContext) {
  const { path = [] } = await ctx.params;
  if (!path.length) {
    return NextResponse.json({ success: false, error: 'BAD_PATH' }, { status: 400 });
  }

  const accessToken = req.cookies.get(AUTH_COOKIE.access)?.value || '';
  const refreshToken = req.cookies.get(AUTH_COOKIE.refresh)?.value || '';

  const url = buildBackendUrl(req, path);
  const method = req.method.toUpperCase();

  const shouldHaveBody = !['GET', 'HEAD'].includes(method);
  const body = shouldHaveBody ? await req.text() : undefined;

  const forwardOnce = async (token: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    const contentType = req.headers.get('content-type');
    if (contentType) headers['Content-Type'] = contentType;
    const accept = req.headers.get('accept');
    if (accept) headers['Accept'] = accept;

    return await fetch(url, {
      method,
      headers,
      body,
      cache: 'no-store',
    });
  };

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // If no access token but have refresh — refresh first
  let tokenToUse = accessToken;
  let rotatedTokens: { accessToken?: string; refreshToken?: string } | null = null;

  if (!tokenToUse && refreshToken) {
    const refreshed = await refreshTokens(refreshToken);
    if (!refreshed.ok || !refreshed.data?.accessToken) {
      const res = NextResponse.json(refreshed.data ?? { success: false, error: 'UNAUTHORIZED' }, { status: 401 });
      const base = cookieOptions();
      res.cookies.set(AUTH_COOKIE.access, '', { ...base, maxAge: 0 });
      res.cookies.set(AUTH_COOKIE.refresh, '', { ...base, maxAge: 0 });
      return res;
    }
    tokenToUse = refreshed.data.accessToken;
    rotatedTokens = { accessToken: refreshed.data.accessToken, refreshToken: refreshed.data.refreshToken };
  }

  let backendRes = await forwardOnce(tokenToUse);

  // Retry once on 401 via refresh (if available)
  if (backendRes.status === 401 && refreshToken) {
    const refreshed = await refreshTokens(refreshToken);
    if (refreshed.ok && refreshed.data?.accessToken) {
      tokenToUse = refreshed.data.accessToken;
      rotatedTokens = { accessToken: refreshed.data.accessToken, refreshToken: refreshed.data.refreshToken };
      backendRes = await forwardOnce(tokenToUse);
    }
  }

  const raw = await backendRes.text();
  const out = new NextResponse(raw, { status: backendRes.status });
  const ct = backendRes.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);

  if (rotatedTokens?.accessToken) {
    const base = cookieOptions();
    out.cookies.set(AUTH_COOKIE.access, rotatedTokens.accessToken, base);
    if (rotatedTokens.refreshToken) out.cookies.set(AUTH_COOKIE.refresh, rotatedTokens.refreshToken, base);
  }

  return out;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: RouteContext) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxy(req, ctx);
}

