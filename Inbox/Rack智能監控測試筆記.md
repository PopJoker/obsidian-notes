2026-03-27 11:01:07 [INFO] Rack 1 ACTIVE_FIRST mode started

2026-03-27 11:18:32 [INFO] Rack 1 ACTIVE Done,delta_v=0.007

充過頭的現象：
	查程式LOG有發送關閉充電命令，並有清除系統的充電Pack，但進入被動後有發現還是有充電行為，待查。
目前應對：
	1. 待副理更新後能收到MBU資訊後，去檢測有無充電行為與是否應該充電。
	2. 檢查在非充電期間每30秒壓差有無超過 50mV

15:02:06 Rack 3 PACK DIFF (ΔV) 0.711

15:02:06 Rack 3 PACK DIFF (ΔV) 0.599
