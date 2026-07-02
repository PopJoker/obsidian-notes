## 一、 技術棧與部署架構
### 1. 生態系統配置
* **前端框架：** **Vue 3** (單頁應用 SPA) + **PWA (Progressive Web App)**。
* 電商加入 PWA 可以支援離線快取基本商品資訊、加入手機桌面、類似 App 的體驗。
* **後端與中間件 (API Gateway)：** **Python** (**FastAPI**)。
* 負責處理複雜商業邏輯：計算購物車金額分流、介接銀行金流 API、電子發票開立。
* **後端即服務 (BaaS)：** **Appwrite**。
* 負責基礎會員驗證 (Google JWT)、基礎 CRUD、Session 管理與檔案/圖片儲存 (Storage)。
---
## 二、 Appwrite 權限控管

利用 Appwrite 的 **Teams (團隊)** 與 **Roles (角色)** 功能，系統將劃分以下四種權限。Python 中間件與 Appwrite 的 Collection 權限將依此設定：

| **角色名稱 (Team ID)**     | **系統權限與核心職能範圍**                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`member`** (一般會員)    | * 僅能讀取已上架商品 (`Product Table`)。<br>* 僅能對自己的購物車與訂單 (`Order Table`) 進行 CRUD。<br>* 發起退換貨申請。 |
| **`pm`** (專案經理)        | * 商品全權管理：手動上架、修改商品細項、設定商品價格與起訂量。<br>* 接洽 $\ge$ 10 萬元的訂單，負責核實場勘、重新估價，並更新訂單狀態。            |
| **`warehouse`** (倉管)   | * 分類管理：建立、修改商品分類與項目（自營、外部供應商、聯合代理）。<br>* 庫存維護：更新 `Product Table` 中的剩餘數量。                |
| **`finance`** (會計/負責人) | * 負責核對線下轉帳帳款，確認收到 $\ge$ 10 萬元訂單的款項後，點擊「確認付款」正式建立/啟動訂單。                                  |

---

## 三、 資料庫結構

### 1. User Table (用戶表)
*完全由 Appwrite 託管與自動生成，包含內建 Google JWT 驗證所需欄位。*
### 2. Product Table (商品表)
* `product_id`: string (主鍵，自動生成)
* `category_id`: string (外鍵，關聯至 Category Table)
* `product_name`: string (產品名稱)
* `product_category_tag`: string (產品類別標籤，如：LTO 三元等)
* `product_description`: text (產品描述與細項 Spec)
* `product_remaining_quantity`: integer (產品剩餘數量/庫存)
* `product_prices`: float (產品價格)
* **`is_project_quote`**: boolean (是否為專案報價商品。若為 true，前台價格改顯示「專案洽詢」，且強制走 PM 接洽流程)
* `product_moq`: integer (產品起訂量)
* `product_companyname`: string (製造公司代號)
* `product_tags`: array (搜尋標籤/濾鏡)
* `product_imgurl`: string (圖片儲存網址)
### 3. Order Table (訂單總表)
* `order_id`: string (主鍵，自動生成)
* `user_id`: string (外鍵，購買人帳戶 ID)
* `order_pay`: string (付款方式：線上刷卡 / 線下轉帳)
* `total_amount`: float (訂單總金額，用於系統判定分流)
* `order_status`: string (訂單狀態：`待付款` / `PM核估中` / `待會計確認` / `已付款` / `出貨中` / `已結案` / `退換貨審查中`)
* `order_serve_date`: datetime (訂單審核與各狀態變更時間)
* `order_officer_pm_id`: string (負責此訂單的 PM 員工 ID)
* `invoice_number`: string (電子發票號碼，由 Python 中間件串接第三方後回填)
### 4. Order_Items_Table 
* `item_id`: string (主鍵)
* `order_id`: string (外鍵，關聯至 Order Table)
* `product_id`: string (外鍵，關聯至 Product Table)
* `quantity`: integer (購買數量)
* `price_at_purchase`: float (購買當下的單價)
### 5. Category Table (分類表)
* `category_id`: string (主鍵)
* `category_name`: string (類別名稱，如：固態系列)
* `category_source`: string (來源類別：自帶自營 / 外部供應商 / 聯合代理)
### 6. Banner Table (廣告橫幅表)
* `banner_id`: 依表格排列自動生成
- `banner_title`: 專案標題
- `banner_subtitle`: 專案副標
- `banner_tag`: 相關內容 Tag
- `banner_bgcolor`: 背景顏色碼
- `banner_imgurl`: 包含圖片網址
- `banner_gourl`: 點選轉跳聯結
---

## 四、 業務流程

### 1. 購物車結帳與「金額分流」流程
1. 客戶在 Vue 前端點擊結帳。
2. 前端將購物車資料送至 **Python 中間件**。
3. Python 中間件計算 `total_amount` (總金額)：
* **IF 總金額 $<$ 10 萬 且 無專案商品：**
	* 呼叫銀行 API 進行線上付款 $\rightarrow$ 付款成功 $\rightarrow$ 呼叫發票 API $\rightarrow$ 在 Appwrite 建立狀態為 `已付款` 的訂單。
* **IF 總金額 $\ge$ 10 萬 或 含有專案商品(`is_project_quote = true`)：**
	* 阻止線上付款。
	* 在 Appwrite 建立訂單，狀態設為 `PM核估中`。
	* 系統通知 `Team: pm` (專案經理團隊)。
### 2. 專案接洽流程 (線下轉線上)
1. PM 收到 `PM核估中` 訂單通知 $\rightarrow$ 進行線下場勘。
2. PM 於後台重新輸入調整後的價格 (修改 `total_amount`) $\rightarrow$ 系統向客戶發送「核估完成通知」。
3. 客戶點擊確認，並依照估價進行線下銀行轉帳。
4. 會計 (`Team: finance`) 核對公司帳戶收到款項 $\rightarrow$ 在後台點擊「確認收款」 $\rightarrow$ 訂單狀態變更為 `已付款`，進入後續出貨流程。
### 3. 退換貨流程 (含人工抽驗)
1. 客戶向歷史訂單發起退換貨需求（訂單狀態轉為 `退換貨審查中`）。
2. 業務/PM 收到通知，前往客戶端場勘、了解產品問題。
3. 安排技術人員進行產品修復或更換新機。
4. **人工抽驗環節：**
	* 技術人員或品管線下進行**人工抽驗**。
	* **抽驗有效 (合格)：** PM 於後台手動勾選「抽驗通過」 $\rightarrow$ 客戶線上簽收 $\rightarrow$ 訂單變更為 `已結案`。
	* **抽驗無效 (不合格)：** PM 於後台點擊「抽驗失敗」 $\rightarrow$ 流程退回重跑，人員繼續進行產品重修或重新換新。