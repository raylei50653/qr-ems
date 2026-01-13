# QR-EMS Backend

這是 QR-EMS (QR-code Equipment Management System) 的後端服務，基於 Django 與 Django Rest Framework (DRF) 構建。

## 🛠️ 技術棧 (Tech Stack)

*   **Framework:** Django 6.0, Django Rest Framework 3.15+
*   **Language:** Python 3.12+
*   **Database:** PostgreSQL 16+
*   **Dependency Manager:** `uv` (Fast Python package installer)
*   **Authentication:** JWT (via `djangorestframework-simplejwt`), Google OAuth 2.0
*   **API Documentation:** `drf-spectacular` (Swagger/OpenAPI 3.0)

## 📂 應用結構 (Apps)

| App 名稱 | URL 前綴 | 核心功能 | 備註 |
| :--- | :--- | :--- | :--- |
| **`users`** | `/api/v1/auth/` | 使用者認證 (Google/傳統註冊)、角色權限管理 (RBAC) | 區分 Admin, Manager, User |
| **`equipment`** | `/api/v1/equipment/` | 設備 CRUD、QR Code 生成、歷史紀錄查詢 | 採用 Service Layer 架構處理狀態 |
| **`transactions`** | `/api/v1/transactions/` | 借用/歸還申請、管理員審核流程 | 包含 `borrow`, `return-request` 等操作 |
| **`locations`** | `/api/v1/locations/` | 倉庫位置管理、層級結構樹狀圖 | 支援父子位置路徑查詢 |

## 🚀 開發指令 (Development)

所有指令建議透過根目錄的 `make` 或 `docker-compose` 執行，若需在容器內操作：

### 1. 安裝依賴
```bash
# 在 backend 目錄下
uv sync
```

### 2. 資料庫遷移
```bash
uv run python manage.py migrate
```

### 3. 啟動開發伺服器
```bash
uv run python manage.py runserver 0.0.0.0:8000
```

### 4. 建立管理員 (Superuser)
```bash
uv run python manage.py createsuperuser
```

### 5. 執行測試 (Testing)
建議在 Docker 環境中執行以確保環境一致性：
```bash
# 在專案根目錄執行 (使用 Docker Compose V2)
docker compose exec backend uv run python manage.py test
```

> **注意**: 
> * 測試代碼應避免依賴手動創建的資料，盡量使用 Fixtures 或 Factory。
> * 交易 (Transaction) 邏輯中，`reason` 欄位通常指使用者申請原因，而管理員的審核/拒絕理由應存於 `admin_note`。測試時請務必區分。
> * 若遇到 `UnorderedObjectListWarning`，請檢查 ViewSet 的 `queryset` 是否已包含 `.order_by()`。

### 6. 生成測試資料
```bash
uv run python generate_test_data.py
```
此腳本會清空現有設備並生成大量包含不同類別與狀態的測試資料。

## 📚 API 文件

啟動服務後，可訪問 Swagger UI 查看完整 API 文件：
*   **URL:** `http://localhost:8000/api/schema/swagger-ui/`

## ⚙️ 環境變數 (.env)

| 變數名 | 說明 | 預設值/範例 |
| :--- | :--- | :--- |
| `DEBUG` | Debug 模式 | `True` |
| `SECRET_KEY` | Django Secret Key | (unsafe-secret-key...) |
| `DATABASE_URL` | 資料庫連線字串 | `postgres://postgres:password@db:5432/qrems` |
| `FRONTEND_URL` | 前端網址 (用於 QR Code) | `http://localhost:5173` |