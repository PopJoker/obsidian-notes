## 一、 技術棧與部署架構
### 1. 生態系統配置
- **前端框架：** **Vue 3** ( 靜態檔案 利用Python掛載 ) + **PWA (Progressive Web App)**。
    - 電商加入 PWA 可以支援離線快取基本商品資訊、加入手機桌面、類似 App 的體驗。
- **後端與中間件 (API Gateway)：** **Python** (**FastAPI + 網頁掛載**)。
    - 負責處理複雜商業邏輯：計算購物車金額分流、介接銀行金流 API、電子發票開立、**寫入操作稽核日誌 (Audit Log)**。
- **後端即服務 (BaaS)：** **Appwrite**。
    - 負責基礎會員驗證 (Google JWT)、基礎 CRUD、Session 管理與檔案/圖片儲存 (Storage)。
## 二、 Appwrite 權限控管
利用 Appwrite 的 **Teams (團隊)** 與 **Roles (角色)** 功能，系統將劃分以下四種權限。Python 中間件與 Appwrite 的 Collection 權限將依此設定：

| **角色名稱 (Team ID)**     | **系統權限與核心職能範圍**                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **`member`** (一般會員)    | - 僅能讀取已上架商品 (`Product Table`)。<br>- 僅能對自己的購物車與訂單 (`Order Table`) 進行 CRUD。<br>- 發起退換貨申請。                                               |
| **`pm`** (專案經理)        | - 商品全權管理：手動上架、修改商品細項、設定商品價格與起訂量。<br>- 接洽 $\ge$ 10 萬元的訂單，負責核實場勘、重新估價，**且修改價格時強制填寫「改價原因」，並更新訂單狀態。**                                     |
| **`warehouse`** (倉管)   | - 分類管理：建立、修改商品分類與項目（自營、外部供應商、聯合代理）。<br>- 庫存維護：更新 `Product Table` 中的剩餘數量。<br>- 出貨管理：負責在出貨時逐一綁定/掃描產品序號 (`serial_number`) 至訂單中，以便未來追溯保固。 |
| **`finance`** (會計/負責人) | - 負責核對線下轉帳帳款，確認收到 $\ge$ 10 萬元訂單的款項後，點擊「確認付款」正式建立/啟動訂單。                                                                                |

## 三、 資料庫結構

### 1. User Table (用戶表)
_完全由 Appwrite 託管與自動生成，包含內建 Google JWT 驗證所需欄位。_
### 2. Product Table (商品表)
- `product_id`: string (主鍵，自動生成)
- `category_id`: string (外鍵，關聯至 Category Table)
- `product_name`: string (產品名稱)
- `product_category_tag`: string (產品類別標籤，如：LTO 三元等)
- `product_description`: text (產品描述與細項 Spec)
- `product_remaining_quantity`: integer (產品剩餘數量/庫存)
- `product_prices`: float (產品價格)
- **`is_project_quote`**: boolean (是否為專案報價商品。若為 true，前台價格改顯示「專案洽詢」，且強制走 PM 接洽流程)
- `product_moq`: integer (產品起訂量)
- `product_companyname`: string (製造公司代號)
- `product_tags`: array (搜尋標籤/濾鏡)
- `product_imgurl`: string (圖片儲存網址)
### 3. Order Table (訂單總表)
- `order_id`: string (主鍵，自動生成)
- `user_id`: string (外鍵，購買人帳戶 ID)
- `order_pay`: string (付款方式：線上刷卡 / 線下轉帳)
- `total_amount`: float (訂單總金額，用於系統判定分流)
- `order_status`: string (訂單狀態：`待付款` / `PM核估中` / `待會計確認` / `已付款` / `出貨中` / `已結案` / `退換貨審查中`)
- `order_serve_date`: datetime (訂單審核與各狀態變更時間)
- `order_officer_pm_id`: string (負責此訂單的 PM 員工 ID)
- `invoice_number`: string (電子發票號碼，由 Python 中間件串接第三方後回填)
- `shipping_address`: string (送貨地址 / 案場位置，結帳時由客戶填寫)
- `shipping_contact_name`: string (現場收件聯絡人)
- `shipping_contact_phone`: string (現場收件人電話)
- `site_condition`: text (案場環境狀況，由 PM 線下場勘後於後台填入/修正)
- `shipping_notes`: text (物流與配送備註，由客戶初填，PM 可於場勘後優化修正，供倉管出貨參考)

### 4. Order_Items_Table (訂單明細表)
- `item_id`: string (主鍵)
- `order_id`: string (外鍵，關聯至 Order Table)
- `product_id`: string (外鍵，關聯至 Product Table)
- **`quantity`**: integer (**固定為 1。建立訂單時由中間件依購物車數量自動拆解為獨立 Row，以支援「單台設備」精準追溯**)
- `price_at_purchase`: float (購買當下的單價快照)
- `is_project_quote_at_purchase`: boolean (下單當下是否為專案商品的快照，防止日後商品表更動影響歷史紀錄)
- **`item_status`**: string (**明細狀態：`正常` / `退換貨審查中` / `已退貨` / `保固維修中`，用以支援部分退換貨**)
- **`serial_number`**: string (**單一產品出廠/電芯序號，出貨時由倉管掃描填入，格式如："BAT-2026-001"**)
- `warranty_expiry_date`: datetime (單一設備的保固到期日參考值，出貨完成當下由後端自動依出貨日期加算)
### 5. Order_Audit_Log_Table (訂單稽核日誌表)
- `log_id`: string (主鍵，自動生成)
- `order_id`: string (外鍵，關聯至 Order Table)
- `operator_id`: string (操作者帳號 ID，紀錄是哪個 PM 或會計)
- `operator_role`: string (操作者角色，如：`pm` / `finance`)
- `action_type`: string (操作類型，如：`PRICE_UPDATE` 價格調整 / `STATUS_UPDATE` 狀態變更)
- `old_value`: string (變更前的數值/狀態，如舊價格 `120000`)
- `new_value`: string (變更後的數值/狀態，如新價格 `105000`)
- **`change_reason`**: text (**異動/調價原因備註，例如：「經現場場勘，環境單純且客戶自備吊車，故折讓 15,000 元工資」**)
- `created_at`: datetime (日誌生成時間)
### 6. Category Table (分類表)
- `category_id`: string (主鍵)
- `category_name`: string (類別名稱，如：固態系列)
- `category_source`: string (來源類別：自帶自營 / 外部供應商 / 聯合代理)
### 7. Banner Table (廣告橫幅表)
- `banner_id`: 依表格排列自動生成
- `banner_title`: 專案標題
- `banner_subtitle`: 專案副標
- `banner_tag`: 相關內容 Tag
- `banner_bgcolor`: 背景顏色碼
- `banner_imgurl`: 包含圖片網址
- `banner_gourl`: 點選轉跳聯結
## 四、 業務流程

### 1. 購物車結帳與「金額分流」流程
1. 客戶在 Vue 前端點擊結帳。
2. 前端將購物車資料送至 **Python 中間件**。
3. Python 中間件計算 `total_amount` (總金額)：
    - **IF 總金額 $<$ 10 萬 且 無專案商品：**
        - 呼叫銀行 API 進行線上付款 $\rightarrow$ 付款成功 $\rightarrow$ 呼叫發票 API $\rightarrow$ 在 Appwrite 建立狀態為 `已付款` 的訂單。
    - **IF 總金額 $\ge$ 10 萬 或 含有專案商品(`is_project_quote = true`)：**
        - 阻止線上付款。
        - 在 Appwrite 建立訂單，狀態設為 `PM核估中`。
        - 系統通知 `Team: pm` (專案經理團隊)。
### 2. 專案接洽流程 (含改價原因稽核日誌)
1. PM 收到 `PM核估中` 訂單通知 $\rightarrow$ 進行線下場勘。
2. PM 於後台重新輸入調整後的價格 (修改 `total_amount`)，**後台 UI 強制彈出對話視窗要求填寫「調整原因（`change_reason`）」**。
3. 前端將新價格與原因送至 **Python 中間件**，中間件執行以下動作：
    - 修改 `Order Table` 中的 `total_amount`。
    - **自動寫入一筆資料至 `Order_Audit_Log_Table`，將該 PM 的 ID、舊價格、新價格、改價原因鎖死在資料庫中。**
    - 系統向客戶發送「核估完成通知」。
4. 客戶點擊確認，並依照估價進行線下銀行轉帳。
5. 會計 (`Team: finance`) 核對公司帳戶收到款項 $\rightarrow$ 在後台點擊「確認收款」 $\rightarrow$ 訂單狀態變更為 `已付款`（此步驟一樣會由中間件自動觸發一筆 `STATUS_UPDATE` 的日誌留存）。

### 3. 出貨流程
1. 訂單狀態變更為 `已付款` 後，進入後續出貨流程，系統通知 `Team: warehouse` (倉管)。
2. 倉管備貨時，**在後台利用 PDA 或手機掃描器，將該批出貨電池/儲能設備的條碼（如：箱號、電芯序號）逐一掃入，回填至 `Order_Items_Table` 的 `serial_number` 欄位**。
3. 倉管點擊「出貨完成」，狀態變更為 `出貨中`。**Python 中間件在接收到狀態變更時，自動依據當前日期加算保固年限（如 +2 年），自動寫入 `warranty_expiry_date`。**
### 4. 退換貨與保固追溯流程（區分：七天退貨 vs. 兩年後維修）

#### 情況 A：收到貨後「七天內退貨」流程（明確區分：單商品退貨 vs. 整單退貨）
 1. 線上申請分流機制
	客戶於收到貨（總表狀態 `出貨中` 或 `已結案`）起 7 天內，可在 Vue 前端個人中心發起退貨：
	- **模式一：單商品（部分）退貨**
	    - **觸發點：** 客戶在前端勾選該訂單內「特定幾件」設備的 `serial_number`。
	    - **系統動作：** 僅將被勾選的該幾筆明細之 `item_status` 變更為 `退換貨審查中`。訂單總表 `order_status` 仍保持不變（`出貨中` 或 `已結案`）。
	- **模式二：整單商品退貨**
	    - **觸發點：** 客戶在前端直接點擊「全選 / 整單退貨」按鈕。
	    - **系統動作：** 系統自動將該訂單旗下**所有明細**的 `item_status` 一鍵批次變更為 `退換貨審查中`。同時，為了利於後台（PM/會計/倉管）在儀表板上快速篩選高優先級的大型退單，**Python 中間件會同步將訂單總表的 `order_status` 變更為 `待付款` 之外的特殊狀態標記（如後台顯示：整單退貨審查中）**。
 2. 條件審核
	- PM 與倉管收到系統通知。
	- **IF 已拆封/已上架案場使用：** PM 與客戶協商駁回，或轉為一般售後維修流程。
	- **IF 未拆封且外觀完好：** PM 於後台點擊「同意退貨通知」，安排物流收回。
3. 退貨入庫與序號註銷（由倉管實體核對）
	- 倉管收到退回的貨物，不論是部分退還是整單退，**一律利用條碼槍逐一掃描實體產品序號**。
	- 系統會自動核對掃描到的序號是否與明細表的 `serial_number` 一致。
	- 確認無誤後，倉管在後台點擊「退貨入庫確認」，系統自動執行：
	    1. 將該產品庫存（`product_remaining_quantity`）依據實收數量加回。
	    2. 將對應明細的 `item_status` 變更為 `已退貨`。
	    3. 註銷該序號的有效保固。
4. 會計退款與發票分流（核心差異）
	會計（`finance`）收到入庫通知，點擊「退款完成」時，Python 中間件依據退貨範圍進行金流與發票分流處理：
	- **如果是【單商品（部分）退貨】：**
	    - **金流：** 串接綠界 API 執行「部分退刷 / 部分退款」（金額為已退貨明細的 `price_at_purchase` 總和）。
	    - **發票：** 線上呼叫發票 API 開立「電子發票銷貨折讓單」，並透過 Email 寄送折讓證明給客戶。
	    - **總表狀態：** 總表狀態維持 `已結案`，完全不影響其他正常留在案場的商品。
	- **如果是【整單商品退貨】：**
	    - **金流：** 串接綠界 API 執行「全額退刷 / 全額退款」（金額為總表的 `total_amount`）。
	    - **發票：** 線上呼叫發票 API 執行「原電子發票作廢」。
	    - **總表狀態：** 當最後一筆明細也被確認退貨入庫後，中間件自動將訂單總表的 `order_status` 變更為 `已結案`，並在系統備註或 Log 中註記「整單退貨結案」。
#### 情況 B：兩年後壞掉「保固維修與人工抽驗」流程（長期售後）
1. **追溯查驗**：兩年後客戶通知電池壞了，於歷史訂單發起「保固維修申請」。
2. **序號反查**：業務/PM 只要在後台**搜尋該電池上的出廠序號 (`serial_number`)**：
    - 系統便能反向撈出 `Order_Items_Table` 判定當前的 `warranty_expiry_date`（保固到期日）是否過期。
    - 並能回溯至當初的 `Order Table`，查出這批貨當初是送去哪個案場（`shipping_address`）、是由哪位 PM 接洽與改價的。
3. **線下出任務**：確認在保固內，安排技術人員攜帶備品前往客戶案場進行產品修復、或更換新機芯。
4. **售後人工抽驗環節**（防止換上去的備品又有瑕疵）：
    - 技術人員在現場修復完成後，線上或線下進行**人工抽驗/送電測試**。
    - **抽驗有效 (合格)：** PM 於後台手動勾選「抽驗通過」 $\rightarrow$ 客戶於前端 Vue 介面線上簽收 $\rightarrow$ 訂單變更為 `已結案`。
    - **抽驗無效 (不合格)：** PM 於後台點擊「抽驗失敗」 $\rightarrow$ 流程退回重跑，技術人員繼續進行產品重修或重新調度新機。