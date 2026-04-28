const CACHE_NAME = 'quartz-pwa-v2';

// 1. 安裝階段：強制接管
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 2. 激活階段：清理舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  self.clients.claim();
});

// 3. 核心攔截：Stale-While-Revalidate 策略
self.addEventListener('fetch', event => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 策略：有快取就先回傳快取，同時去網路抓新的
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // 只有成功的請求才存入快取
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 這裡可以放一個自定義的離線頁面，或者乾脆不處理
        console.log('完全沒網，且快取也沒這檔案');
      });

      return cachedResponse || fetchPromise;
    })
  );
});