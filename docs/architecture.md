# 系統架構

此圖表展示了 QR-EMS 應用程式在生產環境 Docker 中的當前架構。

```mermaid
graph LR
    User((使用者))

    subgraph External ["外部網絡"]
        CF_Edge[Cloudflare Edge]
        R2[("Cloudflare R2 <br/> (Object Storage)")]
    end

    subgraph Docker_Compose ["Docker Compose"]
        direction LR
        
        subgraph Ingress_Layer ["入口層"]
            Tunnel["Cloudflare Tunnel <br/> (Argo Tunnel)"]
        end
        
        subgraph App_Layer ["應用服務層"]
            Frontend["Frontend <br/> (Nginx + Vite)"]
            Backend["Backend API <br/> (Django + Gunicorn)"]
        end
        
        subgraph Data_Layer ["資料持久化層"]
            DB[("PostgreSQL 16")]
            Vol_DB[("DB Volume")]
        end
    end

    %% 流量流程
    User -- "HTTPS <br/> (qrems.raylei-lab.com)" --> CF_Edge
    CF_Edge -- "安全通道" --> Tunnel
    
    Tunnel -- "反向代理 (80)" --> Frontend
    
    Frontend -- "1. 請求 API (/api)" --> Backend
    Frontend -- "2. 提供靜態資源" --> User
    
    Backend -- "SQL 查詢" --> DB
    Backend -- "媒體文件存取" --> R2
    
    %% 持久化關係
    DB -.-> Vol_DB

    %% 樣式定義
    classDef ext fill:#f9f,stroke:#333,stroke-width:1px;
    classDef docker fill:#e1f5fe,stroke:#0277bd,stroke-width:1px;
    classDef db fill:#e0f2f1,stroke:#00695c,stroke-width:1px;
    
    class User,CF_Edge,R2 ext;
    class Tunnel,Frontend,Backend docker;
    class DB,Vol_DB db;
```

## 組件詳情

- **Cloudflare Tunnel (`tunnel`)**：建立與 Cloudflare 的安全出站連接。它接收來自 `qrems.raylei-lab.com` 的流量，並將其路由到內部 `frontend` 服務的 80 端口。
- **前端服務 (`frontend`)**：
  - 運行 **Nginx**。
  - 提供構建好的 React 應用程式（靜態文件）。
  - 作為反向代理（Reverse Proxy），將 `/api` 和 `/admin` 請求轉發到 `backend` 服務。
- **後端服務 (`backend`)**：
  - 運行 **Django** 和 **Gunicorn**（在 8000 端口）。
  - 處理業務邏輯和 API 請求。
- **資料庫 (`db`)**：
  - 運行 **PostgreSQL 16**。
  - 儲存應用程式數據。
