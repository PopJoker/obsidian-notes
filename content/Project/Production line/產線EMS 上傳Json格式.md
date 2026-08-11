( API：10.13.29.10:3000/api/upload ) 後續看要不要再換
payload 基本為開放模板，應遵循以下條件
- stage 對應 measure 
- tag 對應 orderid 等代表性tag ( 須注意不要濫用，利用tag多項查詢很塞記憶體 )
- tagfield 對應 barcode 等字串格式之欄位 ( 為多項判斷之欄位，相較tag會比較不占記憶體 )
- else 只要其他都會視為數值紀錄 ( 須注意不能塞入字串，字串必須塞入 tagfield 或當作 tag )
---
### DAQ
``` json
var payload = new Dictionary<string, object>
//為第一版軟體 用舊版原生C#Net 後續有在NuGet找到一個套件 比較好定義 但只要能開發都是好格式
{
    ["stage"] = "daq970cellmeasure",
    ["tag"] = new Dictionary<string, object>
    {
        ["orderId"] = AppContext.WorkOrderId
    },
    ["tagfield"] = new Dictionary<string, object>
    {
        ["corepackBarcode"] = (zoneBarcodes.ContainsKey(z) ? zoneBarcodes[z] : $"Zone{z}_{DateTime.Now:HHmmss}")?.ToString(),
        ["Result"] = recentResultList[uploadIndex][z]
    },
    ["voltagemaxthread"] = double.Parse(txtVoltageMax.Text),
    ["voltageminthread"] = double.Parse(txtVoltageMin.Text),
    ["voltagediffthread"] = double.Parse(txtVoltageDiff.Text),
    ["tempmaxthread"] = double.Parse(txtTempMax.Text),
    ["tempminthread"] = double.Parse(txtTempMin.Text),
};
```
---
### Hioki
``` json
var payloadObject = new
{
    stage = "Hioki_Scan",

    tagfield = new
    {
        device = fakeMode ? "BT3563A_FAKE" : "BT3563A",
        corepackBarcode = barcode
        Result =
    },

    voltage = volt,
    resistance = res,
    voltagemaxthread =
    voltageminthread =
    resistancemaxthread =
    resistanceminthread =

    TimeStamp = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ssK")
};
```
---
### CellSort
``` json
var payloadObject = new
{
    stage = "CellSort",

    tagfield = new
    {
        corepackBarcode = corepackBarcode,
        cellBarcode = cellBarcode,
    },

    voltage = volt,
    resistance = res,
    date = date,
    deltav = deltav,
    deltaday = deltaday,
    voltagemaxthread = voltageLimit,
    resistancemaxthread = irlimit,
    daymaxthread = daylimit
};
```
---
### LearningMachine
``` json
var payloadObject = new
{
    stage = "LearningMachine",

    tagfield = new
    {
        corepackBarcode = corepackBarcode,
        cellBarcode = cellBarcode,
        packBarcode = packBarcode,
    },
	fileName = fileName
	AH = AH,
	deltaV(mV)=deltaV,
	V1(mV)=V1,
	V2(mV)=V2,
	... //後續省略 格式目前定義 最多到V16
};
```
### CombineAll
``` json
var payloadObject = new
{
    stage = "Combine-All",
    tagfield = new
    {
        corepackBarcode = corepackBarcode,
        cellBarcode = cellBarcode,
        packBarcode = packBarcode,
        ... //後續省略 根據後面製成可以自由新增刪減
    },
};
```
---