
本文件針對 `GU36_RACK` 設備，說明如何將現有的 Modbus RTU JSON 規範轉換並套用於 CANbus (CAN 2.0B) 協議。

---

## 1. 協議核心差異分析

| 特性 | Modbus RTU (現有) | CANbus (目標) |
| --- | --- | --- |
| **定址方式** | 暫存器地址 (Register Address) | CAN ID (Rack ID + Function + Info Code) |
| **數據長度** | 16-bit 暫存器為單位 | 8-byte 數據幀 (Data Frame) |
| **通訊機制** | 主從式問答 (Request-Response) | 請求式觸發 + 多幀回應 (Multi-frame Response) |
| **數據類型** | uint16, int32 (2 regs) | **uint24**, uint16, int8, bit-field |

---

## 2. CANbus ID 組成邏輯

根據協議文檔，CAN ID (Extended 29-bit) 的組成如下：

- **Rack Core-ID**: Bit 18:12 (由撥碼開關決定，0x00~0x3F)

- **Function Code**: Bit 11:7 (0x0C: 訪問, 0x0B: 回應)

- **Info Code**: Bit 6:0 (0x00~0x7F)

轉換公式範例：若 Rack ID = 1：

- **Rack 資訊請求 ID**: `(1 << 12) | (0x0C << 7) | 0x02` = `0x1602`

- **Pack N 資訊請求 ID**: `(1 << 12) | (0x0C << 7) | (N + 0x10)`

---

## 3. 建議的 CANbus JSON 規範結構

為了讓 Web Serial API 能夠同時處理兩種協議，建議擴展現有的 JSON 格式，引入 `can_id` 與 `frame_offset`：

### 3.1 設備配置文件 (Device Profile)

```json
{
    "device_profile": {
        "device_type": "GU36_RACK",
        "protocol": "CANBUS",
        "can_config": {
            "baud_rate": 500000,
            "id_type": "extended",
            "rack_id": 1
        }
    }
}
```

### 3.2 輪詢區塊 (Polling Blocks)

CANbus 需要先發送一個「請求幀」（如 `0xA0...`），隨後接收一系列以 `0xB0`, `0xB1` 開頭的回應幀。

```json
"polling_blocks": [
    {
        "name": "rack_info",
        "request_id": "0x1602",
        "request_data": "A010250100000000",
        "expected_frames": ["0xB0", "0xB1", "0xB2", "0xB3", "0xB4", "0xB5", "0xB6"],
        "delay_ms": 200
    }
]
```

### 3.3 上行數據映射 (Uplink Mapping)

由於 CAN 數據是按 Byte 排列的，我們需要指定 **Frame ID** (首字節) 與 **Byte Offset**。

| Modbus 名稱 | Modbus 地址 | CAN 幀首字節 | CAN 字節位置 | 數據類型 |
| --- | --- | --- | --- | --- |
| **SoC** | 0x0004 | 0xB0 | Byte 2 | uint8 |
| **Rack Voltage** | 0x0000 | 0xB1 | Byte 2-4 | **uint24** |
| **Rack Current** | 0x0002 | 0xB2 | Byte 2-4 | **int24** |

**JSON 範例：**

```json
"uplink": {
    "rack_voltage": {
        "frame_id": "0xB1",
        "offset": 1,
        "data_type": "uint24",
        "scale": 0.001,
        "unit": "V"
    },
    "soc": {
        "frame_id": "0xB0",
        "offset": 1,
        "data_type": "uint8",
        "scale": 1.0,
        "unit": "%"
    }
}
```

---

## 4. 特殊數據處理說明

### 4.1 24-bit 數據解析

CANbus 協議中頻繁使用 24-bit (3 bytes) 表示電壓與電流，這在 JavaScript 中需要手動處理：

```javascript
// 讀取 24-bit 無符號整數 (Little Endian)
function readUint24(data, offset) {
    return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16);
}
```

### 4.2 多幀狀態 (Flags) 解析

Modbus 將狀態放在 `0x000A`，而 CANbus 將 Flag 分散在 `0xB3` 到 `0xB4` 幀中。

- **Flag 1 (Status#2)**: 對應 `0xB3` 的 Byte 2。

- **解決方式**：在 JSON 中定義 `bit_mask` 來提取特定告警。

---

## 5. Web Serial API 實作建議

1. **SLCAN 封裝**：Web Serial API 讀取的是串口流，需先將其轉換為 CAN 幀。
  - 發送請求：`t16028A010250100000000\r`
  - 接收回應：`t15828B1AABBCC...` (解析 `B1` 後的數據)

1. **超時處理**：CANbus 多幀回應可能因總線負載延遲，建議設定 500ms 的接收窗口以蒐集所有 `0xB0~0xB7` 幀後再統一解析。

2. **過濾器設定**：為了效能，應在硬體層級（若支援）或軟體層級過濾僅屬於該 `Rack Core-ID` 的回應 ID (`0x1580~0x15FF`)。

---

## 6. 結論

您的 Modbus JSON 規範可以透過**增加 ****`frame_id`**** 與 ****`offset`**** 欄位**完美適配 CANbus。核心邏輯在於將 Modbus 的「地址偏移」改為 CAN 的「幀偏移 + 字節偏移」。建議在 Web 端建立一個 `ProtocolAdapter` 類別，根據 `protocol` 欄位切換解析邏輯。