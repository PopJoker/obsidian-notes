// 監聽 fetch 事件（這是 PWA 判定必備）
self.addEventListener('fetch', function(event) {
  // 這裡不寫邏輯，直接讓請求通過
});

// 監聽安裝事件
self.addEventListener('install', function(event) {
  console.log('SW installed');
  self.skipWaiting();
});