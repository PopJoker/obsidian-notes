# Git設定
	建立相關Repositories 
	名字看懂就好 Remote Add. Push 好後就好
	
![[20260312094225.png]]
# Obsidian Git
	去下載Git外掛，並設定如下
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
    "show": true,
    "followMovement": "inactive",
    "authorDisplay": "initials",
    "showCommitHash": false,
    "dateTimeFormatOptions": "date",
    "dateTimeFormatCustomString": "YYYY-MM-DD HH:mm",
    "dateTimeTimezone": "viewer-local",
    "coloringMaxAge": "1y",
    "colorNew": {"r":255,"g":150,"b":150},
    "colorOld": {"r":120,"g":160,"b":255},
    "textColorCss": "var(--text-muted)",
    "ignoreWhitespace": false,
    "gutterSpacingFallbackLength": 5,
    "lastShownAuthorDisplay": "initials",
    "lastShownDateTimeFormatOptions": "date"
  }
}
```
	設定完成後無編寫會自動更新

# 其他電腦如何應用
	