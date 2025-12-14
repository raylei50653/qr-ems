.PHONY: help install dev-back dev-front migrate superuser test build-front clean

# 變數定義
BACKEND_DIR = backend
FRONTEND_DIR = frontend

# 預設執行 help
help:
	@echo "QR-EMS Project Makefile"
	@echo "-----------------------"
	@echo "Available commands:"
	@echo "  make install    : 安裝後端 (uv) 和前端 (pnpm) 的所有依賴"
	@echo "  make dev-back   : 啟動 Django 後端開發伺服器 (port 8000)"
	@echo "  make dev-front  : 啟動 Vite 前端開發伺服器 (port 5173)"
	@echo "  make migrate    : 執行後端資料庫遷移"
	@echo "  make superuser  : 建立預設管理員帳號 (admin/admin)"
	@echo "  make test       : 執行後端單元測試"
	@echo "  make build-front: 建置前端生產版本"
	@echo "  make clean      : 清理暫存檔 (__pycache__, dist 等)"
	@echo "  make up         : 使用 Docker Compose 啟動所有服務"
	@echo "  make down       : 停止 Docker 服務"
	@echo "  make logs       : 查看 Docker Log"
	@echo "  make build      : 重新建置 Docker Image"

install:
	@echo ">>> Installing Backend dependencies (uv)..."
	cd $(BACKEND_DIR) && uv sync
	@echo ">>> Installing Frontend dependencies (pnpm)..."
	cd $(FRONTEND_DIR) && pnpm install

up:
	@echo ">>> Starting Docker Services..."
	docker-compose up -d
	@echo ""
	@echo "Services are up!"
	@echo "---------------------------------------------------"
	@echo "Local Frontend: http://localhost:5173"
	@echo "Local Backend:  http://localhost:8000"
	@echo "Public URL:     https://qrems.raylei-lab.com"
	@echo "---------------------------------------------------"

down:
	@echo ">>> Stopping Docker Services..."
	docker-compose down

logs:
	docker-compose logs -f

build:
	@echo ">>> Building Docker Services..."
	docker-compose build

dev-back:
	@echo ">>> Starting Backend Server..."
	cd $(BACKEND_DIR) && uv run python manage.py runserver

dev-front:
	@echo ">>> Starting Frontend Server..."
	cd $(FRONTEND_DIR) && pnpm run dev

migrate:
	@echo ">>> Running Migrations..."
	cd $(BACKEND_DIR) && uv run python manage.py migrate

superuser:
	@echo ">>> Creating Superuser (admin/admin)..."
	cd $(BACKEND_DIR) && uv run python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')"

test:
	@echo ">>> Running Backend Tests..."
	cd $(BACKEND_DIR) && uv run python manage.py test

build-front:
	@echo ">>> Building Frontend..."
	cd $(FRONTEND_DIR) && pnpm run build

clean:
	@echo ">>> Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf $(FRONTEND_DIR)/dist
	@echo "Done."
