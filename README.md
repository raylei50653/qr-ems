# QR-EMS (QR-code Equipment Management System)

**QR-EMS** 是一套現代化的設備資產管理解決方案，專為解決實驗室、辦公室或共享空間中設備追蹤不易、借還流程繁瑣的問題而設計。

透過整合 **QR Code 快速掃描**技術，使用者僅需使用手機或 WebCam 掃描設備上的標籤，即可快速檢視設備詳情、狀態或進行借還操作。系統內建完整的**權限管理**（Admin/Manager/User）與**簽核流程**，並採用 **Docker** 全容器化部署與 **Cloudflare Tunnel** 安全穿透技術，讓管理者無需繁雜的網路設定，即可輕鬆在任何地點掌握資產動態。

---

## 🚀 核心功能 (Key Features)

### 📦 智慧資產與倉儲管理
*   **多層級位置管理**：支援建立「區 > 櫃 > 位」等多層級倉庫結構，精確追蹤設備存放點。
*   **全方位狀態追蹤**：即時掌握設備狀態（可借用、已借出、維護中、需移動、移動中、遺失、已報廢）。
*   **智能移動流程**：支援預設設備目的地（Target Location），透過掃描目的地 QR Code 自動比對設備，減少放錯位置的機率。
*   **詳細資產履歷**：完整記錄每一次的借用、歸還、維護與資料變更，方便資產盤點與追溯。
*   **多元設備分類**：支援筆電、顯示器、開發板、線材、家具等多種自訂類別。
*   **靈活篩選與搜尋**：提供儀表板即時篩選與分頁功能，快速找到目標設備。

### 📱 QR Code 掃描整合
*   **一鍵掃描**：支援行動裝置相機或電腦 WebCam 掃描，支援設備 QR Code (跳轉詳情) 與位置 QR Code (啟動入庫程序)。
*   **即時生成**：每項設備與存放位置皆自動生成專屬 QR Code，可直接列印標籤貼於貨架或設備上。

### 🛡️ 安全與權限
*   **OAuth 身分驗證**：整合 **Google 登入**，支援 JWT 驗證，亦提供傳統帳號密碼註冊功能。
*   **角色權限分級**：
    *   **Admin (管理員)**：系統全權管理、角色分配、倉庫位置規劃。
    *   **Manager (經理)**：設備管理、審核歸還申請、位置庫存管理。
    *   **User (使用者)**：瀏覽設備、借用申請、掃描入庫。
*   **歸還審核機制**：防止誤操作，歸還需經由管理人員審核後才算完成。

### 🏗️ 現代化技術架構
*   **Backend:** Python 3.12, Django 6, Django REST Framework (DRF), PostgreSQL.
*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
*   **DevOps:** Docker Compose 全端容器化, Cloudflare Tunnel (Zero Trust) 公網穿透.

---

## 🛠️ 安裝與啟動 (Setup & Run)

### 1. 環境準備
確保您的系統已安裝以下工具：
*   **Docker** & **Docker Compose**
*   **Make** (可選，用於簡化指令)

### 2. 設定環境變數
請複製範例設定檔並填入您的參數：

```bash
# 1. 根目錄 (Docker & Cloudflare 設定)
cp .env.example .env
# 提示: 若使用 Cloudflare Dashboard 管理 Tunnel，請填入 TUNNEL_TOKEN

# 2. 後端設定 (Django & DB)
cp backend/.env.example backend/.env
# 重要: 修改 FRONTEND_URL 為您的公開網址 (例如 https://qrems.example.com)

# 3. 前端設定 (React & Vite)
cp frontend/.env.example frontend/.env
# 重要: 填入 VITE_GOOGLE_CLIENT_ID (需從 Google Cloud Console 申請)
```

### 3. 啟動服務
使用 `make` 指令一鍵啟動所有服務：

```bash
make build  # 建置 Docker Images
make up     # 啟動所有服務 (Backend, Frontend, DB, Tunnel)
```

服務啟動後，您可透過以下網址訪問：
*   **Frontend (使用者介面):** `http://localhost:5173` (或您的 Cloudflare 公網網址)
*   **Backend API:** `http://localhost:8000/api/v1/`
*   **Admin Panel:** `http://localhost:8000/admin/`

### 4. 建立管理員 (Superuser)
在容器運行狀態下，執行以下指令建立最高權限帳號：

```bash
make superuser
# 或直接使用 Docker
docker-compose exec backend uv run python manage.py createsuperuser
```

---

## 📂 專案結構概覽

```text
/
├── backend/            # Django Backend
│   ├── apps/           # 業務邏輯模組
│   │   ├── equipment/  # 設備管理核心
│   │   ├── transactions/ # 借還與交易紀錄
│   │   ├── users/      # 使用者與驗證
│   │   └── locations/  # 倉庫與位置管理 (New!)
│   └── Dockerfile
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── api/        # API 串接層
│   │   ├── pages/      # 主要頁面
│   │   │   ├── Admin/  # 管理端 (設備、人員、位置、審核)
│   │   │   ├── Scan/   # QR Code 掃描與入庫確認
│   │   │   └── ...
│   │   └── types/      # TypeScript 型別定義
│   └── Dockerfile
├── docker-compose.yml  # 容器編排設定
├── Makefile            # 常用指令集
└── tunnel_config.yml   # Cloudflare Tunnel 設定範本
```

## 📄 授權 (License)
MIT License
