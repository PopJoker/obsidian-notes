const CACHE_NAME = 'quartz-pwa-v1';
// 你可以列出想要離線訪問的關鍵路徑
const PRE_CACHE = [
  './',
  './index.html',
  './static/icon.png',
  './index.css'
];

// 安裝時預抓取資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRE_CACHE))
      .then(self.skipWaiting())
  );
});

// 激活時清理舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// 核心：策略改為「網路優先，失敗則回傳快取」
// 這樣可以確保在有網時看最新內容，沒網時看舊內容
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 如果請求成功，把內容存入快取
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // 如果網路斷了，從快取撈資料
        return caches.match(event.request);
      })
  );
});