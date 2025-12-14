# QR-EMS (QR-code Equipment Management System)

## Project Overview
QR-EMS is an equipment management system designed to track the lifecycle of assets (borrowing, returning, maintenance) using QR codes. It features a modern web interface and a robust backend API.

**Current Status (2025-12-13):** Fully Dockerized, Google Login integrated, Cloudflare Tunnel enabled, Traditional Chinese UI.

### Tech Stack
*   **Backend:** Python 3.12+, Django 6.0, Django Rest Framework (DRF), PostgreSQL 16+, `uv` (dependency manager).
*   **Frontend:** React 18+, TypeScript, Vite, Tailwind CSS, Zustand, React Query, `html5-qrcode`.
*   **Infrastructure:** Docker Compose, Cloudflare Tunnel (`cloudflared`).

## Project Structure
```text
/home/ray/project/qr-ems/
├── backend/            # Django Backend
│   ├── apps/
│   │   ├── users/      # User & Role Management (Google Login)
│   │   ├── equipment/  # Equipment & QR Code Logic (UUID PK)
│   └── Dockerfile
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── api/        # Axios client
│   │   ├── pages/      # Pages: Dashboard, Scan, EquipmentDetail, Admin/UserManagement
│   └── Dockerfile
├── docker-compose.yml  # Services: db, backend, frontend, tunnel
├── tunnel_config.yml   # Cloudflare Tunnel Config
└── README.md           # Main documentation
```

## Setup & Configuration

### Environment Variables
*   **Root `.env`**: `TUNNEL_TOKEN` (for Cloudflare).
*   **`backend/.env`**: `FRONTEND_URL` (for QR code generation), `DATABASE_URL`, etc.
*   **`frontend/.env`**: `VITE_GOOGLE_CLIENT_ID`, `VITE_API_TARGET`.

### Key Features
*   **QR Scanning:** Frontend uses `html5-qrcode` to scan via webcam.
*   **Public Access:** Exposed via Cloudflare Tunnel (`https://qrems.raylei-lab.com`).
*   **Authentication:** Google OAuth 2.0.
*   **Localization:** Traditional Chinese (zh-hant).

### Commands
*   `make build`: Rebuild Docker images.
*   `make up`: Start all services.
*   `docker-compose exec backend python manage.py createsuperuser`: Create admin.