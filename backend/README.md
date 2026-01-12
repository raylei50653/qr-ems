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

*   **`users`**: 使用者認證與管理。
    *   支援 Google 登入 (`/api/v1/auth/google/`)。
    *   支援傳統帳號註冊 (`/api/v1/auth/register/`)。
    *   角色權限 (Admin, Manager, User)。
*   **`equipment`**: 設備管理核心。
    *   設備 CRUD (`/api/v1/equipment/`)。
    *   QR Code 生成 (`/api/v1/equipment/{uuid}/qr/`)。
    *   歷史紀錄 (`/api/v1/equipment/{uuid}/history/`)。
    *   分類與狀態篩選。
    *   **架構**: 使用 Service Layer (`services.py`) 處理狀態變更與 Transaction 紀錄。
*   **`transactions`**: 借還流程邏輯。
    *   借用 (`borrow`)、歸還申請 (`return-request`)。
    *   管理員審核 (`approve-return`, `reject-return`)。
*   **`locations`**: 倉庫位置管理。
    *   支援層級結構（父子位置）。
    *   提供位置資訊與路徑 API。

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
# 在專案根目錄執行
docker-compose exec backend uv run python manage.py test
```

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