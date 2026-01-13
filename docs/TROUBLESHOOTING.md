# 疑難排解指南 (Troubleshooting)

本文件整理了開發與 CI/CD 過程中可能遇到的常見問題。

## 🚀 CI/CD (GitHub Actions)

### Q: 報錯 `docker-compose: command not found`？
*   **原因:** CI 環境已更新為 Docker Compose V2。
*   **解法:** 將所有 `docker-compose` 指令改為 `docker compose` (無連字符)。

### Q: 報錯 `pnpm-lock.yaml` 版本不相符？
*   **原因:** 本地與 CI 的 pnpm 版本不一致（本專案要求 v10）。
*   **解法:**
    1. 執行 `npm install -g pnpm@latest` 更新本地版本。
    2. 刪除 `node_modules` 與 `pnpm-lock.yaml` 後重新 `pnpm install`。

## 🐍 後端 (Backend)

### Q: 測試時看到大量 `UnorderedObjectListWarning`？
*   **原因:** Django 的分頁器在沒有明確排序的 QuerySet 上運行。
*   **解法:** 在對應的 `ViewSet` 內將 `queryset = Model.objects.all()` 改為 `queryset = Model.objects.all().order_by('id')`。

### Q: 借還申請測試失敗？
*   **原因:** 可能誤用了欄位。
*   **解法:** 檢查是否混淆了 `reason`（使用者填寫）與 `admin_note`（管理員拒絕理由）。

## 🎨 前端 (Frontend)

### Q: 報錯 `Cannot find name 'QrCode'`？
*   **原因:** `lucide-react` 的圖示引用遺漏。
*   **解法:** 確認檔案頂部有 `import { QrCode } from 'lucide-react';`。注意不要與 `qrcode.react` 的 `QRCodeSVG` 混淆。

### Q: 型別報錯 `null` 不可分配給 `string | undefined`？
*   **原因:** 後端 nullable 欄位回傳了 `null`。
*   **解法:** 更新 TypeScript 介面，將該欄位標註為 `string | null`。
