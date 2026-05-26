# Smart Balancing Control System (BMS)

## 1. 系統目標

建立一套自動化電池平衡控制系統，依據電壓差（DeltaV）與運行模式，自動執行 Passive / Active balancing，以達成電池一致性與收斂。

---

## 2. 核心控制參數

|參數|說明|
|---|---|
|DeltaV|max(cell voltage) - min(cell voltage)|
|Threshold|5mV (0.005V)|
|Passive Timeout|180 秒|
|Active Timeout|180 秒|
|Active Switch Interval|30 秒|
|Rest Time|30 秒|

---

## 3. 模式（Modes）

### 3.1 PASSIVE_FIRST

PASSIVE → ACTIVE → REST → LOOP

### 3.2 ACTIVE_FIRST

ACTIVE → PASSIVE → REST → LOOP

### 3.3 CONCURRENT

PASSIVE + ACTIVE → REST → LOOP

---

## 4. 啟動與停止條件

### 啟動條件

- DeltaV > 5mV → 啟動智能監控

### 停止條件

- DeltaV < 5mV → 結束（IDLE）

---

## 5. 狀態機（State Machine）

系統以狀態機控制流程：

- IDLE
- PASSIVE
- ACTIVE
- CONCURRENT
- REST

所有控制行為必須由 phase 驅動，不允許分散 if-else 控制。

---

## 6. PASSIVE BALANCE

### 行為

- 開啟所有 pack 的 passive balancing

### 停止條件（任一成立）

- DeltaV ≤ 5mV
- 執行時間 ≥ 180 秒

### 結束後

- 依模式切換至 ACTIVE 或 REST

---

## 7. ACTIVE BALANCE

### 7.1 目標

將低電壓 pack 拉升至平均電壓（avg voltage）

---

### 7.2 計算方式

- avg_v = 所有 pack 電壓平均值
- target_pack = 各區（A / B）最低電壓 pack

---

### 7.3 分區定義

- A 區：pack 1 ~ 5
- B 區：pack 6 ~ 10

---

### 7.4 執行策略

每 30 秒執行一次 target 切換：

- 找出 A 區最低電壓 pack → 充電
- 找出 B 區最低電壓 pack → 充電

---

### 7.5 單一 pack 停止條件

- 該 pack 電壓 ≥ avg_v
- 或已執行 30 秒

---

### 7.6 全局停止條件

- DeltaV ≤ 5mV
- 或總執行時間 ≥ 180 秒

---

### 7.7 結束行為

- 關閉所有 active balancing
- 進入下一階段（PASSIVE 或 REST）

---

## 8. CONCURRENT 模式

### 行為

- Passive 與 Active 同時執行

### 啟動條件

- DeltaV > 5mV

### 停止條件

- DeltaV ≤ 5mV
- 或 180 秒

---

## 9. REST（休息階段）

### 行為

- 關閉所有 balancing（Active + Passive）

### 持續時間

- 30 秒

### 結束後

- 回到 IDLE
- 重新判斷 DeltaV

---

## 10. 循環邏輯

REST → IDLE → 判斷 DeltaV → 重新進入模式

---

## 11. 系統設計關鍵

### 11.1 必須使用狀態機

避免邏輯分散與不可控行為

---

### 11.2 Active 必須有時間片（30 秒）

避免每個 loop 切換 target（防止震盪）

---

### 11.3 Passive 為持續行為

不可使用 interval trigger（避免錯誤開關）

---

### 11.4 非同步設計原則

- 使用單一 smart_monitor_loop 控制
- 所有 coroutine 必須 await
- 不允許跨 event loop
- 避免多 task 同時控制硬體

---

## 12. 建議優化（強烈建議）

### 12.1 Hysteresis（防抖動）

- 啟動：DeltaV > 5mV
- 停止：DeltaV < 3mV

---

### 12.2 Target Lock（避免震盪）

- Active target 在 30 秒內不可變更

---

### 12.3 硬體保護

- 確認 CONCURRENT 模式硬體允許
- 防止 Active / Passive 衝突
- 控制切換頻率

---

## 13. 系統總結

本系統為一套：

State-driven + Time-sliced + Condition-triggered 的電池平衡控制系統

具備：

- 模式切換能力
- 時間控制機制
- 電壓收斂策略
- 自動循環運行能力

---

## 14. 未來擴展方向

- SOC-based balancing
- 溫度權重控制
- 動態 DeltaV threshold
- 預測式 / AI balancing
- InfluxDB 行為分析與優化