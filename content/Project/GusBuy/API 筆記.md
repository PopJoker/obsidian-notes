# GUS Buy System Middleware - API 規格文件

本系統後端基於 FastAPI 架構，整合了 **Appwrite JWT 驗證安全防線**、**Redis 高併發快取** 以及 **MariaDB 數據落地落地交易**。

## 基礎全局規範

- **API 基礎路徑**: `/api/v1`
    
- **認證機制**: 除系統健康檢查與金流 Webhook 外，其餘端點皆須於 Header 帶入 Appwrite 短期 JWT。
    
    HTTP
    
    ```
    Authorization: Bearer <Your_Appwrite_JWT>
    ```
    

## 1. 系統與產品目錄模組 (System & Products)

### 1.1 獲取商店全域配置

- **方法/端點**: `GET /api/v1/products/config`
    
- **說明**: 獲取詢價/電商系統初始化的全域基礎配置（包含產品分類、首頁輪播廣告 Banner 配置）。
    
- **請求 Format**: 無
    
- **回應 Format (JSON)**:
    
    JSON
    
    ```
    {
      "categories": [
        { "id": "all", "name": "全部商品", "icon": "Grid" },
        { "id": "lto", "name": "LTO 鈦酸鋰系列", "icon": "BatteryCharging" }
      ],
      "banners": [
        {
          "id": "b1",
          "title": "格斯科技 LTO 技術革新",
          "subtitle": "高安全性、超長循環壽命的鈦酸鋰電池解決方案",
          "image": "https://...",
          "link": "/category/lto"
        }
      ]
    }
    ```
    

### 1.2 獲取產品清單

- **方法/端點**: `GET /api/v1/products`
    
- **說明**: 獲取 B2B / 儲能商品目錄。支援透過 Query String 篩選分類。
    
- **參數 (Query)**: `category` (字串, 選填, 預設為 `"all"`)
    
- **回應 Format (JSON)**:
    
    JSON
    
    ```
    [
      {
        "id": "gus-lto-60ah",
        "name": "GUS LTO 鈦酸鋰軟包電芯 (60Ah)",
        "description": "具備 30,000 次超高循環壽命...",
        "price": 4500.0,
        "image": "https://...",
        "category": "lto",
        "specifications": {
          "Capacity": "60Ah",
          "Voltage": "2.4V",
          "Cycle Life": ">30000"
        }
      }
    ]
    ```
    

### 1.3 獲取單一產品詳情

- **方法/端點**: `GET /api/v1/products/{product_id}`
    
- **說明**: 依產品 ID 查詢詳細規格。
    
- **錯誤碼**: `404 Not Found` (當產品 ID 不存在時)
    
- **回應 Format (JSON)**: 同 1.2 的單一物件結構。
    

## 2. 庫存管理模組 (Stock Management)

### 2.1 庫存快取預熱同步

- **方法/端點**: `POST /api/v1/stock/sync`
    
- **說明**: 【系統維護/後台專用】讀取 MariaDB 的真實實體庫存，透過 Pipeline 批次強行刷新至 Redis 快取。用於系統重啟、故障恢復或人工大盤點。
    
- **請求 Format**: 無
    
- **回應 Format (JSON)**:
    
    JSON
    
    ```
    {
      "status": "success",
      "message": "Successfully synced 4 products to cache"
    }
    ```
    

### 2.2 單一商品庫存異動 (進貨入庫/調減)

- **方法/端點**: `PATCH /api/v1/stock/{product_id}`
    
- **說明**: 供後台或工廠管理系統手動調整庫存。會優先變更 MariaDB 實體表，成功後利用 `incrby` 同步累加 Redis。
    
- **請求 Format (JSON)**:
    
    JSON
    
    ```
    {
      "increment_qty": 50 
    }
    ```
    
    _(註：`increment_qty` 支援正數代表進貨，負數代表庫存銷退或扣減)_
    
- **回應 Format (JSON)**:
    
    JSON
    
    ```
    {
      "product_id": "gus-lto-60ah",
      "stock_qty": 150,
      "reserved_qty": 10,
      "updated_at": "2026-07-07T11:00:00"
    }
    ```
    

### 2.3 查詢 MariaDB 真實庫存狀態

- **方法/端點**: `GET /api/v1/stock/{product_id}`
    
- **說明**: 查詢目前資料庫落地的現貨庫存與鎖定預留庫存。
    
- **回應 Format (JSON)**: 同 2.2 的回應結構。
    

## 3. 訂單與詢價模組 (Orders & Inquiry)

### 3.1 傳統 B2B 意向詢價單提交

- **方法/端點**: `POST /api/v1/orders/inquiry`
    
- **說明**: 大宗企業採購意向單。此端點**不走** Redis 秒殺鎖與線上金流，僅作為後台追蹤。
    
- **請求 Format (JSON)**:
    
    JSON
    
    ```
    {
      "items": [
        {
          "productId": "gus-ess-rack-100kwh",
          "finalQuantity": 2,
          "negotiatedPrice": 1200000.0
        }
      ]
    }
    ```
    
- **回應 Format (JSON)**:
    
    JSON
    
    ```
    {
      "success": true,
      "message": "Inquiry submitted successfully"
    }
    ```
    

### 3.2 高併發安全下單端點

- **方法/端點**: `POST /api/v1/orders`
    
- **說明**: 核心高併發下單。優先進入 Redis 進行原子庫存扣減（第一防線），成功後透過交易雙寫寫入遠端 Appwrite 與本機 MariaDB（現貨庫存扣除，轉入鎖定庫存 `reserved_qty`）。
    
- **業務分流邏輯**:
    
    - 總金額大於等於 10 萬，或帶有 `project_id` ➔ 狀態轉為 `PM_ESTIMATING`（專案估價審核中）。
        
    - 一般零售/小額採購 ➔ 狀態轉為 `PENDING_PAY`（一般待付款，可跳轉金流）。
        
- **請求 Format (JSON)**:
    
    JSON
    
    ```
    {
      "project_id": "PRJ-2026-LTO-TAIPEI", 
      "total_amount": "1250000.00",
      "items": [
        {
          "product_id": "gus-ess-rack-100kwh",
          "quantity": 1
        }
      ]
    }
    ```
    
- **回應 Format (JSON)**:
    
    JSON
    
    ```
    {
      "status": "success",
      "order_id": "appwrite_generated_doc_id_123",
      "state": "PM_ESTIMATING" 
    }
    ```
    

## 4. 外部金流 Webhook 模組 (Payment Webhooks)

### 4.1 綠界金流非同步交易結果回傳

- **方法/端點**: `POST /api/webhooks/ecpay/callback`
    
- **說明**: 接收綠界金流付款成功的通知。後端會在此執行 **CheckMacValue 簽章驗證** 與 **Redis 10秒等冪性分散式鎖**，防止重複銷帳。扣款成功（`RtnCode == 1`）時，本機 MariaDB 與遠端 Appwrite 的狀態會同步變更為 `PAID`，並清除預扣鎖定庫存，寫入發票號碼。
    
- **請求 Format (application/x-www-form-urlencoded)**:
    
    Code snippet
    
    ```
    MerchantID=2000132
    &MerchantTradeNo=appwrite_generated_doc_id_123x171234
    &RtnCode=1
    &RtnMsg=交易成功
    &TradeNo=ECPAY202607079999
    &TradeAmt=4500
    &PaymentDate=2026/07/07 11:05:00
    &CheckMacValue=SHA256_ENCRYPTED_STRING_HERE
    &SimulatePaid=0
    ```
    
- **回應 Format (純文字 `text/plain`)**:
    
    - 處理成功（不論是首次處理成功，或是重複打入被等冪性攔截）：回傳 `1|OK` (通知綠界停止補發)
        
    - 驗章或系統失敗：回傳 `0|ErrorMessage` (通知綠界幾分鐘後重發)