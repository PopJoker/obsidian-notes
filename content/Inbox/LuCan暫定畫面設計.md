既然這個測試軟體的關鍵特點是：**「通訊定義靠猜、測點數目與定義可能變動、需即時監控 DeltaV / DeltaTemp 並且判斷上下限」**，畫面的佈局就不能採用傳統「把 Label1~Label48 擺死」的做法。

以下為你規劃的 **WinForms 畫面佈局與動態 UI 架構**，延續我們之前的 **Hioki / Deep Blue Industrial（深藍工業風）** 視覺風格：

### 一、 畫面整體區域規劃 (Layout Topology)

建議將主畫面切分為 **四大核心區域**（採用 `TableLayoutPanel` 或 `SplitContainer` 進行響應式佈局）：

```
+-----------------------------------------------------------------------------------+
| [1. Top Bar] 系統通訊狀態 / Profile 載入 / 啟動與暫停測試 / 總體警示燈                 |
+-----------------------------------------------------------------------------------+
| [2. Key KPI Summary Panel] (大字體重點指標區)                                         |
|  - Max Volt / Min Volt / DeltaV (高亮與 Cell 編號)                                  |
|  - Max Temp / Min Temp / DeltaTemp (高亮與 Temp 編號)                               |
|  - 模組總壓 / SOC / SOH / 系統狀態                                                  |
+--------------------------------------------------+--------------------------------+
| [3. Dynamic Monitoring Grid / Cards]             | [4. Threshold & Config Panel]  |
| (動態渲染區 - 根據 JSON Profile 生成)               | (右側/抽屜式 上下限與控制設定)  |
|                                                  |                                |
|  - Tab 1: 電壓矩陣 (Cell 01~48 狀態卡片/網格)       |  - DeltaV 上下限 (Warning/Alarm)|
|  - Tab 2: 溫度矩陣 (Temp 01~14, PCBA)             |  - DeltaTemp 上下限            |
|  - Tab 3: 狀態標誌與平衡狀態 (Balance Status)       |  - 單體電壓/溫度上下限          |
|                                                  |  - 載入/儲存 JSON 通訊設定檔    |
+--------------------------------------------------+--------------------------------+
| [5. Bottom Status Bar] CAN 報文統計 (FPS, Error Count) / 最新 Log 提示               |
+-----------------------------------------------------------------------------------+
```

### 二、 核心區域設計細節

#### 1. Key KPI Summary Panel (重點指標卡片區)

此區是測試人員最常看的區域，採用**大字體與高對比色卡**：

- **DeltaV 顯示卡**：
    
    - 大字體顯示 `DeltaV = 42 mV`（$\Delta V = V_{\max} - V_{\min}$）
        
    - 標註最高與最低來源：`Max: 3288 mV (C12)` / `Min: 3246 mV (C28)`
        
    - **動態顏色變換**：若 $\Delta V$ 超過設定的警示值（如 > 50mV），背景或文字自動切換為 **Hioki Yellow**（Warning）或 **Fail Red**（Alarm）。
        
- **DeltaTemp 顯示卡**：
    
    - 大字體顯示 `DeltaTemp = 0.4 °C`
        
    - 標註最高與最低來源：`Max: 30.6 °C (Temp04)` / `Min: 30.2 °C (Temp12)`
        

#### 2. Dynamic Monitoring Grid (動態監控卡片區)

為了應付 spec 常變更、顆數隨時會增減的情況：

- **電壓/溫度卡片牆 (Card Grid)**：
    
    - 不在 Designer.cs 裡面硬畫 48 個 TextBox。
        
    - 程式執行時，讀取 JSON 的 Signal 列表，在 `FlowLayoutPanel` 中動態 `Controls.Add()` 自訂的 `CellStatusCard` 控制項。
        
    - **單一卡片內容**：
        
        - 標題（如 `C01`）
            
        - 當前數值（如 `3231 mV`）
            
        - 狀態邊框/背景（正常：深藍底白字 / 均衡中：亮藍色閃爍 / 超標：紅底白字）
            
- **極值自動高亮**：
    
    - 全域更新時，自動將全組最高電壓的卡片標註 **[MAX]** 標籤，最低電壓標註 **[MIN]** 標籤，方便工程師視覺快速定位。
        

#### 3. Threshold & Config Panel (上下限設定門檻)

這個區域讓工程師可以即時調校判斷邏輯：

- **門檻設定項**：
    
    - `DeltaV Warning Threshold` (mV) & `DeltaV Alarm Threshold` (mV)
        
    - `DeltaTemp Warning Threshold` (°C) & `DeltaTemp Alarm Threshold` (°C)
        
    - `Cell Voltage Min / Max Threshold`
        
    - `Temperature Min / Max Threshold`
        
- **Profile 管理**：
    
    - 一鍵切換 JSON 通訊檔按鈕（例如：`LMU_X04_v1.json` 快速切換到 `LMU_X04_v2.json`），切換後畫面上的卡片牆自動清空並重新動態生成！
        

### 三、 配色風格繼承 (Hioki Industrial Theme Applied)

我們將之前的 **Hioki 深藍工業風** 完整套用到這個介面上：

- **主視窗背景 (`Form.BackColor`)**：`#0A1830` (深灰藍)
    
- **KPI 與卡片面板背景 (`Panel.BackColor`)**：`#122748` 或 `#FFFFFF`（可提供暗色模式與高對比亮色面板）
    
- **狀態指示**：
    
    - **PASS / 正常**：`#28A745` (安全綠)
        
    - **WARNING / 接近臨界**：`#FFC000` (Hioki Yellow 經典黃)
        
    - **FAIL / 超過上下限**：`#DC3545` (警示紅)
        
    - **ACTIVE / 正在平衡 (Balance)**：`#007AFF` (藍色閃爍/高亮)
        

### 四、 畫面討論重點與建議

1. **呈現方式選擇（卡片牆 vs DataGridView）**：
    
    對於 48 顆 Cell，你比較偏好：
    
    - **方案 A（色塊卡片牆 Card Layout）**：直觀、像 BMS 監控大螢幕，最高/最低電壓一目了然。
        
    - **方案 B（表格 DataGridView）**：資訊密度高，方便一次看更多欄位（如包含 Raw Hex、Byte 位置、物理值）。
        
    - **方案 C（兩者兼具 Tab 頁籤切換）**。
        
2. **上下限設定的持久化**：
    
    上下限設定值是否需要隨著 JSON Profile 一起儲存？（即不同機種設定不同的 DeltaV 門檻）
    

你覺得這個畫面分區與規劃方向如何？我們針對哪一個區域進行細化討論？