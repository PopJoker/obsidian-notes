# Git 設定
建立相關 Repositories  
名字看懂就好，Remote Add / Push 好後就可以。
目前Remote ```
[Obsidan Notes GitHub](https://github.com/PopJoker/obsidian-notes.git)
![[20260312094225.png]]

---

# Obsidian Git
去下載 Git 外掛，並設定如下：

```json
{
  "commitMessage": "vault backup: {{date}}",
  "autoCommitMessage": "vault backup: {{date}}",
  "commitMessageScript": "",
  "commitDateFormat": "YYYY-MM-DD HH:mm:ss",
  "autoSaveInterval": 10,
  "autoPushInterval": 10,
  "autoPullInterval": 10,
  "autoPullOnBoot": true,
  "autoCommitOnlyStaged": false,
  "disablePush": false,
  "pullBeforePush": true,
  "disablePopups": false,
  "showErrorNotices": true,
  "disablePopupsForNoChanges": false,
  "listChangedFilesInMessageBody": false,
  "showStatusBar": true,
  "updateSubmodules": false,
  "syncMethod": "merge",
  "mergeStrategy": "none",
  "customMessageOnAutoBackup": true,
  "autoBackupAfterFileChange": true,
  "treeStructure": false,
  "refreshSourceControl": false,
  "basePath": "",
  "differentIntervalCommitAndPush": true,
  "changedFilesInStatusBar": false,
  "showedMobileNotice": true,
  "refreshSourceControlTimer": 7000,
  "showBranchStatusBar": true,
  "setLastSaveToLastCommit": false,
  "submoduleRecurseCheckout": false,
  "gitDir": "",
  "showFileMenu": true,
  "authorInHistoryView": "hide",
  "dateInHistoryView": false,
  "diffStyle": "split",
  "hunks": {
    "showSigns": false,
    "hunkCommands": false,
    "statusBar": "disabled"
  },
  "lineAuthor": {
    "show": false,
    "followMovement": "inactive",
    "authorDisplay": "hide",
    "showCommitHash": false,
    "dateTimeFormatOptions": "hide",
    "dateTimeFormatCustomString": "YYYY-MM-DD HH:mm",
    "dateTimeTimezone": "viewer-local",
    "coloringMaxAge": "1y",
    "colorNew": {
      "r": 255,
      "g": 150,
      "b": 150
    },
    "colorOld": {
      "r": 120,
      "g": 160,
      "b": 255
    },
    "textColorCss": "var(--text-muted)",
    "ignoreWhitespace": false,
    "gutterSpacingFallbackLength": 0,
    "lastShownAuthorDisplay": "initials",
    "lastShownDateTimeFormatOptions": "date"
  }
}
```

---

# 其他電腦如何應用
1. 在新電腦安裝 Obsidian
2. 用 Git clone 你的 Vault（例如 GitHub Repo）到本地
3. 安裝 Obsidian Git Plugin
4. 打開 Vault → Settings → Community Plugins → Obsidian Git
5. 將 JSON 設定檔覆蓋 `data.json` 或直接在 Plugin 介面設定相同參數
6. 打開 Vault，Plugin 會自動 pull 最新內容
7. 之後新筆記 / 修改筆記也會自動 commit / push / pull

>  提示：
> - 確保兩台電腦的 Vault 分支相同（通常 main/master）
> - 如果兩台同時修改同一檔案，Git 可能出現衝突，需要手動解決
> - 可共同使用 `.gitignore` 忽略不必要的檔案（例如 `.obsidian/cache`）

``` 
# Obsidian cache

.obsidian/cache

.obsidian/workspace

  

# OS files

.DS_Store

Thumbs.db

  

# Trash

.trash
```
---
