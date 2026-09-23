``` 
[WS] 建立新 WebSocket 連線: ws://100.121.238.94:8000/api/hioki/ws/telemetry
index-BvwjWvrw.js:7 WebSocket connection to 'ws://100.121.238.94:8000/api/hioki/ws/telemetry' failed: Error during WebSocket handshake: Unexpected response code: 403
connectTelemetryWs @ index-BvwjWvrw.js:7
T @ index-BvwjWvrw.js:9
(匿名) @ index-BvwjWvrw.js:9
index-BvwjWvrw.js:7 [WS] Telemetry 連線錯誤: Event {isTrusted: true, type: 'error', target: WebSocket, currentTarget: WebSocket, eventPhase: 2, …}
s.onerror @ index-BvwjWvrw.js:7
index-BvwjWvrw.js:9 [100.121.238.94] WebSocket Telemetry 發生錯誤: Event {isTrusted: true, type: 'error', target: WebSocket, currentTarget: WebSocket, eventPhase: 2, …}
(匿名) @ index-BvwjWvrw.js:9
s.onerror @ index-BvwjWvrw.js:7
index-BvwjWvrw.js:7 [WS] Telemetry 連線已關閉: 100.121.238.94
index-BvwjWvrw.js:2  GET http://100.92.179.91:8000/api/system/status net::ERR_NETWORK_CHANGED
Ru @ index-BvwjWvrw.js:2
getSystemStatus @ index-BvwjWvrw.js:2
(匿名) @ index-BvwjWvrw.js:2
index-BvwjWvrw.js:2  GET http://100.92.179.91:8000/api/itech/protection/get 400 (Bad Request)
Ru @ index-BvwjWvrw.js:2
getProtection @ index-BvwjWvrw.js:2
t @ index-BvwjWvrw.js:2
a.onopen @ index-BvwjWvrw.js:2
index-BvwjWvrw.js:2 [CH 001] 讀取保護點失敗: Error: ITECH 設備未連線
    at Ru (index-BvwjWvrw.js:2:36078)
    at async t (index-BvwjWvrw.js:2:44645)
```
