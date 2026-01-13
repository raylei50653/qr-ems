# 系統架構說明 (Architecture)

## 🏗️ 總體架構

QR-EMS 採用現代化的前後端分離架構，並完全容器化以支援快速開發與部署。

```text
[ Browser / Mobile ] <---> [ Cloudflare Tunnel ] <---> [ Docker Compose ]
                                                               |
                                        +----------------------+----------------------+
                                        |                      |                      |
                                 [ Vite Frontend ]      [ Django Backend ]      [ PostgreSQL ]
```

## 💻 詳細技術棧 (Detailed Tech Stack)

### 1. 前端 (Frontend) - 現代化響應式 UI
*   **React 19**: 採用最新的 React 版本，利用其併發渲染 (Concurrent Rendering) 特性提升複雜介面的響應速度。
*   **TypeScript**: 強型別開發，配合前端定義的介面確保與後端資料結構的一致性，減少執行期錯誤。
*   **Vite**: 高效能的建置工具，提供極速的 HMR (Hot Module Replacement)，顯著提升開發效率。
*   **TanStack Query (v5)**: 核心伺服器狀態管理。處理 API 的快取、分頁、自動重新獲取 (Refetch) 以及 Loading/Error 狀態，減少冗餘的 `useEffect`。
*   **Zustand**: 輕量級狀態管理庫，專注於持久化的使用者認證資訊與全域佈局狀態。
*   **Tailwind CSS**: 採用原子化 CSS 框架，確保介面在手機與電腦端皆能完美適配，並維持高度的一致性。
*   **html5-qrcode**: 跨平台的 QR Code 掃描方案，支援在行動端瀏覽器中直接啟動相機並進行高效識別。

### 2. 後端 (Backend) - 穩定的企業級 API
*   **Django 6.0**: 採用最新的 Django 版本，利用其強大的 ORM、安全機制與內建的 Admin 管理介面。
*   **Django REST Framework (DRF)**: 將 Django 轉化為標準的 RESTful API 服務，支援複雜的過濾、分頁與權限控制。
*   **Service Layer Pattern**: 將核心業務邏輯（如：借還流程、狀態機變更）從 ViewSet 抽離至 `services.py`，確保代碼的可測試性與資料一致性。
*   **SimpleJWT**: 實現無狀態的 JWT 驗證機制，支援 Access/Refresh Token 流程，兼顧安全性與擴展性。
*   **drf-spectacular**: 自動從代碼生成 OpenAPI 3.0 (Swagger) 模式檔案，確保 API 文檔與實作永遠同步。

### 3. 基礎設施 (Infrastructure) - 容器化與公網安全
*   **Docker & Docker Compose (V2)**: 透過容器化技術封裝開發環境，確保從本地到 CI/CD 環境的一致性。
*   **PostgreSQL 16**: 穩定且高效能的關聯式資料庫，負責存儲資產、交易與使用者數據。
*   **Cloudflare Tunnel (Zero Trust)**: 透過 Cloudflare 的隧道技術，在不開啟任何防火牆端口的情況下，安全地將本地服務暴露至公網，支援遠端掃描測試。

## 📁 核心資料夾結構

*   `/backend/apps/equipment`: 處理資產 CRUD、分類、QR 生成。
*   `/backend/apps/transactions`: 處理借還申請、移動計畫、審核流。
*   `/backend/apps/locations`: 位置層級樹狀結構。
*   `/frontend/src/api`: 封裝所有 Axios 請求與型別轉換。
*   `/frontend/src/pages/Admin`: 包含設備管理、人員分配、入庫審核等核心功能。

## 🔐 安全機制

*   **Zero Trust**: 透過 Cloudflare Tunnel 暴露服務，不需開啟防火牆端口。
*   **Authentication**: 整合 Google OAuth 與 JWT (SimpleJWT)。
*   **Permission**: 嚴格的 Role-based Access Control (RBAC)，區分 Admin, Manager 與 User。
