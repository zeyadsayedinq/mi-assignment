/**
 * Mi-Assignment Service Worker v2
 * Fixed: "Failed to convert value to 'Response'" crash
 * Fixed: undefined returned from caches.match when no hit
 * Fixed: Gemini 503 / network errors no longer crash SW
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `mi-static-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET — POST/PUT/DELETE go straight to network (payments, API, etc.)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Hard bypass: never intercept these — let browser handle directly
  const bypassHosts = [
    'supabase.co', 'googleapis.com', 'generativelanguage.googleapis.com',
    'pollinations.ai', 'tap.company', 'resend.com', 'sentry.io', 'posthog.com',
  ];
  if (bypassHosts.some((h) => url.hostname.includes(h))) return;

  const bypassPaths = ['/api/', '/.netlify/', '/auth/', '/tap-webhook'];
  if (bypassPaths.some((p) => url.pathname.startsWith(p))) return;
  // Also bypass cross-origin requests entirely
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first, graceful offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/');
        return cached || new Response('Offline — please reconnect', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
    );
    return;
  }

  // Static assets: cache-first, background network update
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ico|json)$/)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const networkPromise = fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        }).catch(() => null);

        if (cached) return cached;
        const net = await networkPromise;
        if (net) return net;
        return new Response('Asset unavailable offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })()
    );
    return;
  }

  // Everything else: pure network, never return undefined
  event.respondWith(
    fetch(request).catch(() =>
      new Response('Network error', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      })
    )
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}
  const options = {
    body: data.body || 'مهمتك جاهزة!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'mi-notification',
    data: { url: data.url || '/app' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Mi-Assignment', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/app';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => 'focus' in c);
      if (existing) { existing.navigate(targetUrl); return existing.focus(); }
      return clients.openWindow(targetUrl);
    })
  );
});
