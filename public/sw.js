// Service Worker PRESENSISTIMI v1.0.0
const CACHE_NAME = 'presensistimi-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/logo.png',
  '/logo-dark.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Jangan sentuh atau cegat request saat di localhost atau IP lokal development
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname === '::1' ||
    url.hostname.startsWith('192.168.')
  ) {
    return;
  }

  // Jangan cache request API, Server Actions, NextAuth, atau metode POST/PUT/DELETE
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    event.request.headers.get('x-nextjs-data') ||
    event.request.headers.get('next-action')
  ) {
    return;
  }

  // Stale-while-revalidate untuk aset statis gambar dan file publik
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2|woff|css|js)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Network-first untuk halaman HTML
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return caches.match('/login');
      });
    })
  );
});
