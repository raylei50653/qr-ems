# QR-EMS Frontend

這是 QR-EMS 的前端應用，使用 React, TypeScript 和 Vite 構建，提供現代化且響應式的設備管理介面。

## 🛠️ 技術棧 (Tech Stack)

*   **Framework:** React 18+
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand (Auth/Global), TanStack Query (Server State)
*   **Routing:** React Router v6
*   **QR Code:** `html5-qrcode`
*   **HTTP Client:** Axios

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

## ⚙️ 環境變數 (.env)

| 變數名 | 說明 | 範例 |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | 後端 API 基礎路徑 | `http://localhost:8000/api/v1` (或 `https://你的網域/api/v1`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your-client-id.apps.googleusercontent.com` |

## 🔑 主要功能模組

### 1. 認證 (Auth)
*   整合 Google Sign-In 與傳統帳號密碼註冊/登入。
*   使用 JWT (Access/Refresh Tokens) 進行 API 驗證。
*   `useAuthStore` 管理登入狀態與使用者資訊。

### 2. 設備管理 (Equipment)
*   **儀表板**: 支援關鍵字搜尋、類別篩選、狀態篩選與分頁。
*   **詳情頁**: 顯示設備詳細資訊、當前持有者、QR Code 與歷史紀錄。
*   **管理介面**: Admin/Manager 可新增與編輯設備資料。

### 3. 借還流程 (Transactions)
*   **借用**: 使用者可對可用設備發起借用申請。
*   **歸還**: 借用者可發起歸還申請 (權限限制：僅限本人)。
*   **審核**: Admin/Manager 可在 `/admin/returns` 審核歸還申請 (批准/拒絕)。

### 4. 掃描 (Scan)
*   使用 `html5-qrcode` 呼叫攝影機掃描 QR Code。
*   自動解析 UUID 並導向設備詳情頁。