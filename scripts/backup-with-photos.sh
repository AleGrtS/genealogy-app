#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_DIR="/var/www/genealogy-app/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="genealogy_full_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Создаем директорию для бэкапа
mkdir -p "$BACKUP_PATH"
mkdir -p "$BACKUP_PATH"/{server,client,uploads,database}

echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}📦 СОЗДАНИЕ ПОЛНОЙ РЕЗЕРВНОЙ КОПИИ${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Время: $(date)"
echo "Путь: $BACKUP_PATH"

# 1. Бэкап базы данных
echo -e "\n${YELLOW}1️⃣  Сохраняем базу данных...${NC}"
if [ -f "server/database.sqlite" ]; then
    cp server/database.sqlite "$BACKUP_PATH/database/"
    sqlite3 server/database.sqlite .dump > "$BACKUP_PATH/database/database_dump.sql"
    
    # Получаем статистику
    PERSONS_COUNT=$(sqlite3 server/database.sqlite "SELECT COUNT(*) FROM persons;" 2>/dev/null || echo "0")
    PHOTOS_COUNT=$(sqlite3 server/database.sqlite "SELECT COUNT(*) FROM photos;" 2>/dev/null || echo "0")
    RELATIONS_COUNT=$(sqlite3 server/database.sqlite "SELECT COUNT(*) FROM relationships;" 2>/dev/null || echo "0")
    
    echo -e "${GREEN}   ✅ База данных сохранена${NC}"
    echo "      👥 Людей: $PERSONS_COUNT"
    echo "      📸 Фото: $PHOTOS_COUNT"
    echo "      🔗 Отношений: $RELATIONS_COUNT"
else
    echo -e "${RED}   ❌ База данных не найдена${NC}"
fi

# 2. Бэкап загруженных фото
echo -e "\n${YELLOW}2️⃣  Сохраняем загруженные фотографии...${NC}"
if [ -d "server/uploads" ]; then
    cp -r server/uploads "$BACKUP_PATH/uploads/"
    PHOTO_FILES=$(find server/uploads -type f | wc -l)
    echo -e "${GREEN}   ✅ Фото сохранены: $PHOTO_FILES файлов${NC}"
else
    echo "   ⚠️ Папка uploads не найдена"
fi

# 3. Бэкап исходного кода
echo -e "\n${YELLOW}3️⃣  Сохраняем исходный код...${NC}"

# Копируем server
cp -r server/src "$BACKUP_PATH/server/"
cp server/package.json "$BACKUP_PATH/server/"
cp server/package-lock.json "$BACKUP_PATH/server/"

# Копируем client
cp -r client/src "$BACKUP_PATH/client/"
cp client/package.json "$BACKUP_PATH/client/"
cp client/package-lock.json "$BACKUP_PATH/client/"
cp client/index.html "$BACKUP_PATH/client/"

# Копируем общие файлы
cp -r shared "$BACKUP_PATH/" 2>/dev/null || echo "   ⚠️ Папка shared не найдена"

echo -e "${GREEN}   ✅ Исходный код сохранен${NC}"

# 4. Git информация
echo -e "\n${YELLOW}4️⃣  Сохраняем информацию о Git...${NC}"
if [ -d ".git" ]; then
    git log -1 > "$BACKUP_PATH/git_last_commit.txt"
    git tag > "$BACKUP_PATH/git_tags.txt"
    git branch > "$BACKUP_PATH/git_branches.txt"
    echo -e "${GREEN}   ✅ Git информация сохранена${NC}"
else
    echo "   ⚠️ Git репозиторий не найден"
fi

# 5. Информационный файл
echo -e "\n${YELLOW}5️⃣  Создаем информационный файл...${NC}"

cat > "$BACKUP_PATH/README.txt" << INFO
========================================
🌳 GENEALOGY APP - ПОЛНАЯ РЕЗЕРВНАЯ КОПИЯ
========================================

📅 Дата создания: $(date)
📁 Версия: v0.6.0 (с загрузкой фото)

📊 СТАТИСТИКА:
   👥 Людей: ${PERSONS_COUNT:-0}
   📸 Фотографий: ${PHOTOS_COUNT:-0}
   🔗 Отношений: ${RELATIONS_COUNT:-0}

📂 СТРУКТУРА:
   server/    - Backend код (Node.js + Express)
   client/    - Frontend код (React + TypeScript)
   uploads/   - Загруженные фотографии
   database/  - База данных SQLite

🔧 ФУНКЦИОНАЛ:
   ✅ Управление людьми (CRUD)
   ✅ Управление отношениями
   ✅ Визуализация семейного дерева
   ✅ Поиск и фильтрация
   ✅ Загрузка фотографий
   ✅ Интерактивное дерево

🚀 ЗАПУСК ПРОЕКТА:
   1. Backend: cd server && npm install && npm run dev
   2. Frontend: cd client && npm install && npm run dev
   3. Открыть: http://localhost:5173

📝 ЗАВИСИМОСТИ:
   Backend: express, sequelize, sqlite3, multer, uuid
   Frontend: react, typescript, axios, vis-network

========================================
INFO

echo -e "${GREEN}   ✅ Информационный файл создан${NC}"

# 6. Создаем архив
echo -e "\n${YELLOW}6️⃣  Создаем архив...${NC}"
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# 7. Подсчет размера
SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)

echo -e "\n${GREEN}✅ ПОЛНАЯ РЕЗЕРВНАЯ КОПИЯ СОЗДАНА!${NC}"
echo -e "${BLUE}========================================${NC}"
echo "   📦 Архив: ${BACKUP_NAME}.tar.gz"
echo "   📁 Папка: $BACKUP_DIR/"
echo "   📊 Размер: $SIZE"
echo -e "${BLUE}========================================${NC}"

# 8. Очистка старых бэкапов (оставляем последние 10)
echo -e "\n${YELLOW}🧹 Очистка старых бэкапов...${NC}"
cd "$BACKUP_DIR"
ls -t *.tar.gz 2>/dev/null | tail -n +11 | while read file; do
    echo "   Удаление: $file"
    rm -f "$file"
done

REMAINING=$(ls -1 *.tar.gz 2>/dev/null | wc -l)
echo -e "${GREEN}   ✅ Осталось бэкапов: $REMAINING${NC}"

echo -e "\n${GREEN}✅ ГОТОВО!${NC}"
