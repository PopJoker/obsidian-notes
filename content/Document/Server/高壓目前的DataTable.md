# HES_RACK
- %1/HES/Storage1/Rack

| **欄位名稱 (Field)**             | **資料型態 (Type)**      | **允許 NULL** | **鍵值 (Key)** | **預設值 (Default)**     | **說明與用途**          |
| ---------------------------- | -------------------- | ----------- | ------------ | --------------------- | ------------------ |
| **Serial_Number**            | varchar(100)         | **NO**      | **PRI**      | _NULL_                | 序列號（主鍵）            |
| **PackVoltage**              | decimal(10,3)        | YES         |              | _NULL_                | Pack 總電壓 (V)       |
| **MaxCellVoltage**           | decimal(10,3)        | YES         |              | _NULL_                | 最高單體電壓 (V)         |
| **MinCellVoltage**           | decimal(10,3)        | YES         |              | _NULL_                | 最低單體電壓 (V)         |
| **CellVoltageDelta**         | decimal(10,3)        | YES         |              | _NULL_                | 單體壓差 (V)           |
| **CellVoltage1 ~ 24**        | decimal(10,3)        | YES         |              | _NULL_                | 第 1 至 24 芯單體電壓 (V) |
| **Low_Cell1_Temperature**    | decimal(5,2)         | YES         |              | _NULL_                | 低溫監測點 1 溫度 (°C)    |
| **Low_Cell2_Temperature**    | decimal(5,2)         | YES         |              | _NULL_                | 低溫監測點 2 溫度 (°C)    |
| **Low_Cell3_Temperature**    | decimal(5,2)         | YES         |              | _NULL_                | 低溫監測點 3 溫度 (°C)    |
| **Hi_Cell5_Temperature**     | decimal(5,2)         | YES         |              | _NULL_                | 高溫監測點 5 溫度 (°C)    |
| **Hi_Cell6_Temperature**     | decimal(5,2)         | YES         |              | _NULL_                | 高溫監測點 6 溫度 (°C)    |
| **Hi_Cell7_Temperature**     | decimal(5,2)         | YES         |              | _NULL_                | 高溫監測點 7 溫度 (°C)    |
| **EnvironmentTemperature**   | decimal(5,2)         | YES         |              | _NULL_                | 環境溫度 (°C)          |
| **B_PLUS_Temperature**       | decimal(5,2)         | YES         |              | _NULL_                | 正極柱 (B+) 溫度 (°C)   |
| **B_MINUS_Temperature**      | decimal(5,2)         | YES         |              | _NULL_                | 負極柱 (B-) 溫度 (°C)   |
| **Cell4_Temperature**        | decimal(5,2)         | YES         |              | _NULL_                | 單體 4 點位溫度 (°C)     |
| **FuseTemperature**          | decimal(5,2)         | YES         |              | _NULL_                | 保險絲溫度 (°C)         |
| **BoardTypeID**              | smallint(5) unsigned | YES         |              | _NULL_                | 控制板型號 ID           |
| **PackPassiveBalanceStatus** | int(10) unsigned     | YES         |              | _NULL_                | Pack 被動平衡狀態旗標      |
| **CellBalanceStatus**        | bigint(20) unsigned  | YES         |              | _NULL_                | 單體平衡狀態旗標 (Bitmask) |
| **MaxCellTemperature**       | decimal(5,2)         | YES         |              | _NULL_                | 最高單體溫度 (°C)        |
| **MinCellTemperature**       | decimal(5,2)         | YES         |              | _NULL_                | 最低單體溫度 (°C)        |
| **storageName**              | varchar(50)          | YES         |              | _NULL_                | 案場 / 儲能系統識別名稱      |
| **PACKID**                   | varchar(50)          | **NO**      | **PRI**      | _NULL_                | Pack 唯一識別碼（主鍵）     |
| **CreateTime**               | timestamp            | YES         |              | `current_timestamp()` | 資料建立時間             |

---
# HES_PACK
- %1/HES/Storage1/Pack
  {
  "ID1":{
  ...
  },
  "ID2":{
  ...
  },...
  }

| **欄位名稱 (Field)**             | **資料型態 (Type)**      | **允許 NULL** | **鍵值 (Key)** | **預設值 (Default)**     | **說明與用途**          |
| ---------------------------- | -------------------- | ----------- | ------------ | --------------------- | ------------------ |
| **Serial_Number**            | varchar(100)         | **NO**      | **PRI**      | _NULL_                | 序列號（主鍵）            |
| **PackVoltage**              | decimal(10,3)        | YES         |              | _NULL_                | Pack 總電壓 (V)       |
| **MaxCellVoltage**           | decimal(10,3)        | YES         |              | _NULL_                | 最高單體電壓 (V)         |
| **MinCellVoltage**           | decimal(10,3)        | YES         |              | _NULL_                | 最低單體電壓 (V)         |
| **CellVoltageDelta**         | decimal(10,3)        | YES         |              | _NULL_                | 單體壓差 (V)           |
| **CellVoltage1 ~ 24**        | decimal(10,3)        | YES         |              | _NULL_                | 第 1 至 24 芯單體電壓 (V) |
| **Low_Cell1_Temperature**    | decimal(5,2)         | YES         |              | _NULL_                | 低溫監測點 1 溫度 (°C)    |
| **Low_Cell2_Temperature**    | decimal(5,2)         | YES         |              | _NULL_                | 低溫監測點 2 溫度 (°C)    |
| **Low_Cell3_Temperature**    | decimal(5,2)         | YES         |              | _NULL_                | 低溫監測點 3 溫度 (°C)    |
| **Hi_Cell5_Temperature**     | decimal(5,2)         | YES         |              | _NULL_                | 高溫監測點 5 溫度 (°C)    |
| **Hi_Cell6_Temperature**     | decimal(5,2)         | YES         |              | _NULL_                | 高溫監測點 6 溫度 (°C)    |
| **Hi_Cell7_Temperature**     | decimal(5,2)         | YES         |              | _NULL_                | 高溫監測點 7 溫度 (°C)    |
| **EnvironmentTemperature**   | decimal(5,2)         | YES         |              | _NULL_                | 環境溫度 (°C)          |
| **B_PLUS_Temperature**       | decimal(5,2)         | YES         |              | _NULL_                | 正極柱 (B+) 溫度 (°C)   |
| **B_MINUS_Temperature**      | decimal(5,2)         | YES         |              | _NULL_                | 負極柱 (B-) 溫度 (°C)   |
| **Cell4_Temperature**        | decimal(5,2)         | YES         |              | _NULL_                | 單體 4 點位溫度 (°C)     |
| **FuseTemperature**          | decimal(5,2)         | YES         |              | _NULL_                | 保險絲溫度 (°C)         |
| **BoardTypeID**              | smallint(5) unsigned | YES         |              | _NULL_                | 控制板型號 ID           |
| **PackPassiveBalanceStatus** | int(10) unsigned     | YES         |              | _NULL_                | Pack 被動平衡狀態旗標      |
| **CellBalanceStatus**        | bigint(20) unsigned  | YES         |              | _NULL_                | 單體平衡狀態旗標 (Bitmask) |
| **MaxCellTemperature**       | decimal(5,2)         | YES         |              | _NULL_                | 最高單體溫度 (°C)        |
| **MinCellTemperature**       | decimal(5,2)         | YES         |              | _NULL_                | 最低單體溫度 (°C)        |
| **storageName**              | varchar(50)          | YES         |              | _NULL_                | 案場 / 儲能系統識別名稱      |
| **PACKID**                   | varchar(50)          | **NO**      | **PRI**      | _NULL_                | Pack 唯一識別碼（主鍵）     |
| **CreateTime**               | timestamp            | YES         |              | `current_timestamp()` | 資料建立時間             |

---
