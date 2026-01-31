/* eslint-disable no-restricted-globals */

/**
 * Minimal Service Worker for "app-like" UX:
 * - Cache static assets (/_next/static, icons)
 * - Network-first for navigations with offline fallback
 * - Never cache API responses
 */

const CACHE_NAME = 'city-delivery-shell-v1';
const SHELL_URLS = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon.svg', '/apple-touch-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(SHELL_URLS);
      } catch {
        // ignore (dev/localhost may block some requests)
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k))));
      self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  try {
    const type = event?.data?.type;
    if (type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  } catch {
    // ignore
  }
});

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname === '/api';
}

function isNextStatic(url) {
  return url.pathname.startsWith('/_next/static/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!req || req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return;

  const accept = req.headers.get('accept') || '';
  const isNav = req.mode === 'navigate' || accept.includes('text/html');

  // HTML navigations: network first, fallback to cached shell.
  if (isNav) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          const shell = await caches.match('/');
          if (shell) return shell;
          return new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
        }
      })()
    );
    return;
  }

  // Next static assets: stale-while-revalidate.
  if (isNextStatic(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => null);
        return cached || (await fetchPromise) || new Response('', { status: 504 });
      })()
    );
    return;
  }

  // Other same-origin assets: cache-first with revalidate (safe defaults).
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) {
        // background update
        fetch(req)
          .then((res) => cache.put(req, res.clone()).catch(() => {}))
          .catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        return new Response('', { status: 504 });
      }
    })()
  );
});

