/* public/sw.js */

/* --- キャッシュ名 --- */
const STATIC_CACHE = 'static-v1';
const IMAGE_CACHE  = 'images-v1';
const API_CACHE    = 'api-v1';

/* --- install：ビルド成果物をプリキャッシュ --- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll([
        '/',                // index.html
        '/favicon.ico',
        '/manifest.json',
        '/logo192.png',
        '/logo512.png',
        // ← ここに build 後も URL が変わらないファイルを列挙
      ])
    )
  );
  self.skipWaiting();          // 即時 activate
});

/* --- activate：旧キャッシュを削除 --- */
self.addEventListener('activate', event => {
  const whitelist = [STATIC_CACHE, IMAGE_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (!whitelist.includes(key)) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

/* --- fetch：リクエスト毎に戦略を切替 --- */
self.addEventListener('fetch', event => {
  const { request } = event;

  /* 1) API（/api/ で始まるもの）は Network First */
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  /* 2) 画像は Stale-While-Revalidate */
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  /* 3) それ以外の GET は Cache First → ネット */
  if (request.method === 'GET') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

/* ----  キャッシュ戦略ヘルパ ---- */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then(res => {
    cache.put(request, res.clone());
    return res;
  });
  return cached || networkFetch;
}