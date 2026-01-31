import { NextResponse } from 'next/server';
import { AUTH_COOKIE, cookieOptions } from '@/lib/authCookies';

export async function POST() {
  const res = NextResponse.json({ success: true }, { status: 200 });
  const base = cookieOptions();
  res.cookies.set(AUTH_COOKIE.access, '', { ...base, maxAge: 0 });
  res.cookies.set(AUTH_COOKIE.refresh, '', { ...base, maxAge: 0 });
  return res;
}

