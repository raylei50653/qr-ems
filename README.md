# QR-EMS (QR-code Equipment Management System)

**QR-EMS** 是一套現代化的設備資產管理解決方案，專為解決實驗室、辦公室或共享空間中設備追蹤不易、借還流程繁瑣的問題而設計。

透過整合 **QR Code 快速掃描**技術，使用者僅需使用手機或 WebCam 掃描設備上的標籤，即可快速檢視設備詳情、狀態或進行借還操作。系統內建完整的**權限管理**（Admin/Manager/User）與**簽核流程**，並採用 **Docker** 全容器化部署，讓管理者無需繁雜的設定即可輕鬆掌握資產動態。

---

## 🚀 核心功能 (Key Features)

### 📦 智慧資產與倉儲管理
*   **多層級位置管理**：支援建立「區 > 櫃 > 位」等多層級倉庫結構，精確追蹤設備存放點。
*   **全方位狀態追蹤**：即時掌握設備狀態（可借用、已借出、維護中、需移動、移動中、遺失、已報廢）。
*   **智能移動流程**：透過掃描目的地 QR Code 自動比對設備，減少放錯位置的機率。
*   **詳細資產履歷**：完整記錄每一次的借用、歸還、維護與資料變更。

### 📱 QR Code 掃描整合
*   **一鍵掃描**：支援行動裝置相機或電腦 WebCam 掃描。
*   **即時生成**：每項設備與存放位置皆自動生成專屬 QR Code，可直接列印標籤。

### 🛡️ 安全與權限
*   **OAuth 身分驗證**：整合 **Google 登入** 與傳統帳號密碼註冊。
*   **角色權限分級**：嚴格區分 Admin (管理員)、Manager (經理) 與 User (使用者) 權限。
*   **歸還審核機制**：防止誤操作，歸還需經由管理人員審核。

---

## 🚀 快速開始 (Quick Start)

### 1. 啟動服務
本專案支援 Docker Compose 一鍵部署。確保已安裝 Docker 後，執行：

```bash
# 複製環境變數範本
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 啟動所有服務
docker compose up -d --build
```

### 2. 訪問系統
服務啟動後，即可透過瀏覽器訪問：
*   **使用者介面:** `http://localhost:5173`
*   **後端 API:** `http://localhost:8000/api/v1/`
*   **管理後台:** `http://localhost:8000/admin/`

---

## 📚 文件與開發指南 (Documentation)

詳細的開發、架構與疑難排解文件已移至 `docs/` 目錄：

*   **[📖 開發規範 (Development Standards)](docs/DEVELOPMENT.md)**
    *   包含前端型別規範、後端資料庫操作準則、Git 提交流程。
*   **[🏗️ 系統架構 (Architecture)](docs/ARCHITECTURE.md)**
    *   技術棧說明、資料夾結構、安全機制設計。
*   **[🔧 疑難排解 (Troubleshooting)](docs/TROUBLESHOOTING.md)**
    *   常見問題 FAQ (CI/CD 錯誤、依賴版本衝突等)。

---

## 📄 授權 (License)
MIT License
