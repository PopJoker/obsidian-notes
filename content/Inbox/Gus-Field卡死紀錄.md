``` bash
rasp@gus-field:~ $ sudo journalctl -b | grep -iE "fail|error|warn"
Sep 13 14:10:20 gus-field rpi-resize-swap-file[411]: mkswap: /var/swap: warning: wiping old swap signature.
Sep 13 14:10:20 gus-field rpi-resize-swap-file[411]: mkswap: /var/swap: warning: wiping old swap signature.
Sep 13 14:10:26 gus-field blkmapd[674]: open pipe file /run/rpc_pipefs/nfs/blocklayout failed: No such file or directory
Sep 13 14:10:34 gus-field alsactl[702]: alsa-lib main.c:1554:(snd_use_case_mgr_open) error: failed to import hw:0 use case configuration -2
Sep 13 14:10:34 gus-field alsactl[702]: alsa-lib main.c:1554:(snd_use_case_mgr_open) error: failed to import hw:1 use case configuration -2
Sep 13 14:10:38 gus-field polkitd[829]: Error opening rules directory: Error opening directory “/run/polkit-1/rules.d”: No such file or directory (g-file-error-quark, 4)
Sep 13 14:10:38 gus-field polkitd[829]: Error opening rules directory: Error opening directory “/usr/local/share/polkit-1/rules.d”: No such file or directory (g-file-error-quark, 4)
Sep 13 14:10:42 gus-field NetworkManager[819]: <info>  [1789279842.7073] failed to open /run/network/ifstate
Sep 13 14:10:43 gus-field NetworkManager[819]: <warn>  [1789279843.9372] device (wlan0): wifi-scan: active scanning for networks due to profiles with wifi.hidden=yes. This makes you trackable
Sep 13 14:10:46 gus-field wpa_supplicant[820]: bgscan simple: Failed to enable signal strength monitoring
Sep 13 14:10:50 gus-field tailscaled[1145]: TPM: error opening: stat /dev/tpmrm0: no such file or directory
Sep 13 14:10:50 gus-field tailscaled[1145]: dns: resolvedIsActuallyResolver error: resolv.conf doesn't point to systemd-resolved; points to [168.95.1.1 8.8.8.8]
Sep 13 14:10:50 gus-field tailscaled[1145]: router: enumerating tailscale0 addresses for cleanup failed: failed to look up link "tailscale0": Link not found
Sep 13 14:10:51 gus-field lightdm[1185]: Failed to write utmpx: No such file or directory
Sep 13 14:10:51 gus-field tailscaled[1145]: dns: resolvedIsActuallyResolver error: resolv.conf doesn't point to systemd-resolved; points to [168.95.1.1 8.8.8.8]
Sep 13 14:10:52 gus-field tailscaled[1145]: health(warnable=warming-up): error: Tailscale is starting. Please wait.
Sep 13 14:10:53 gus-field pipewire-pulse[1265]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:53 gus-field pipewire[1258]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:53 gus-field pipewire[1258]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:53 gus-field pipewire[1258]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:53 gus-field pipewire-pulse[1265]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:53 gus-field wireplumber[1263]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:53 gus-field pipewire-pulse[1265]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:53 gus-field wireplumber[1263]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:53 gus-field wireplumber[1263]: mod.rt: RTKit error: org.freedesktop.DBus.Error.ServiceUnknown
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.581155899+08:00" level=info msg="loading plugin" id=io.containerd.warning.v1.deprecations type=io.containerd.warning.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609020102+08:00" level=info msg="skip loading plugin" error="no scratch file generator: skip plugin" id=io.containerd.snapshotter.v1.blockfile type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609226158+08:00" level=info msg="skip loading plugin" error="path /var/lib/containerd/io.containerd.snapshotter.v1.btrfs (ext4) must be a btrfs filesystem to be used with the btrfs snapshotter: skip plugin" id=io.containerd.snapshotter.v1.btrfs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.609255343+08:00" level=info msg="skip loading plugin" error="devmapper not configured: skip plugin" id=io.containerd.snapshotter.v1.devmapper type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.824347806+08:00" level=info msg="skip loading plugin" error="EROFS unsupported, please `modprobe erofs`: skip plugin" id=io.containerd.snapshotter.v1.erofs type=io.containerd.snapshotter.v1
Sep 13 14:10:55 gus-field containerd[1147]: time="2026-09-13T14:10:55.929334917+08:00" level=info msg="skip loading plugin" error="lstat /var/lib/containerd/io.containerd.snapshotter.v1.zfs: no such file or directory: skip plugin" id=io.containerd.snapshotter.v1.zfs type=io.containerd.snapshotter.v1

Sep 14 10:25:21 gus-field tailscaled[1145]: health(warnable=warming-up): ok
```
``` bash
rasp@gus-field:~ $ sudo journalctl --since "2026-09-13 14:10:00" --until "2026-09-13 14:15:00" | grep -iE "docker|containerd|layer|sandbox"
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
判斷卡死 需做系統看門狗 -260914
sudo nano /boot/firmware/config.txt
	dtparam=watchdog=on
sudo apt-get update && sudo apt-get install watchdog -y
sudo nano /etc/watchdog.conf
	watchdog-device = /dev/watchdog 
	watchdog-timeout = 15 
	max-load-1 = 24
sudo systemctl enable --now watchdog