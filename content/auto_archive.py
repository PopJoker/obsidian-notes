# auto_archive.py
# pip install pyinstaller
# pyinstaller --onefile --console content\auto_archive.py
import os
import re
import shutil
import math 
import sys
from datetime import datetime, timedelta

# ================== 設定路徑 ==================
if getattr(sys, 'frozen', False):
    # 如果是 .exe 執行檔，抓取該 .exe 所在的目錄
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    # 如果是一般的 .py 腳本，抓取腳本所在的目錄
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INBOX_DIR = os.path.join(BASE_DIR, "Inbox")
ARCHIVE_DIR = os.path.join(BASE_DIR, "Archive")

# 判斷時間差：超過幾天就封存（一週 = 7天）
DAYS_TO_ARCHIVE = 1

# 正規表達式：匹配 YYYY-MM-DD.md 格式
DATE_FILE_PATTERN = re.compile(r"^(\d{4})-(\d{2})-(\d{2})\.md$")


def get_week_of_month(dt):
    """計算日期是當月的第幾週 (符合你目錄中 1th week, 2th week 的邏輯)"""
    first_day = dt.replace(day=1)
    dom = dt.day
    adjusted_dom = dom + first_day.weekday()
    
    # 修正：改用 math.ceil 進行無條件進位
    week_num = int(math.ceil(adjusted_dom / 7.0))

    return f"{week_num}th week"


def main():
    if not os.path.exists(INBOX_DIR) or not os.path.exists(ARCHIVE_DIR):
        print("❌ 找不到 Inbox 或 Archive 資料夾，請檢查路徑。")
        return

    today = datetime.now()
    moved_count = 0

    print(f"⏰ 開始檢查 Inbox 筆記... (當前時間: {today.strftime('%Y-%m-%d')})")
    print(f"📂 只要早於 {(today - timedelta(days=DAYS_TO_ARCHIVE)).strftime('%Y-%m-%d')} 的筆記將會被自動歸檔。\n")

    # 遍歷 Inbox 資料夾
    for filename in os.listdir(INBOX_DIR):
        match = DATE_FILE_PATTERN.match(filename)

        if match:
            # 檔案完整路徑
            src_file_path = os.path.join(INBOX_DIR, filename)

            # 解析檔名中的日期
            file_date_str = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
            file_date = datetime.strptime(file_date_str, "%Y-%m-%d")

            # 計算天數差距
            age = today - file_date

            if age.days >= DAYS_TO_ARCHIVE:
                # 計算目標資料夾名稱
                month_folder = f"{file_date.month}月"  # 例如: "5月"
                week_folder = get_week_of_month(file_date)  # 例如: "2th week"

                # 建立目標目錄路徑
                target_dir = os.path.join(
                    ARCHIVE_DIR, month_folder, week_folder
                )

                # 如果資料夾不存在就自動建立
                os.makedirs(target_dir, exist_ok=True)

                # 移動檔案
                dest_file_path = os.path.join(target_dir, filename)

                # 避免覆蓋已有檔案
                if not os.path.exists(dest_file_path):
                    shutil.move(src_file_path, dest_file_path)
                    print(f"✅ 已封存: {filename} -> Archive/{month_folder}/{week_folder}/")
                    moved_count += 1
                else:
                    print(f"⚠️ 警告: {filename} 在目標區已存在，跳過以防覆蓋。")

    print(f"\n✨ 處理完成！共移除了 {moved_count} 個一週前的舊筆記。")


if __name__ == "__main__":
    main()