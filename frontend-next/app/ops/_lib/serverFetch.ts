import { headers } from 'next/headers';

export async function getRequestOrigin() {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('x-forwarded-host') || h.get('host');
  if (!host) return '';
  return `${proto}://${host}`;
}

export async function getCookieHeader() {
  const h = await headers();
  return h.get('cookie') || '';
}

export async function fetchBffJson<T>(pathAndQuery: string): Promise<T> {
  const origin = await getRequestOrigin();
  const cookie = await getCookieHeader();
  const res = await fetch(`${origin}${pathAndQuery}`, {
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });
  if (!res.ok) {
    throw new Error(`Failed to load: ${res.status}`);
  }
  return (await res.json()) as T;
}

