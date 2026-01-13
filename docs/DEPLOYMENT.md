# 部署指南 (Deployment Guide)

本文件說明如何將 QR-EMS 部署至生產環境 (Production)，涵蓋 Docker 設定、環境變數配置與 Cloudflare Tunnel 連線方式。

## 📋 事前準備

1.  **伺服器環境**: 建議使用 Linux (Ubuntu 22.04 LTS+)，至少 2GB RAM。
2.  **Docker**: 安裝 Docker Engine 與 Docker Compose V2。
3.  **網域 (Domain)**: 一個由 Cloudflare 託管的網域 (用於 Tunnel)。

---

## ⚙️ 環境變數配置 (Production)

在生產環境中，請勿直接使用 `.env.example` 的預設值。請建立 `.env` 並修改以下關鍵變數：

### Backend (`backend/.env`)
```ini
# 安全性設定
DEBUG=False
SECRET_KEY=你的_強力_隨機_字串 (請使用 `openssl rand -base64 32` 生成)
ALLOWED_HOSTS=localhost,127.0.0.1,你的網域.com

# 資料庫連線 (對應 docker-compose 的 db 服務)
DATABASE_URL=postgres://postgres:你的強密碼@db:5432/qrems

# 前端連結 (用於生成 QR Code 連結)
FRONTEND_URL=https://你的網域.com
```

### Frontend (`frontend/.env`)
```ini
# API 位置 (指向 Cloudflare Tunnel 的公開網址)
VITE_API_BASE_URL=https://你的網域.com/api/v1

# OAuth
VITE_GOOGLE_CLIENT_ID=你的_Google_Client_ID
```

---

## 🚇 Cloudflare Tunnel 設定 (Zero Trust)

本專案建議使用 Cloudflare Tunnel 將服務暴露至公網，無需設定防火牆或 Port Forwarding。

### 1. 取得 Tunnel Token
1.  登入 [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)。
2.  進入 **Networks** > **Tunnels** > **Create a tunnel**。
3.  選擇 **Cloudflared (Docker)**，複製生成的 Token。

### 2. 設定 `docker-compose.yml` (或 `docker-compose.prod.yml`)
將 Token 填入 `tunnel` 服務的環境變數中：

```yaml
  tunnel:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=你的_TUNNEL_TOKEN
    restart: always
```

### 3. 設定 Public Hostname (在 Cloudflare 後台)
在 Tunnel 設定頁面新增兩個 Public Hostname，將流量導向 Docker 內部的服務名稱：

| Public Hostname (Subdomain) | Service Type | URL | 說明 |
| :--- | :--- | :--- | :--- |
| `ems.你的網域.com` | HTTP | `frontend:80` | 前端介面 |
| `ems.你的網域.com/api` | HTTP | `backend:8000` | 後端 API (注意 Path) |
| `ems.你的網域.com/admin` | HTTP | `backend:8000` | Django 後台 |
| `ems.你的網域.com/static` | HTTP | `backend:8000` | Django 靜態檔 |

> **注意**: 也可以使用 Nginx 作為反向代理 (Reverse Proxy) 統一處理 `/api` 前綴，但在簡單部署中，直接在 Cloudflare設定路徑規則亦可。

---

## 💾 資料庫備份與還原

### 備份 (Backup)
```bash
# 備份到當前目錄的 backup.sql
docker compose exec -t db pg_dump -U postgres qrems > backup.sql
```

### 還原 (Restore)
⚠️ **警告**: 這將覆蓋現有資料庫。
```bash
cat backup.sql | docker compose exec -T db psql -U postgres qrems
```

---

## 🔄 系統更新流程

當代碼有更新時，請執行以下步驟進行 Rolling Update：

1.  **拉取最新代碼**:
    ```bash
    git pull origin main
    ```

2.  **重建並重啟容器**:
    ```bash
    docker compose up -d --build
    ```

3.  **執行資料庫遷移**:
    ```bash
    docker compose exec backend python manage.py migrate
    ```

4.  **收集靜態檔案 (如果 DEBUG=False)**:
    ```bash
    docker compose exec backend python manage.py collectstatic --noinput
    ```
