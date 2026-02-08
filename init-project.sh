#!/bin/bash
# init-project.sh - Полная инициализация проекта

set -e

echo "🚀 Initializing Genealogy App Project"
echo "====================================="

# 1. Создание структуры
echo "1. Creating project structure..."
DIRS=(
    client/public
    client/src/components
    client/src/pages
    client/src/services
    client/src/hooks
    client/src/context
    client/src/utils
    client/src/types
    client/src/assets
    server/src/config
    server/src/controllers
    server/src/models
    server/src/routes
    server/src/middleware
    server/src/database
    server/src/migrations
    server/src/seeders
    server/src/services
    server/src/utils
    server/src/types
    shared/types
    shared/utils
    docker/postgres
    docker/nginx
    scripts
    docs
    logs/backend
    logs/frontend
    logs/database
    uploads/photos
    uploads/documents
    uploads/temp
    backups/database
    backups/daily
    backups/weekly
)

for dir in "${DIRS[@]}"; do
    mkdir -p "$dir"
    echo "  ✓ Created: $dir"
done

# 2. Создание основных файлов
echo ""
echo "2. Creating configuration files..."

# .gitignore
cat > .gitignore << 'EOF'
# Общие
.env
.env.local
.env.development
.env.production
node_modules/
dist/
build/
*.log
.DS_Store
Thumbs.db

# Бэкенд
server/.env
server/logs/
server/uploads/
server/temp/

# Фронтенд
client/.env
client/.env.local
client/.env.development
client/.env.production
client/build/

# База данных
*.db
*.sqlite
pgdata/
postgres_data/

# Идеи/наброски
.idea/
.vscode/
*.swp
*.swo

# Временные файлы
tmp/
temp/
EOF
echo "  ✓ Created: .gitignore"

# .env.example
cat > .env.example << 'EOF'
# ====================
# БАЗОВЫЕ НАСТРОЙКИ
# ====================
NODE_ENV=development
APP_NAME=GenealogyApp
APP_PORT=3001
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# ====================
# БАЗА ДАННЫХ
# ====================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=genealogy_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# ====================
# АУТЕНТИФИКАЦИЯ
# ====================
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# ====================
# ЗАГРУЗКА ФАЙЛОВ
# ====================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
EOF
echo "  ✓ Created: .env.example"

# README.md
cat > README.md << 'EOF'
# Genealogy App

Веб-приложение для построения генеалогического древа.

## Структура проекта
