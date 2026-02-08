#!/bin/bash
# scripts/setup-permissions.sh

set -e  # Остановка при ошибке

echo "🔧 Setting up permissions for genealogy-app..."

# Определяем корень проекта (автоматически)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Project root: $PROJECT_ROOT"

# Проверяем существование основных директорий
if [ ! -d "$PROJECT_ROOT/server" ]; then
    echo "❌ Error: server directory not found!"
    exit 1
fi

# Устанавливаем владельца (текущий пользователь)
echo "Setting owner to $(whoami)..."
sudo chown -R $(whoami):$(whoami) "$PROJECT_ROOT" 2>/dev/null || true

# Права для директорий
echo "Setting directory permissions..."
find "$PROJECT_ROOT" -type d -exec chmod 755 {} \;

# Специальные права для ключевых директорий
echo "Setting special permissions..."

# Директории для записи
WRITABLE_DIRS=(
    "$PROJECT_ROOT/logs"
    "$PROJECT_ROOT/uploads"
    "$PROJECT_ROOT/backups"
    "$PROJECT_ROOT/server/src"
)

for dir in "${WRITABLE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  Setting 775 for: $dir"
        chmod 775 "$dir"
    else
        echo "  ⚠️ Directory not found: $dir"
        mkdir -p "$dir"
        chmod 775 "$dir"
    fi
done

# Файлы
echo "Setting file permissions..."
find "$PROJECT_ROOT" -type f -exec chmod 644 {} \;

# Исполняемые скрипты
echo "Making scripts executable..."
find "$PROJECT_ROOT/scripts" -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true

# .env файлы (строгие права)
echo "Securing .env files..."
for env_file in "$PROJECT_ROOT"/.env* "$PROJECT_ROOT"/server/.env* "$PROJECT_ROOT"/client/.env*; do
    if [ -f "$env_file" ]; then
        chmod 640 "$env_file"
        echo "  Secured: $env_file"
    fi
done

# Проверяем
echo ""
echo "✅ Permissions summary:"
echo "======================="
ls -ld "$PROJECT_ROOT"
echo ""
echo "Key directories:"
for dir in "${WRITABLE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        ls -ld "$dir"
    fi
done

echo ""
echo "✅ Permissions setup complete!"
