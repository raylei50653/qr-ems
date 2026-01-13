# 開發規範與標準 (Development Standards)

為了維持 QR-EMS 專案的穩定性與可維護性，所有開發者請遵守以下規範。

## 🛠️ 開發工具要求

| 工具名稱 | 版本要求 | 用途 |
| :--- | :--- | :--- |
| **Docker Compose** | V2 (指令 `docker compose`) | 容器化服務編排，確保生產與開發環境一致 |
| **Devbox** | 最新版 | 隔離開發環境 (沙盒)，替代傳統 venv |
| **pnpm** | v10+ | 前端高效能套件管理 |
| **uv** | 最新版 | 後端極速 Python 套件與環境管理 |
| **Husky** | v9+ | Git Hooks 管理，確保提交品質 |
| **Ruff** | 最新版 | 後端程式碼 Lint 與自動格式化工具 |

---

## 📦 沙盒開發環境 (Devbox) - 強烈推薦

為了確保開發環境隔離且不汙染系統，建議使用 Devbox。

### 🚀 如何開始
1.  **安裝 Devbox**: 執行 `curl -fsSL https://get.jetify.com/devbox | bash`。
2.  **進入沙盒**: 在專案根目錄執行 `devbox shell`。
3.  **初始化專案**: 執行 `run setup` (自動跑 uv sync 與 pnpm install，並初始化 Husky)。

### ⚡ 開發指令 (沙盒內)
*   **啟動後端**: `run dev-back` 或 `cd backend && uv run python manage.py runserver`。
*   **啟動前端**: `run dev-front` 或 `cd frontend && pnpm dev`。
*   **後端 Lint/Format**: `cd backend && uv run ruff check --fix` 與 `uv run ruff format`。
*   **前端 Lint**: `cd frontend && pnpm lint`。
*   **執行測試**: `run test`。

---

## 🎨 前端開發規範 (Frontend)

### 1. 型別安全性 (TypeScript)
*   **禁止使用 `any`:** 請優先使用具體型別或 `unknown`。
*   **型別導入:** 由於啟用 `verbatimModuleSyntax`，僅供型別使用的導入必須使用 `import type`（例如 `import type { AxiosError } from 'axios'`）。
*   **處理 Nullable 欄位:** 從後端 API 獲取的欄位（如位置、描述）通常為 `null`，介面定義應包含 `| null` 並在 UI 中處理空值。
*   **非同步測試:** 撰寫單元測試時，若要 Mock API 回傳值，請使用 `Awaited<ReturnType<typeof apiFunc>>`。

### 2. React Hooks 規則
*   **避免同步渲染:** 在 `useEffect` 內禁止直接呼叫會觸發重繪的同步 `setState`。若有必要，請使用 `setTimeout(() => ..., 0)` 將其轉為異步，或考慮重構邏輯。

### 3. 圖示引用
*   所有圖示必須統一從 `lucide-react` 引入。

## 🐍 後端開發規範 (Backend)

### 1. 程式碼風格 (Linting & Formatting)
*   **Ruff:** 本專案統一使用 Ruff 進行檢查與格式化。
    *   **排序:** Import 必須經過排序（Ruff 會自動處理）。
    *   **命名:** 避免在方法內使用大寫開頭的變數名（如 `User = get_user_model()` 應改為 `user_model = ...`）。
    *   **未使用參數:** 若方法重寫中存在未使用的參數（如 `request` 或 `view`），請在參數名前加上底線（例如 `_request`）。

### 2. 資料庫操作
*   **明確排序:** 所有 ViewSet 的 `queryset` 必須包含 `.order_by()`，以避免 Django 的分頁警告 `UnorderedObjectListWarning`。
*   **交易原子性:** 涉及多個 Model 變更的邏輯應封裝在 `transaction.atomic()` 塊中。

### 3. 測試規範
*   **欄位語意:** `Transaction` 模型中，`reason` 是使用者填寫的申請理由，`admin_note` 是管理員填寫的審核備註。測試用例應嚴格區分。
*   **環境一致性:** 執行測試請優先使用 `make test-back`（在 Docker 內運行）。

## 🌿 Git 流程

### 1. Commit 訊息
*   訊息請使用 **中文** 或符合 **Conventional Commits** 規範。
*   範例：`fix: 修復設備詳情頁的型別錯誤` 或 `feat: 新增掃描確認功能`。

### 2. 自動化檢查 (Husky)
本專案已設定 **Husky** 與 **lint-staged**。當您執行 `git commit` 時，系統會自動針對您修改的文件執行以下檢查：
*   **前端文件 (.ts, .tsx):** 執行 `eslint` 與 `tsc` (型別檢查)。
*   **後端文件 (.py):** 執行 `ruff check --fix` 與 `ruff format`。

**若檢查失敗，提交將被攔截。** 請根據錯誤提示修正後再行提交。這能確保進到倉庫的程式碼始終符合規範。

---

## 🧪 API 手動測試指南 (Manual Testing)

若您希望使用 Postman 或 Curl 直接測試後端 API，請遵循以下步驟進行驗證。

### 1. 獲取 Access Token
後端採用 JWT 驗證。請先向 `/api/v1/auth/token/` 發送 POST 請求以取得 Token。

*   **URL:** `http://localhost:8000/api/v1/auth/token/`
*   **Method:** `POST`
*   **Body (JSON):**
    ```json
    {
      "username": "admin",
      "password": "your_password"
    }
    ```
*   **Response:**
    ```json
    {
      "refresh": "eyJ0eX...",
      "access": "eyJ0eX..."  // <--- 這是我們要的 Token
    }
    ```

### 2. 設定 Authorization Header
在後續的所有請求中 (如查詢設備、借還申請)，必須在 Header 帶上 Token：

*   **Header Name:** `Authorization`
*   **Header Value:** `Bearer <你的_Access_Token>`
    *   注意 `Bearer` 與 Token 之間有一個空格。

### 3. 常見測試情境
*   **查詢所有設備:** `GET /api/v1/equipment/`
*   **掃描並借出設備:** `POST /api/v1/transactions/borrow/`
    ```json
    {
      "equipment_uuid": "設備的UUID",
      "reason": "專案開發測試使用"
    }
    ```

