
參考 [Ray Liu](https://blog.liu-yucheng.com/2026/04/08/ecommerce-architecture-series-part1-platform-overview/) [冰河](https://juejin.cn/post/7417746324387037235) 加入併發處理 與伺服器架構整體修改

## 一、 技術棧與部署架構

### 1. 生態系統配置與拓撲優化

![[Pasted image 20260703144925.png|332]]

* **前端靜態外殼與 PWA (Vue 3 + Vite)：**
    * **架構調整：** **嚴禁**使用 Python 中間件直接掛載前端靜態檔案。前端靜態資源與 PWA 清單、Service Worker 應部署於高效能的 **Nginx**。
    * **PWA 能效：** 專注於工業級/電商核心商品數據（如 LTO 三元電芯基本規格、製造商代碼、離線購物車）的 Service Worker 本地快取，提升弱網環境下案場工程師與採購人員的類似原生 App 體驗。
* **後端與中間件 API Gateway (Python FastAPI)：**
    * **架構職能：** 核心業務邏輯的唯一進入點（Single Entry Point）。負責複雜商業邏輯計算、跨系統分散式交易協調、金流/發票 API 介接、Redis 分散式鎖調度，以及**寫入非同步操作稽核日誌 (Audit Log)**。
* **後端即服務 BaaS (Appwrite)：**
    * **架構職能：** 負責底層會員驗證基座（Google JWT 安全交換）、基礎數據分頁 CRUD 提供、Session 狀態維護與二進位大型物件儲存（Storage / 產品圖檔、場勘報告 PDF）。

---

## 二、 安全邊界與權限控管 (RBAC / ABAC)

為杜絕**無授權對象直接列舉（BOLA / IDOR）**與前端惡意篡改 BaaS 數據的風險，本系統實施「前端唯讀商品，核心寫入收斂至中間件」的防禦策略。Appwrite Collection 權限僅對一般用戶開放 `Read`，所有的 `Create/Update/Delete` 動作必須經由 Python 中間件（持 Master API Key）做二次邏輯與身份校驗後代理執行。
### 角色權限與核心職能矩陣 (Role-Based Access Control)

| 角色名稱 (Team ID)            | 核心職能與資料安全邊界                                                                        | Python 中間件強制校驗規則 (Gatekeeper)                                                 |
| :------------------------ | :--------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **`member`**<br>(一般會員)    | - 僅能讀取已上架商品 (`Product Table`)。<br>- 對自身購物車具有暫存權限。<br>- 無權直寫訂單表，必須透過中間件發起下單與退換貨申請。  | - 嚴格限制 `user_id` 綁定，任何 API 請求皆透過 JWT 解析，嚴防越權讀取他人訂單。                           |
| **`pm`**<br>(專案經理)        | - 商品全權管理（手動上架、價格、MOQ）。<br>- $\ge 10$ 萬元或專案商品訂單之線下場勘、重新核估。<br>- 具有改價權限，但改價時會觸發強制審計。 | - 修改價格 API 必須帶有 `change_reason`，且新價格與折讓金額必須與訂單明細攤分邏輯相符，否則拒絕寫入。                |
| **`warehouse`**<br>(倉管)   | - 分類管理（自營、供應商、聯合代理）。<br>- 實體庫存增減維護。<br>- 出貨時負責利用硬體條碼槍/PDA 逐一將實體序號綁定至訂單明細，並啟動保固。    | - 限制僅能變更 `Order_Items_Table` 中的 `serial_number` 與 `item_status`，禁止修改訂單金額相關欄位。 |
| **`finance`**<br>(會計/負責人) | - 負責核對線下大額轉帳（$\ge 10$ 萬元）帳款。<br>- 點擊「確認付款」啟動訂單。<br>- 執行退款審查與金流發票銷退處理。              | - 審核 API 必須校驗會計人員的 Role 憑證，並由後端向金流平台反向反查帳目狀態，避免前端偽造請求。                        |

---

## 三、 資料庫結構設計 (Relational-BaaS Hybrid Schema)

### 1. User Table (用戶表)
*完全由 Appwrite User Service 託管，包含內建 Google JWT 驗證與自訂 Roles/Teams 欄位。*

### 2. Product Table (商品表)
| 欄位名稱                         | 型態            | 約束/說明                            |
| :--------------------------- | :------------ | :------------------------------- |
| `product_id`                 | string        | 主鍵 (UUIDv4)                      |
| `category_id`                | string        | 外鍵，關聯至 `Category Table`          |
| `product_name`               | string        | 產品名稱                             |
| `product_category_tag`       | string        | 產品類別標籤（如：LTO三元、固態、鈉離子）           |
| `product_description`        | text          | 產品描述與詳細規格參數 (Spec)               |
| `product_remaining_quantity` | integer       | 產品可用剩餘庫存（受 Redis 樂觀鎖/分散式鎖保護）     |
| `product_price`              | decimal(12,2) | 產品標準單價（轉換為高精度字串儲存，防浮點數誤差）        |
| `currency`                   | string        | 幣別 (如：`TWD`, `USD`)，預留匯率轉換       |
| `is_project_quote`           | boolean       | 是否為專案報價商品。True 則前台顯示「專案洽詢」並強制分流  |
| `product_moq`                | integer       | 產品最低起訂量 (Minimum Order Quantity) |
| `product_companyname`        | string        | 製造公司代號 / 供應商代碼                   |
| `product_tags`               | array         | 搜尋標籤 / 篩選器索引陣列                   |
| `product_imgurl`             | string        | 圖片儲存服務 (Appwrite Storage) 存取網址   |

### 3. Order Table (訂單總表)
| 欄位名稱                     | 型態            | 約束/說明                                                                                                                                                         |
| :----------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `order_id`               | string        | 主鍵 (UUIDv4)                                                                                                                                                   |
| `user_id`                | string        | 外鍵項目，購買人帳戶 ID                                                                                                                                                 |
| `order_pay`              | string        | 付款方式：`ONLINE_CARD` (線上刷卡) / `OFFLINE_TRANSFER` (線下轉帳)                                                                                                         |
| `currency`               | string        | 幣別 (如：`TWD`, `USD`)，預留跨境或大額組件採購需求                                                                                                                             |
| `total_amount`           | decimal(12,2) | 訂單應付總金額 (經中間件加總或 PM 調整後的最終值)                                                                                                                                  |
| `discount_amount`        | decimal(12,2) | 專案折讓總金額 (預設為 0.00，供財務與審計核對)                                                                                                                                   |
| `tax_amount`             | decimal(12,2) | 營業稅額 (發票開立核心依據)                                                                                                                                               |
| `order_status`           | string        | 狀態機：`PENDING_PAY` (待付款) / `PM_ESTIMATING` (PM核估中) / `FINANCE_VERIFY` (待會計確認) / `PAID` (已付款) / `SHIPPING` (出貨中) / `COMPLETED` (已結案) / `REFUND_REVIEW` (退換貨審查中) |
| `refund_status`          | string        | 退款狀態機：`NO_REFUND` (無退款) / `PARTIAL_REFUND` (部分退款) / `FULL_REFUND` (全額退款)                                                                                      |
| `order_officer_pm_id`    | string        | 負責此 B2B 訂單的 PM 員工 ID                                                                                                                                          |
| `invoice_number`         | string        | 電子發票號碼 (由中間件非同步呼叫第三方發票系統後回填)                                                                                                                                  |
| `shipping_address`       | string        | 送貨地址 / 案場確切 GPS 與位置資訊                                                                                                                                         |
| `shipping_contact_name`  | string        | 案場收件現場聯絡人姓名                                                                                                                                                   |
| `shipping_contact_phone` | string        | 案場收件現場聯絡人電話                                                                                                                                                   |
| `site_condition`         | text          | 案場實體環境狀況（由 PM 線下場勘後於後台結構化填入）                                                                                                                                  |
| `shipping_notes`         | text          | 物流與配送備註（PM 可根據場勘吊車、地形等狀況進行優化更新）                                                                                                                               |

### 4. Order_Items_Table (訂單明細表 - 單品拆解)
| 欄位名稱 | 型態 | 約束/說明 |
| :--- | :--- | :--- |
| `item_id` | string | 主鍵 (UUIDv4) |
| `order_id` | string | 外鍵，關聯至 `Order Table` |
| `product_id` | string | 外鍵，關聯至 `Product Table` |
| `quantity` | integer | **固定為 1**。購物車多數量下單時，中間件將自動拆解為獨立的 Row，以支援「單台設備序號」精準追溯 |
| `price_at_purchase` | decimal(12,2)| 購買當下單價快照。**若 PM 改價，必須依比例按折讓公式攤分回填至此，確保明細加總恆等於總表金額** |
| `is_project_quote_at_purchase`| boolean | 下單當下是否為專案商品快照，阻斷後續商品表更動造成的歷史衝突 |
| `item_status` | string | 明細狀態：`NORMAL` (正常) / `REFUND_REVIEW` (退換貨審查中) / `RETURNED` (已退貨) / `MAINTENANCE` (保固維修中) |
| `serial_number` | string | 外鍵，關聯至 `Product_Serials_Table`。出貨時由倉管掃描綁定 |
| `warranty_expiry_date`| datetime | 該單一實體設備的保固到期日。出貨完成當下，由中間件以出貨日期自動加算（如 +2 年） |

### 5. Product_Serials_Table (實體序號資產狀態表)
*解決工業級儲能資產在退貨、流轉、售後過程中的「流浪序號」生命週期追蹤問題。*

| 欄位名稱 | 型態 | 約束/說明 |
| :--- | :--- | :--- |
| `serial_number` | string | 主鍵 (如："BAT-2026-001") |
| `product_id` | string | 外鍵，關聯至 `Product Table` |
| `current_status` | string | 狀態：`IN_WAREHOUSE` (在庫) / `SHIPPED` (已出貨) / `RETURN_REVIEW` (退貨審查中) / `MAINTAINING` (維修中) / `SCRAPPED` (已報廢) |
| `last_order_id` | string | 最近一次綁定的訂單外鍵（允許為空，代表未曾售出） |

### 6. Order_Status_History_Table (訂單狀態生命週期履歷表)

| 欄位名稱              | 型態       | 約束/說明                |
| :---------------- | :------- | :------------------- |
| `history_id`      | string   | 主鍵 (UUIDv4)          |
| `order_id`        | string   | 外鍵，關聯至 `Order Table` |
| `previous_status` | string   | 變更前狀態                |
| `current_status`  | string   | 變更後狀態                |
| `operator_id`     | string   | 操作者帳號 ID             |
| `changed_at`      | datetime | 狀態變更確切時間戳            |

### 7. Order_Audit_Log_Table (訂單人工操作審計日誌表)
| 欄位名稱 | 型態 | 約束/說明 |
| :--- | :--- | :--- |
| `log_id` | string | 主鍵 (UUIDv4) |
| `order_id` | string | 外鍵，關聯至 `Order Table` |
| `operator_id` | string | 操作者帳號 ID (PM、會計或系統程序) |
| `operator_role` | string | 操作者角色快照 (`pm` / `finance` / `system`) |
| `action_type` | string | 操作類型：`PRICE_UPDATE` (價格人工調整) / `EXCEPTION_CANCEL` (異常強制取消) |
| `old_value` | text | 變更前之 JSON 結構或數值字串 |
| `new_value` | text | 變更後之 JSON 結構或數值字串 |
| `change_reason` | text | **人工異動原因強制備註（不可為空）** |
| `created_at` | datetime | 日誌不可變寫入時間戳 |

### 8. Category Table (分類表)
| 欄位名稱            | 型態      | 約束/說明                                        |
| :-------------- | :------ | :------------------------------------------- |
| `category_id`   | string  | 主鍵                                           |
| `category_name` | string  | 類別名稱（如：固態系列、三元儲能、外部代採）                       |
| `category_item` | string  | 來源屬性（鋰鈦酸鋰 (LTO) 電芯, 三元鋰 (NCM) 電芯, 智慧儲能與動力模組） |
| `category_step` | integer | 階層數                                          |

### 9. Banner Table (廣告橫幅表)
| 欄位名稱 | 型態 | 約束/說明 |
| :--- | :--- | :--- |
| `banner_id` | string | 主鍵 (UUIDv4) |
| `banner_title` | string | 專案行銷主標題 |
| `banner_subtitle`| string | 專案行銷副標題 |
| `banner_tag` | string | 行銷標籤 |
| `banner_bgcolor` | string | HEX 背景顏色碼 (如：`#0F172A`) |
| `banner_imgurl` | string | Banner 靜態圖檔路徑 |
| `banner_gourl` | string | 點擊跳轉之安全目標 URL |

---

## 四、 核心業務架構流程與異常邊界處理

### 1. 購物車結帳與高併發「庫存防超賣」分流流程

為應對高併發下庫存扣減導致的**更新丟失 (Lost Update)**，系統引入 Redis 分散式鎖，並在金流介接中引入分散式交易保護機制。

![[Pasted image 20260703135812.png|377]]

1.  **結帳請求攔截：** 客戶在前端點擊結帳，Vue 將購物車品項、數量與配送資訊送至 Python FastAPI 中間件。
2.  **分散式鎖與原子扣減：** 中間件針對購物車內的 `product_id` 向 Redis Cluster 請求**分散式鎖 (Redis Lock)** 或執行原子操作（如 `DECRBY`）。確認 `product_remaining_quantity >= quantity`。若庫存不足，立即熔斷並向前端拋出「商品已售罄」異常，拒絕後續一切交易。
3.  **條件分流與訂單預扣：**
    * **情境 A：總金額 $< 10$ 萬元 且 無專案商品：**
        1. 中間件於資料庫內建立初始狀態為 `PENDING_PAY` (待付款) 的訂單與明細表（數量多者在此時進行一體多列 Row 拆解），鎖定庫存。
        2. 中間件向前端返回綠界金流簽章。前端跳轉至支付閘道。
        3. **支付成功校驗：** 綠界系統非同步發送 Webhook（回調）至 FastAPI 中間件。中間件收到通知後，**在同一個資料庫交易 (Database Transaction) 中**，先完成綠界交易序號對帳，確認無誤後呼叫第三方發票 API。發票開立成功取得 `invoice_number` 後，更新訂單狀態為 `PAID` (已付款)，並寫入 `Order_Status_History_Table`。
        4. *異常處理（分散式交易失效）：* 若發票 API 超時或失敗，系統將該訂單掛起並拋入 RabbitMQ/Redis Queue 延時佇列進行等冪性自動補發重試（Idempotent Retry），確保不會發生「已扣款卻無發票、無訂單」之現象。
    * **情境 B：總金額 $\ge 10$ 萬元 或 含有專案商品 (`is_project_quote = true`)：**
        1. 中間件阻止一切線上即時刷卡行為。
        2. 於資料庫建立訂單，狀態直接設為 `PM_ESTIMATING` (PM核估中)，並釋放 Redis 庫存鎖，將該批庫存標記為「專案預扣狀態」。
        3. 系統派發 WebSocket/Email 通知至 `Team: pm`。

### 2. 專案接洽與高精度改價審計流程

1.  **線下勘查與改價觸發：** PM 收到 `PM_ESTIMATING` 訂單通知，進行線下勘查，判斷案場環境。若需改價，於後台介面重新輸入核估總金額。
2.  **強制審計前端阻斷：** 後台 UI 偵測到價格異動，強制彈出 Modal 視窗，要求必須輸入合法的 `change_reason`，否則禁止點擊送出。
3.  **後端對稱攤分與雙向鎖死：** 請求送達 FastAPI 中間件後，執行以下原子操作交易：
    * 讀取原訂單總表金額，計算出折讓差額（如：原價 12 萬，降為 10 萬 5，折讓 1 萬 5）。
    * **明細攤分：** 為了維持「財務一致性」，中間件必須依照比例，將 1 萬 5 的折讓金額依權重攤分至該訂單旗下的所有 Item 的 `price_at_purchase` 欄位中，確保Order_Items_Table.price_at_purchase總和與Order_Table.total_amount最終價格一致，避免日後部分退貨時產生明細與總價對不起來的財務災難。
    * 將舊總價、新總價、PM 用戶 ID 以及 `change_reason` 包裝為 JSON，寫入 `Order_Audit_Log_Table`。
    * 更新訂單狀態至 `FINANCE_VERIFY` (待會計確認)，並向客戶發送核估完成轉帳通知。
4.  **會計實體帳目對沖：**
    * 客戶依據最終估價進行實體線下銀行轉帳。
    * 會計 (`Team: finance`) 核對公司實體網銀帳目，確認款項進帳後，於後台點擊「確認付款」。
    * FastAPI 接收請求，變更 `Order Table` 狀態為 `PAID` (已付款)，同時於 `Order_Status_History_Table` 自動寫入一筆由 `finance` 操作的 `STATUS_UPDATE` 軌跡。

### 3. 出貨與序列化資產生命週期啟動流程

1.  **倉管通知派發：** 訂單狀態移轉至 `PAID` 後，系統向 `Team: warehouse` 的 PDA/行動終端推送出貨備貨清單。
2.  **實體序號條碼解碼與狀態綁定：**
    * 倉管實體備貨時，必須使用 PDA 條碼槍逐一掃描出廠實體電池組或電芯上不可變更的鐳射條碼 (`serial_number`)。
    * 每掃描一筆，前端將序號發送至中間件，中間件執行**雙重校驗**：
        1. 查詢 `Product_Serials_Table`，確認該序號的 `current_status` 恆為 `IN_WAREHOUSE`（防止同一實體序號設備被重複出貨或雙重綁定）。
        2. 校驗該序號所對應的 `product_id` 是否與訂單明細要求的品項完全一致。
    * 校驗通過後，將序號寫入該行明細的 `Order_Items_Table.serial_number`，並同步將 `Product_Serials_Table.current_status` 變更為 `SHIPPED`，且將 `last_order_id` 更新為當前訂單 ID。
3.  **出貨完成與保固算力觸發：**
    * 所有明細列皆精準綁定實體序號後，倉管點擊「出貨完成」，總表 `order_status` 由中間件更新為 `SHIPPING` (出貨中)。
    * 中間件在狀態變更交易成功的當下，自動獲取當前伺服器標準時間 (UTC+8)，依據該商品定義之保固級距（如：+2 年）進行時間運算，精確回填至 `Order_Items_Table.warranty_expiry_date`。

### 4. 退換貨與長期保固追溯流程（異常邊界精準處理）

#### 情況 A：收到貨後「七天內退貨」的財務與發票銷退分流
客戶在前端個人中心發起退貨申請（必須在總表狀態為 `SHIPPING` 或 `COMPLETED` 且時間點在 `warranty_expiry_date` 啟動 7 天內）。
##### 模式一：單商品（部分）退貨架構邏輯
1.  **狀態獨立：** 客戶勾選特定的 `serial_number` 設備，系統僅將該特定明細的 `item_status` 變更為 `REFUND_REVIEW` (退換貨審查中)。訂單總表的 `order_status` 保持原狀不變，以確保不影響同一訂單中其他留在案場正常運作的資產。
2.  **審核與物流：** PM 與倉管核實未拆封後同意退貨，生成物流單收回。
3.  **實體序號入庫註銷：**
    * 倉管收到實體退貨，**必須再次使用條碼槍掃描實體產品序號**。
    * 系統核對掃描序號是否與原明細表鎖定的 `serial_number` 完全一致。
    * 確認一致後，由中間件啟動資料庫事務：
        1. 將 `Product Table` 的實體可用庫存加 1：`product_remaining_quantity = product_remaining_quantity + 1`。
        2. 將 `Product_Serials_Table.current_status` 由 `SHIPPED` 改回 `IN_WAREHOUSE`，使該實體設備序號重新進入可銷售生命週期。
        3. 將該行明細的 `item_status` 變更為 `RETURNED` (已退貨)。
        4. 將該行明細的 `warranty_expiry_date` 清空或標記註銷。
4.  **財務銷退與折讓單開立（核心分流）：**
    * 會計確認入庫無誤後，點擊「退款確認」。
    * **金流處理：** 中間件讀取該已退貨明細列上的 `price_at_purchase`（此值在 PM 改價時已做過對稱攤分，因此絕對精準），串接綠界 API 執行**「部分退刷 / 部分退款」**，退還該明細之確切金額。
    * **發票處理：** 中間件呼叫第三方電子發票 API，開立**「電子發票銷貨折讓單」**（金額為該明細含稅價），系統自動透過電子郵件將折讓證明送達客戶載具。
    * **總表修正：** 總表 `refund_status` 更新為 `PARTIAL_REFUND` (部分退款)。總表 `order_status` 依然維持 `COMPLETED`。

##### 模式二：整單商品退貨架構邏輯
1.  **批次狀態移轉：** 客戶點擊整單退貨，中間件一鍵將該訂單旗下所有明細的 `item_status` 批次變更為 `REFUND_REVIEW`。同時，為利於後台儀表板大額風險控管，總表的 `order_status` 同步變更為 `REFUND_REVIEW` (退換貨審查中)。
2.  **實體批次序號校驗：** 倉管收回整批貨物，必須逐一掃描所有實體序號。系統迴圈比對，任何一組序號不符或缺失，後台即鎖死「入庫確認」按鈕。
3.  **批次入庫與資產釋放：** 全數序列化資產核對無誤後，倉管點擊確認。中間件大批量更新 `Product Table` 庫存，並將所有對應序號在 `Product_Serials_Table` 中的狀態重置為 `IN_WAREHOUSE`。所有明細狀態變更為 `RETURNED`。
4.  **全額金流作廢與發票作廢：**
    * 會計確認後執行最終退款。
    * **金流處理：** 中間件以總表 `total_amount` 為基準，串接綠界 API 執行**「全額退刷 / 全額退款」**。
    * **發票處理：** 中間件呼叫電子發票 API，直接執行**「原電子發票作廢 (Void Invoice)」**。
    * **結案狀態：** 總表 `refund_status` 變更為 `FULL_REFUND` (全額退款)，`order_status` 由系統非同步自動移轉為 `COMPLETED` (已結案)，並記錄「整單退貨結案」之審計日誌。

#### 情況 B：兩年後壞掉「保固維修與長期售後人工抽驗」機制
本機制屬於長期售後（Long-term Service），主要依賴**「序列化資產反查能力」**與**「售後狀態機隔離」**。
1.  **售後申請與序號反查：**
    * 客戶於兩年後發現某組 LTO 電芯故障，於歷史訂單或售後中心輸入/掃描電池上的實體鐳射條碼 `serial_number` 發起維修。
    * **反向回溯追蹤（反查）：** 系統接獲序號後，直接對 `Order_Items_Table` 進行反向索引查詢 (Reverse Look-up)：
        1. 撈出當前的 `warranty_expiry_date`，由後端與當前系統時間對比，自動判定「保固內」或「已過保」。
        2. 沿著外鍵直接撈出 `Order Table`，瞬間逆向反查出當初這顆電池是配送去哪一個案場（`shipping_address`）、當初是由哪位 PM (`order_officer_pm_id`) 負責現勘與估價，並能調閱 `Order_Audit_Log_Table` 查看當初是否有過任何改價因果紀錄。
2.  **售後狀態機變更：** 確認在保固內，中間件將該單一明細的 `item_status` 單獨變更為 `MAINTENANCE` (保固維修中)，並將 `Product_Serials_Table.current_status` 變更為 `MAINTAINING` (維修中)。
3.  **線下派工與實體置換：** 技術團隊攜帶全新品或備品前往案場實施修復。若涉及「實體更換新機芯」，技術人員必須使用售後 APP 掃描舊電池序號（解除綁定並將舊序號狀態改為 `SCRAPPED` 報廢或 `RETURN_REVIEW` 載回維修），並掃描新備品序號，將新序號寫入該明細的 `serial_number` 中。
4.  **售後人工抽驗與雙向簽收閉環：**
    * **抽驗不合格（熔斷）：** 技術人員於現場送電測試，若發生瑕疵或數值異常，PM 於售後後台點擊「抽驗失敗」，系統售後狀態機退回重跑，重置派工單。
    * **抽驗合格（結案）：** 現場抽驗通過，PM 於後台手動勾選「抽驗通過」。此時前端 Vue 介面會向客戶彈出線上簽收視窗。客戶進行數位簽章簽收後，中間件變更明細 `item_status` 回復為 `NORMAL`，並將新置換的實體序號狀態在資產表中更新為 `SHIPPED`，整筆售後流程正式宣告閉環。