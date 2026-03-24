
  
# SPM-3 電表 RS-485 通訊 (讀取寄存器)  

[[#省流區域：一次讀取主要寄存器]]

---

## 1. 通訊設定  
  
- **介面**：RS-485 雙線差分    
- **協議**：Modbus RTU    
- **波特率**：4800–57600 bps    
- **站號**：1–255    
- **格式**：N,8,1（無校驗位、8 位資料、1 停止位，依設備設定）    
  
---  
  
## 2. Modbus RTU 封包格式  
  
### 2.1 請求 (Request)  

``` RS-485
[Slave Addr][Function Code][Data Addr Hi][Data Addr Lo][Qty Hi][Qty Lo][CRC Lo][CRC Hi]
```
  
- **Slave Addr**：電表 Modbus 位址 (1 byte)    
- **Function Code**：功能碼 (0x03 / 0x04)    
- **Data Addr**：欲讀寄存器位址 (2 bytes)    
- **Qty**：讀取寄存器數量 (2 bytes)    
- **CRC**：CRC16 校驗碼 (2 bytes)    
  
### 2.2 回覆 (Response)  
  
正常回覆：  

``` RS-485
[Slave Addr][Function Code][Byte Count][Data…][CRC Lo][CRC Hi]
```

  
異常回覆：  

``` RS-485
[[Slave Addr][Function Code + 0x80][Exception Code][CRC Lo][CRC Hi]
```

---  
  
## 3. 常用讀取功能碼  
  
| 功能碼  | 動作                  |
| ---- | ------------------- |
| 0x03 | 讀 Holding Registers |
| 0x04 | 讀 Input Registers   |
  
> SPM-3 多用 0x03  讀取量測值和狀態，少用寫入。  
  
---  
  
## 4. 常用寄存器範例  
  
### 4.1 輸入寄存器 (Input Registers, 0x04)  
  
| Modbus Register | Hex Addr | 參數 | 格式 |  
|----------------|----------|------|------|  
| 34155           | 0x103A   | Demand_kW_Pre_Period | DWord Float |  
| 34157           | 0x103C   | Demand_kW             | DWord Float |  
| 34159           | 0x103E   | Demand_Remain_Time    | UInt |  
| 34160           | 0x103F   | V_Unbalance_Rate      | DWord Float |  
| 34162           | 0x1041   | I_Unbalance_Rate      | DWord Float |  
| 34184           | 0x1057   | Alarm Flag            | Word |  
| 34185           | 0x1058   | THD_Va                | DWord Float |  
  
> DWord Float 表示 IEEE-754 32 位浮點數（2 個寄存器）    
> Alarm Flag 為單一 Word 位元 Flag  
  
---  
  
## 5. 讀取三相電壓範例  
  
假設 Meter Address = 0x0F，讀寄存器 0x1090 (Va, 32-bit Float)：  
  
**請求**  

0F 04 10 90 00 02 CRC CRC

**回覆 (正常)**  

0F 04 04 <4 bytes Data> CRC CRC

- 4 bytes Data 為浮點數 Va    
- CRC 校驗必須正確計算    
  
---  
## 6. CRC16 計算  

Modbus RTU 使用 **CRC16 (Polynomial 0xA001)**    
- 發送前計算並附加於封包末端    
- 接收時驗證 CRC 正確性  
---  
## 7. 錯誤回覆 (Exception Response)  
  
| Exception Code | 意義 |  
|----------------|------|  
| 01             | Illegal Function |  
| 02             | Illegal Data Address |  
| 03             | Illegal Data Value |  
| 04             | Slave Device Failure |  

``` RS-485
[Slave Addr][Function Code+0x80][Exception Code][CRC Lo][CRC Hi]
```

---  
## 省流區域：一次讀取主要寄存器

假設 Meter Address = 0x01，要讀主要量測數據（0x103A → 0x1058）：

**請求封包**：  
`01 04 10 00 00 5A CRC_LO CRC_HI`

- 01：Meter Address
- 04：讀 Input Registers
- 10 00：起始位址 0x1000
- 00 5A：讀 90 個寄存器
- CRC_LO / CRC_HI：CRC16 校驗

**回覆封包格式**：  
`01 04 B4 <180 bytes Data> CRC_LO CRC_HI`

- B4 = 180 bytes = 90 寄存器 × 2 bytes
- Data 依序對應各寄存器

---

## 解析方式

將回覆的 74 bytes 依照寄存器順序解析：

| 寄存器範圍         | 參數                                   | 格式          | Data Bytes 範圍 | 中文註解                        |
| ------------- | ------------------------------------ | ----------- | ------------- | --------------------------- |
| 0x1000-0x1001 | Vln_a                                | DWord Float | Byte 0-3      | A 相線電壓                      |
| 0x1002-0x1003 | Vln_b                                | DWord Float | Byte 4-7      | B 相線電壓                      |
| 0x1004-0x1005 | Vln_c                                | DWord Float | Byte 8-11     | C 相線電壓                      |
| 0x1006-0x1007 | Vln_avg                              | DWord Float | Byte 12-15    | 三相線電壓平均值                    |
| 0x1008-0x1009 | Vll_ab                               | DWord Float | Byte 16-19    | AB 相間電壓                     |
| 0x100A-0x100B | Vll_bc                               | DWord Float | Byte 20-23    | BC 相間電壓                     |
| 0x100C-0x100D | Vll_ca                               | DWord Float | Byte 24-27    | CA 相間電壓                     |
| 0x100E-0x100F | Vll_avg                              | DWord Float | Byte 28-31    | 三相相間電壓平均值                   |
| 0x1010-0x1011 | I_a                                  | DWord Float | Byte 32-35    | A 相電流                       |
| 0x1012-0x1013 | I_b                                  | DWord Float | Byte 36-39    | B 相電流                       |
| 0x1014-0x1015 | I_c                                  | DWord Float | Byte 40-43    | C 相電流                       |
| 0x1016-0x1017 | I_avg                                | DWord Float | Byte 44-47    | 三相電流平均值                     |
| 0x1018-0x1019 | Frequency                            | DWord Float | Byte 48-51    | 電源頻率                        |
| 0x101A-0x101B | kW_a                                 | DWord Float | Byte 52-55    | A 相有功功率                     |
| 0x101C-0x101D | kW_b                                 | DWord Float | Byte 56-59    | B 相有功功率                     |
| 0x101E-0x101F | kW_c                                 | DWord Float | Byte 60-63    | C 相有功功率                     |
| 0x1020-0x1021 | kW_tot                               | DWord Float | Byte 64-67    | 三相總有功功率                     |
| 0x1022-0x1023 | kvar_a                               | DWord Float | Byte 68-71    | A 相無功功率                     |
| 0x1024-0x1025 | kvar_b                               | DWord Float | Byte 72-75    | B 相無功功率                     |
| 0x1026-0x1027 | kvar_c                               | DWord Float | Byte 76-79    | C 相無功功率                     |
| 0x1028-0x1029 | kvar_tot                             | DWord Float | Byte 80-83    | 三相總無功功率                     |
| 0x102A-0x102B | kVA_a                                | DWord Float | Byte 84-87    | A 相視在功率                     |
| 0x102C-0x102D | kVA_b                                | DWord Float | Byte 88-91    | B 相視在功率                     |
| 0x102E-0x102F | kVA_c                                | DWord Float | Byte 92-95    | C 相視在功率                     |
| 0x1030-0x1031 | kVA_tot                              | DWord Float | Byte 96-99    | 三相總視在功率                     |
| 0x1032-0x1033 | PF                                   | DWord Float | Byte 100-103  | 功率因數                        |
| 0x1034-0x1035 | kWh                                  | DWord Float | Byte 104-107  | 有功累計電能                      |
| 0x1036-0x1037 | kvarh                                | DWord Float | Byte 108-111  | 無功累計電能                      |
| 0x1038-0x1039 | kVAh                                 | DWord Float | Byte 112-115  | 視在累計電能                      |
| 0x103A-0x103B | Demand_kW_Pre_Period                 | DWord Float | Byte 116-119  | 前週期需量有功功率                   |
| 0x103C-0x103D | Demand_kW                            | DWord Float | Byte 120-123  | 當前需量有功功率                    |
| 0x103E        | Demand_Remain_Time                   | UInt        | Byte 124-125  | 需量剩餘時間（秒）                   |
| 0x103F-0x1040 | V_Unbalance_Rate                     | DWord Float | Byte 126-129  | 電壓不平衡率 (%)                  |
| 0x1041-0x1042 | I_Unbalance_Rate                     | DWord Float | Byte 130-133  | 電流不平衡率 (%)                  |
| 0x1043-0x1044 | Va_Eligibility_Rate                  | DWord Float | Byte 134-137  | A 相電壓合格率 (%)                |
| 0x1045-0x1046 | Vb_Eligibility_Rate                  | DWord Float | Byte 138-141  | B 相電壓合格率 (%)                |
| 0x1047-0x1048 | Vc_Eligibility_Rate                  | DWord Float | Byte 142-145  | C 相電壓合格率 (%)                |
| 0x1049-0x104A | Vavg_Eligibility_Rate                | DWord Float | Byte 146-149  | 三相平均電壓合格率 (%)               |
| 0x104B-0x104C | Va Eligible Running Hour             | Uint32      | Byte 150-153  | A 相電壓合格運行時數                 |
| 0x104D-0x104E | Vb Eligible Running Hour             | Uint32      | Byte 154-157  | B 相電壓合格運行時數                 |
| 0x104F-0x1050 | Vc Eligible Running Hour             | Uint32      | Byte 158-161  | C 相電壓合格運行時數                 |
| 0x1051-0x1052 | V Eligible total check Running Hours | Uint32      | Byte 162-165  | 電壓合格總判斷積時                   |
| 0x1053-0x1054 | Load Running Hour                    | Uint32      | Byte 166-169  | 系統負載運行積時                    |
| 0x1055-0x1056 | Meter Running Hour                   | Uint32      | Byte 170-173  | 儀表運轉積時                      |
| 0x1057        | Alarm Flag                           | Word        | Byte 174-175  | 警報狀態 Flag，每個 bit 對應不同警告[^1] |
| 0x1058-0x1059 | THD_Va                               | DWord Float | Byte 176-179  | A 相電壓諧波總失真率 (%)             |


> DWord Float = 4 bytes (2 個寄存器)  
> UInt / Word = 2 bytes

**解析步驟**：

1. 先去掉 Slave Addr、Function Code、Byte Count
2. 拆每個寄存器對應的 byte 長度
3. DWord Float → IEEE-754 32-bit float
4. UInt / Word → 16-bit 整數
5. Alarm Flag → 每個 bit 對應警告狀態
---
## 參考  
  
- SPM-3 使用手冊片段 ([isom.com.tw PDF](https://www.isom.com.tw/pdf/81114/SPM-3.pdf?utm_source=chatgpt.com))  
- Modbus RTU 通訊標準

[^1]:       bit 0：過壓 Over Voltage  
	bit 1：過流 Over Current  
	bit 2：過頻 Over Frequency  
	bit 3：需量過載 Over Demand  
	bit 4：欠壓 Under Voltage  
	bit 5：欠流 Under Current  
	bit 6：欠頻 Under Frequency  
	bit 7：保留 / 未使用  
	bit 8-15：保留 / 未使用
