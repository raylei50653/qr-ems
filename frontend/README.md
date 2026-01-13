# QR-EMS Frontend

這是 QR-EMS 的前端應用，使用 React, TypeScript 和 Vite 構建，提供現代化且響應式的設備管理介面。

## 🛠️ 技術棧 (Tech Stack)

*   **Framework:** React 19
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Package Manager:** pnpm (v10+) - **Required**
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand (Auth/Global), TanStack Query (Server State)
*   **Routing:** React Router v6
*   **QR Code:** `html5-qrcode`
*   **HTTP Client:** Axios
*   **Icons:** `lucide-react`

## 📂 專案結構 (Structure)

```text
src/
├── api/                # API 請求模組 (Auth, Equipment, Transactions)
├── components/         # 共用元件
├── pages/              # 頁面元件
│   ├── Admin/          # 管理員專用頁面 (人員管理, 歸還審核, 設備管理)
│   ├── Auth/           # 登入與註冊頁面
│   ├── Dashboard/      # 儀表板 (設備列表, 篩選, 分頁)
│   ├── Equipment/      # 設備詳情 (含歷史紀錄)
│   └── Scan/           # QR Code 掃描功能
├── store/              # Zustand Store (Auth)
├── types/              # TypeScript 介面定義
└── App.tsx             # 路由配置
```

## 🚀 開發指令 (Development)

所有指令建議透過根目錄的 `make` 執行，若需在 `frontend` 目錄下操作：

### 1. 安裝依賴
```bash
# 必須使用 pnpm v10+
pnpm install
```

### 2. 啟動開發伺服器
```bash
pnpm run dev
```
預設運行於 `http://localhost:5173`。

### 3. 建置生產版本
```bash
pnpm run build
```

### 4. 程式碼規範 (Linting & Testing)
本專案啟用嚴格的 ESLint 與 TypeScript 檢查：
*   **No Explicit Any:** 禁止使用 `any`，請使用 `unknown` 或具體型別。
*   **Effect Dependencies:** `useEffect` 內禁止同步執行 `setState`，請使用 `setTimeout` 轉為異步或重構邏輯。
*   **Icons:** 圖示請統一從 `lucide-react` 引入，避免使用未定義的圖示。

```bash
pnpm lint  # 檢查語法
pnpm test  # 執行單元測試
```

## ⚙️ 環境變數 (.env)

| 變數名 | 說明 | 範例 |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | 後端 API 基礎路徑 | `http://localhost:8000/api/v1` (本機)<br>`https://<tunnel-url>/api/v1` (遠端) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your-client-id.apps.googleusercontent.com` |

## 🔑 主要功能模組

### 1. 認證 (Auth)
*   整合 Google Sign-In 與傳統帳號密碼註冊/登入。
*   使用 JWT (Access/Refresh Tokens) 進行 API 驗證。
*   `useAuthStore` 管理登入狀態與使用者資訊。

### 2. 設備管理 (Equipment)
*   **儀表板**: 支援關鍵字搜尋、類別篩選、狀態篩選與分頁。
*   **詳情頁**: 顯示設備詳細資訊、當前持有者、QR Code、**目前位置**、**目標目的地**與歷史紀錄。
    *   **注意**: `location` 與 `target_location` 欄位可為 `null`，前端需處理此情況。
*   **管理介面**: Admin/Manager 可新增與編輯設備資料、指定目的地。

### 3. 借還與倉儲流程
*   **借用**: 使用者可對可用設備發起借用申請。
*   **歸還**: 借用者可發起歸還申請。
*   **位置管理**: Admin 可建立倉庫層級，並透過「庫存面板」快速指定設備目的地或直接入庫。

### 4. 掃描 (Scan)
*   使用 `html5-qrcode` 呼叫攝影機。
*   **設備 QR Code**: 跳轉至詳情頁。
*   **位置 QR Code**: 進入「入庫確認模式」，掃描設備後自動驗證目標位置並更新存儲點。