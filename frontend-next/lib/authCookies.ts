export const AUTH_COOKIE = {
  access: 'cd_at',
  refresh: 'cd_rt',
} as const;

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
  };
}

