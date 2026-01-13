# 系統架構說明 (Architecture)

## 🏗️ 總體架構

QR-EMS 採用經典的前後端分離架構，並完全容器化以支援快速部署。

```text
[ Browser / Mobile ] <---> [ Cloudflare Tunnel ] <---> [ Docker Compose ]
                                                               |
                                        +----------------------+----------------------+
                                        |                      |                      |
                                 [ Vite Frontend ]      [ Django Backend ]      [ PostgreSQL ]
```

## 💻 技術棧 (Tech Stack)

### 前端 (Frontend)
*   **React 19**: 使用最新並行渲染特性。
*   **Vite**: 高效能開發與建置工具。
*   **TanStack Query**: 負責伺服器狀態管理與緩存。
*   **Zustand**: 輕量級客戶端狀態管理（Auth）。
*   **Tailwind CSS**: 原子化樣式管理。

### 後端 (Backend)
*   **Django 6.0**: 核心框架。
*   **Django REST Framework (DRF)**: API 構建。
*   **Service Layer Pattern**: 複雜邏輯（如借還流程）由 `services.py` 處理，ViewSet 僅負責 HTTP 層。
*   **PostgreSQL 16**: 關聯式資料庫。

## 📁 核心資料夾結構

*   `/backend/apps/equipment`: 處理資產 CRUD、分類、QR 生成。
*   `/backend/apps/transactions`: 處理借還申請、移動計畫、審核流。
*   `/backend/apps/locations`: 位置層級樹狀結構。
*   `/frontend/src/api`: 封裝所有 Axios 請求。
*   `/frontend/src/pages/Admin`: 包含所有管理端邏輯。

## 🔐 安全機制

*   **Zero Trust**: 透過 Cloudflare Tunnel 暴露服務，不需開啟防火牆端口。
*   **Authentication**: 整合 Google OAuth 與 JWT (SimpleJWT)。
*   **Permission**: 嚴格的 Role-based Access Control (RBAC)。
