# 開發規範與標準 (Development Standards)

為了維持 QR-EMS 專案的穩定性與可維護性，所有開發者請遵守以下規範。

## 🛠️ 開發工具要求

*   **Docker Compose:** 必須使用 V2 版本 (指令為 `docker compose`)。
*   **前端套件管理:** 必須使用 **pnpm v10+**。
*   **後端環境管理:** 推薦使用 **uv**。

## 🎨 前端開發規範 (Frontend)

### 1. 型別安全性 (TypeScript)
*   **禁止使用 `any`:** 請優先使用具體型別或 `unknown`。
*   **處理 Nullable 欄位:** 從後端 API 獲取的欄位（如位置、描述）通常為 `null`，介面定義應包含 `| null` 並在 UI 中處理空值。
*   **非同步測試:** 撰寫單元測試時，若要 Mock API 回傳值，請使用 `Awaited<ReturnType<typeof apiFunc>>`。

### 2. React Hooks 規則
*   **避免同步渲染:** 在 `useEffect` 內禁止直接呼叫會觸發重繪的同步 `setState`。若有必要，請使用 `setTimeout(() => ..., 0)` 將其轉為異步，或考慮重構邏輯。

### 3. 圖示引用
*   所有圖示必須統一從 `lucide-react` 引入。

## 🐍 後端開發規範 (Backend)

### 1. 資料庫操作
*   **明確排序:** 所有 ViewSet 的 `queryset` 必須包含 `.order_by()`，以避免 Django 的分頁警告 `UnorderedObjectListWarning`。
*   **交易原子性:** 涉及多個 Model 變更的邏輯應封裝在 `transaction.atomic()` 塊中。

### 2. 測試規範
*   **欄位語意:** `Transaction` 模型中，`reason` 是使用者填寫的申請理由，`admin_note` 是管理員填寫的審核備註。測試用例應嚴格區分。
*   **環境一致性:** 執行測試請優先使用 `make test-back`（在 Docker 內運行）。

## 🌿 Git 流程

### 1. Commit 訊息
*   訊息請使用 **中文** 或符合 **Conventional Commits** 規範。
*   範例：`fix: 修復設備詳情頁的型別錯誤` 或 `feat: 新增掃描確認功能`。

### 2. 提交前檢查
*   提交前請務必執行：
    *   前端：`pnpm lint` 與 `pnpm test`
    *   後端：`make test-back`
