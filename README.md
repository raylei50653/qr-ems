# QR-EMS (QR-code Equipment Management System)

QR-EMS 是一個基於 QR Code 的設備資產管理系統，支援設備借用、歸還、維護狀態追蹤，並整合了 Google 登入與 Cloudflare Tunnel 用於遠端存取。

## 🚀 功能特色 (Features)

*   **設備管理:**
    *   追蹤設備狀態 (可借用、已借出、維護中...) 與詳細資訊。
    *   **新增/編輯設備**：Admin/Manager 角色可透過管理介面新增、編輯設備的名稱、描述、類別與狀態。
    *   **設備列表篩選與分頁**：儀表板支援按類別、狀態篩選及分頁顯示。
    *   **設備歷史紀錄**：完整記錄設備的借用、歸還、維護等交易歷史，方便資產追溯。
*   **QR Code 掃描:**
    *   支援手機/WebCam 掃描設備 QR Code 直接跳轉至詳情頁。
    *   **設備詳情頁顯示 QR Code**：每件設備詳情頁面都可直接查看並掃描其專屬 QR Code。
*   **身分驗證:**
    *   支援 Google OAuth 登入與 JWT 驗證。
    *   **新增傳統帳號註冊**：使用者可透過使用者名稱/Email/密碼註冊新帳號。
*   **權限管理:**
    *   區分 Admin (管理員)、Manager (經理)、User (一般使用者)。
    *   管理員可管理使用者角色。
    *   **歸還權限限制**：僅借用者本人可發起歸還申請。
    *   **歸還審核介面**：Admin/Manager 可透過專屬介面審核（批准/拒絕）待處理的歸還申請。
*   **現代化架構:**
    *   **Backend:** Python 3.12, Django 6, DRF, PostgreSQL.
    *   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS.
    *   **DevOps:** Docker Compose 全端容器化, Cloudflare Tunnel 公網穿透.

## 🛠️ 安裝與啟動 (Setup & Run)

### 1. 環境準備
確保系統已安裝：
*   Docker & Docker Compose
*   Make (可選，用於簡化指令)

### 2. 設定環境變數
複製範例檔並填入您的設定：

```bash
# 根目錄 (Docker & Cloudflare)
cp .env.example .env
# 填入 TUNNEL_TOKEN (若使用 Cloudflare Dashboard 管理 Tunnel)

# 後端
cp backend/.env.example backend/.env
# 修改 FRONTEND_URL 為您的公開網址 (例如 https://qrems.raylei-lab.com)

# 前端
cp frontend/.env.example frontend/.env
# 填入 VITE_GOOGLE_CLIENT_ID (從 Google Cloud Console 取得)
```

### 3. 啟動服務
使用 `make` 指令一鍵啟動：

```bash
make build  # 建置 Docker Images
make up     # 啟動所有服務 (Backend, Frontend, DB, Tunnel)
```

服務啟動後，網址會自動顯示在終端機中，通常為：
*   **Frontend:** `http://localhost:5173` (或您的 Cloudflare 網址)
*   **Backend API:** `http://localhost:8000/api/v1/`
*   **Admin Panel:** `http://localhost:8000/admin/`

### 4. 建立管理員 (Superuser)
在容器運行狀態下執行：

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5. 生成測試資料 (可選)
```bash
docker-compose exec backend python generate_test_data.py
```
此腳本會清空現有設備資料並重新生成大量帶有類別、狀態的測試設備。

## ☁️ Cloudflare Tunnel 設定

本專案整合了 `cloudflared` 容器，可透過 `docker-compose.yml` 配置。

**方式 A: Dashboard 管理 (推薦)**
1.  在 Cloudflare Zero Trust Dashboard 建立 Tunnel。
2.  取得 Token 填入根目錄 `.env` 的 `TUNNEL_TOKEN`。
3.  在 Dashboard 設定 Public Hostname:
    *   Service: `http://frontend:5173`

**方式 B: CLI 管理 (本地 Config)**
1.  將 `tunnel_creds.json` 和 `tunnel_config.yml` 放入專案根目錄。
2.  修改 `docker-compose.yml` 掛載這些檔案 (目前預設配置)。

## 📂 專案結構

```text
/
├── backend/            # Django Backend
│   ├── apps/           # 業務邏輯 App (equipment, users...)
│   └── Dockerfile
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── api/        # API Client
│   │   ├── pages/      # 頁面 (Dashboard, Scan, Admin...)
│   │   └── types/      # TS 定義
│   └── Dockerfile
├── docker-compose.yml  # 容器編排
├── Makefile            # 快捷指令
└── tunnel_config.yml   # Cloudflare Tunnel 設定
```

## 📝 開發指引

*   **新增依賴:**
    *   Backend: `cd backend && uv add <package>` (然後 `make build`)
    *   Frontend: `cd frontend && pnpm add <package>`
*   **資料庫遷移:**
    Backend 啟動時會自動執行 migrate。若需建立新的 migration:
    `docker-compose exec backend python manage.py makemigrations`

## 📄 授權
MIT License
