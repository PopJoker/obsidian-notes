``` javascript
if (targetTable === 'HES_RACK_NEW' || targetTable === 'HES_RACK' || targetTable === 'LES_BCU' || targetTable === 'CAR5S2P12V') 
        {
          // PACK 和 BMS 不做這個動作
          const updateSqlBCU = `
            INSERT INTO ${targetTable} (Serial_Number, storageName, ${columns})
            VALUES (?, ?, ${placeholders})
            ON DUPLICATE KEY UPDATE
              storageName=VALUES(storageName), ${updateSet}, CreateTime=CURRENT_TIMESTAMP
          `;
          try {
            await connection.execute(updateSqlBCU, values);
          //console.log(`bms SQL: ${updateSqlBMS}`);
            console.log(`BCU 寫入成功：${serial_number}/${storageName}`);
          } catch (error) {
            console.error(`BCU 寫入失敗 ${serial_number}/${storageName}`, error);
          }

          // 新增獨立計算值power
          let power = 0;
          
          // 根據不同產品的電壓電流欄位名稱來計算
          if ((targetTable === 'HES_RACK'||targetTable === 'HES_RACK_NEW') && scaledData.RackVoltage && scaledData.RackCurrent) {
              power = scaledData.RackVoltage * scaledData.RackCurrent;
          } else if (targetTable === 'LES_BCU' && scaledData.MaxBatteryVoltage && scaledData.BatteryCurrent) {
              power = scaledData.MaxBatteryVoltage * scaledData.BatteryCurrent;
          } else if (targetTable === 'CAR5S2P12V' && scaledData.BatteryLoVoltage && scaledData.BatteryCurrent) {
              power = scaledData.BatteryLoVoltage * scaledData.BatteryCurrent;
          }

          //確認有無警報
          if (
            targetTable === 'LES_BCU' &&
            !(
              [1, 2, 3, 4, 5, 6].every(i => {
                const lo = scaledData[`LoStatus${i}`]?? 0;
                const hi = scaledData[`HiStatus${i}`]?? 0;
                return (lo === 0 || lo === 12288) && hi === 0;
              })
            )
          ) {
            // LoStatus bit 對應表
            const LoStatusFlags = {
              0x8000: { title: "OC", desc: "電池過充" },
              0x0800: { title: "UTD", desc: "放電時溫度過低" },
              0x0400: { title: "UTC", desc: "充電時溫度過低" },
              0x0200: { title: "OTD", desc: "放電時溫度過高" },
              0x0100: { title: "OTC", desc: "充電時溫度過高" },
              0x0080: { title: "ASCDL", desc: "放電短路已鎖定" },
              0x0040: { title: "ASCD", desc: "放電過程中短路警告" },
              0x0020: { title: "AOLDL", desc: "放電過流已鎖定" },
              0x0010: { title: "AOLD", desc: "放電過程中過流警告" },
              0x0008: { title: "OCD", desc: "放電過流" },
              0x0004: { title: "OCC", desc: "充電過流" },
              0x0002: { title: "COV", desc: "電芯電壓過高" },
              0x0001: { title: "CUV", desc: "電芯電壓過低" }
            };
            // HiStatus bit 對應表
            const HiStatusFlags = {
              0x8000: { title: "OC", desc: "電池過充" },
              0x0800: { title: "UTD", desc: "放電時溫度過低" },
              0x0400: { title: "UTC", desc: "充電時溫度過低" },
              0x0200: { title: "OTD", desc: "放電時溫度過高" },
              0x0100: { title: "OTC", desc: "充電時溫度過高" },
              0x0002: { title: "COV", desc: "電芯電壓過高" },
              0x0001: { title: "CUV", desc: "電芯電壓過低" }
            };
            const logsToInsert = [];
            for (let i = 1; i <= 6; i++) {
              const lo = scaledData[`LoStatus${i}`] ?? 0;
              const hi = scaledData[`HiStatus${i}`] ?? 0;

              for (const [mask, { title, desc }] of Object.entries(LoStatusFlags)) {
                if (lo & mask) logsToInsert.push({ box: i, title, desc });
              }

              for (const [mask, { title, desc }] of Object.entries(HiStatusFlags)) {
                if (hi & mask) logsToInsert.push({ box: i, title, desc });
              }
            }
            await Promise.all(logsToInsert.map(({ box, title, desc }) =>
              insertSystemLog(
                serial_number,
                'Alarm',
                `狀態異常：${title}（第${box}櫃）`,
                desc
              )
            ));
          }
          // 確認 HES 警報
          if (targetTable === 'HES_RACK') {
              const status = scaledData.RackStatus ?? 0; // HES 狀態 flag
              const HESFlags = {
                  0x01: { title: "CUV", desc: "電芯電壓過低" },
                  0x02: { title: "OCC", desc: "充電過流" },
                  0x04: { title: "COV", desc: "電芯電壓過高" },
                  0x08: { title: "OCD", desc: "放電過流" },
                  0x10: { title: "OTC", desc: "充電時溫度過高" },
                  0x20: { title: "OTD", desc: "放電時溫度過高" },
              };

              const logsToInsert = [];

              for (const [mask, { title, desc }] of Object.entries(HESFlags)) {
                  if (status & mask) {
                      logsToInsert.push({
                          box: 1, // HES 只有一個 Rack
                          title,
                          desc
                      });
                  }
              }

              // 批次寫入 SystemLog
              await Promise.all(logsToInsert.map(({ box, title, desc }) =>
                  insertSystemLog(
                      serial_number,
                      'Alarm',
                      `狀態異常：${title}（Rack）`,
                      desc
                  )
              ));
          }

          // 新增寫入 influxdb 資料表，將歷史資料寫入 InfluxDB
          const point = new Point(targetTable)     // 設定 Measurement 名稱
              .tag('Serial_Number', serial_number) // 設定 Tag (索引欄位)
              .tag('storageName', storageName);    // 設定 Tag (索引欄位)

          // 迴圈遍歷所有 scaledData，將其加入為 Field (數值欄位)
          for (const [key, value] of Object.entries(scaledData)) {
              if (value !== null && value !== undefined) {
                  point.floatField(key, value); // 使用 floatField 處理數值
              }
          }
          // 額外寫入 Power 欄位
          point.floatField('Power', power);

          // 寫入資料點
          writeApi.writePoint(point);
        }
```