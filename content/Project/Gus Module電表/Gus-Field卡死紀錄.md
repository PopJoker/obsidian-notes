### 原始LOG 紀錄與判斷
1. 記錄
	09/13(日) 10:03當下現場情況為無法直接連線並且連用Lan打IP都不通，直接拔掉後進去發現紀錄只到09/13(日) 14:10，後續的LOG為拔下後帶回辦公室重新插上後的啟動紀錄，中間應出現的09/14(一) 09:00上班開機就沒出現。
2. 重點LOG判斷
	如上所示，確定09/13(日)他們開電後14:10後有關電，可能是關電導致內部有毀損下次開機才無法正常運作，且可以確定的是09/14(一)的狀況為綠燈無閃爍寫入，TailScale沒上線且利用Lan進行Ping確認也無果，可斷定為死機。
	
	09/14(一)LOG記錄部分還保留上09/13(日)是因為中間都無寫入，並且樹梅派預設會存取最後幾筆，但開機紀錄或更之前的LOG都因無持久性LOG導致無法更好的釐清狀況。
	
	為避免下次毀損先啟動素梅派內的WatechDog與持久性LOG，並將LOG紀錄限制於500M，避免發生且發生後至少可以從樹梅派的系統紀錄查看之前情況。 ^2d4efa
``` bash
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.929334917+08:00" level=info msg="skip loading plugin" error="lstat /var/lib/containerd/io.containerd.snapshotter.v1.zfs: no such file or directory: skip plugin" id=io.containerd.snapshotter.v1.zfs type=io.containerd.snapshotter.v1
Sep 14 10:25:21 gus-field tailscaled[1145]: health(warnable=warming-up): ok
```
	
3. 以下為最後撈得出09/13(日)的所有資料
``` bash
Sep 13 14:10:19 gus-field kernel: Block layer SCSI generic (bsg) driver version 0.4 loaded (major 247)
Sep 13 14:10:23 gus-field kernel: Bluetooth: HCI socket layer initialized
Sep 13 14:10:23 gus-field kernel: Bluetooth: L2CAP socket layer initialized
Sep 13 14:10:23 gus-field kernel: Bluetooth: SCO socket layer initialized
Sep 13 14:10:34 gus-field systemd[1]: Starting docker.socket - Docker Socket for the API...
Sep 13 14:10:34 gus-field systemd[1]: Listening on docker.socket - Docker Socket for the API.
Sep 13 14:10:36 gus-field kernel: Bluetooth: BNEP socket layer initialized
Sep 13 14:10:37 gus-field kernel: Bluetooth: RFCOMM TTY layer initialized
Sep 13 14:10:37 gus-field kernel: Bluetooth: RFCOMM socket layer initialized
Sep 13 14:10:42 gus-field systemd[1]: Starting containerd.service - containerd container runtime...
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.014766417+08:00" level=info msg="starting containerd" revision=77c84241c7cbdd9b4eca2591793e3d4f4317c590 version=v2.2.3
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.363565065+08:00" level=info msg="loading plugin" id=io.containerd.content.v1.content type=io.containerd.content.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.516088528+08:00" level=info msg="loading plugin" id=io.containerd.image-verifier.v1.bindir type=io.containerd.image-verifier.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.516130862+08:00" level=info msg="loading plugin" id=io.containerd.internal.v1.opt type=io.containerd.internal.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.581155899+08:00" level=info msg="loading plugin" id=io.containerd.warning.v1.deprecations type=io.containerd.warning.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.581184102+08:00" level=info msg="loading plugin" id=io.containerd.mount-handler.v1.erofs type=io.containerd.mount-handler.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.581198806+08:00" level=info msg="loading plugin" id=io.containerd.snapshotter.v1.blockfile type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609020102+08:00" level=info msg="skip loading plugin" error="no scratch file generator: skip plugin" id=io.containerd.snapshotter.v1.blockfile type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609037250+08:00" level=info msg="loading plugin" id=io.containerd.snapshotter.v1.btrfs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609226158+08:00" level=info msg="skip loading plugin" error="path /var/lib/containerd/io.containerd.snapshotter.v1.btrfs (ext4) must be a btrfs filesystem to be used with the btrfs snapshotter: skip plugin" id=io.containerd.snapshotter.v1.btrfs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609242936+08:00" level=info msg="loading plugin" id=io.containerd.snapshotter.v1.devmapper type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609255343+08:00" level=info msg="skip loading plugin" error="devmapper not configured: skip plugin" id=io.containerd.snapshotter.v1.devmapper type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609264676+08:00" level=info msg="loading plugin" id=io.containerd.snapshotter.v1.erofs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.824347806+08:00" level=info msg="skip loading plugin" error="EROFS unsupported, please `modprobe erofs`: skip plugin" id=io.containerd.snapshotter.v1.erofs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.824384102+08:00" level=info msg="loading plugin" id=io.containerd.snapshotter.v1.native type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.872626361+08:00" level=info msg="loading plugin" id=io.containerd.snapshotter.v1.overlayfs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.929278510+08:00" level=info msg="loading plugin" id=io.containerd.snapshotter.v1.zfs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.929334917+08:00" level=info msg="skip loading plugin" error="lstat /var/lib/containerd/io.containerd.snapshotter.v1.zfs: no such file or directory: skip plugin" id=io.containerd.snapshotter.v1.zfs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.929350065+08:00" level=info msg="loading plugin" id=io.containerd.event.v1.exchange type=io.containerd.event.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.929376361+08:00" level=info msg="loading plugin" id=io.containerd.monitor.task.v1.cgroups type=io.containerd.monitor.task.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.929677176+08:00" level=info msg="loading plugin" id=io.containerd.metadata.v1.bolt type=io.containerd.metadata.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.929711176+08:00" level=info msg="metadata content store policy set" policy=shared
```
---
### 判斷卡死 需做系統看門狗 -260914 10:35
``` bash
sudo nano /boot/firmware/config.txt
	dtparam=watchdog=on
sudo apt-get update && sudo apt-get install watchdog -y
sudo nano /etc/watchdog.conf
	watchdog-device = /dev/watchdog 
	watchdog-timeout = 60
	max-load-1 = 24
sudo systemctl enable --now watchdog
```

---
### 加入持久化 LOG 方便下次查詢原因 -260914 10:40
``` bash
sudo nano /etc/systemd/journald.conf
	SystemMaxUse=500M #先設定500M後續不夠再新增
sudo systemctl restart systemd-journald
```
