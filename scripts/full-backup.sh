#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_DIR="/var/www/genealogy-app/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="genealogy_v0.7.0_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Создаем директорию для бэкапа
mkdir -p "$BACKUP_PATH"
mkdir -p "$BACKUP_PATH"/{server,client,uploads,database,scripts,docs}

echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}📦 ПОЛНАЯ РЕЗЕРВНАЯ КОПИЯ ПРОЕКТА v0.7.0${NC}"
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

# 3. Бэкап исходного кода backend
echo -e "\n${YELLOW}3️⃣  Сохраняем исходный код backend...${NC}"
cp -r server/src "$BACKUP_PATH/server/"
cp server/package.json "$BACKUP_PATH/server/"
cp server/package-lock.json "$BACKUP_PATH/server/"
cp server/tsconfig.json "$BACKUP_PATH/server/"
echo -e "${GREEN}   ✅ Backend сохранен${NC}"

# 4. Бэкап исходного кода frontend
echo -e "\n${YELLOW}4️⃣  Сохраняем исходный код frontend...${NC}"
cp -r client/src "$BACKUP_PATH/client/"
cp client/package.json "$BACKUP_PATH/client/"
cp client/package-lock.json "$BACKUP_PATH/client/"
cp client/index.html "$BACKUP_PATH/client/"
cp client/tsconfig.json "$BACKUP_PATH/client/"
cp client/vite.config.ts "$BACKUP_PATH/client/"
echo -e "${GREEN}   ✅ Frontend сохранен${NC}"

# 5. Бэкап скриптов
echo -e "\n${YELLOW}5️⃣  Сохраняем скрипты...${NC}"
if [ -d "scripts" ]; then
    cp -r scripts "$BACKUP_PATH/"
    echo -e "${GREEN}   ✅ Скрипты сохранены${NC}"
fi

# 6. Git информация
echo -e "\n${YELLOW}6️⃣  Сохраняем информацию о Git...${NC}"
if [ -d ".git" ]; then
    git log -50 --pretty=format:"%h - %an, %ar : %s" > "$BACKUP_PATH/docs/git_log.txt"
    git tag > "$BACKUP_PATH/docs/git_tags.txt"
    git branch > "$BACKUP_PATH/docs/git_branches.txt"
    git status > "$BACKUP_PATH/docs/git_status.txt"
    echo -e "${GREEN}   ✅ Git информация сохранена${NC}"
else
    echo "   ⚠️ Git репозиторий не найден"
fi

# 7. Информационный файл
echo -e "\n${YELLOW}7️⃣  Создаем информационный файл...${NC}"

cat > "$BACKUP_PATH/README.md" << INFO
# 🌳 Genealogy App - Резервная копия v0.7.0

## 📋 Информация
- **Дата создания:** $(date)
- **Версия:** 0.7.0
- **Название:** Статистика и аналитика

## 📊 Статистика базы данных
- 👥 Людей: ${PERSONS_COUNT:-0}
- 🔗 Отношений: ${RELATIONS_COUNT:-0}
- 📸 Фотографий: ${PHOTOS_COUNT:-0}

## 🛠 Технологии
### Backend
- Node.js + Express + TypeScript
- SQLite + Sequelize ORM
- Multer для загрузки файлов

### Frontend
- React 19 + TypeScript
- Vite (сборщик)
- vis-network (визуализация дерева)
- Axios (HTTP клиент)

## ✨ Реализованный функционал
- ✅ Управление людьми (CRUD)
- ✅ Управление отношениями (родитель, супруг, брат/сестра)
- ✅ Визуализация семейного дерева (интерактивное)
- ✅ Загрузка и управление фотографиями
- ✅ Поиск и фильтрация людей
- ✅ Статистика и аналитика (v0.7.0)

## 📁 Структура бэкапа
\`\`\`
${BACKUP_NAME}/
├── server/          # Backend код
├── client/          # Frontend код
├── uploads/         # Загруженные фотографии
├── database/        # База данных SQLite
├── scripts/         # Вспомогательные скрипты
└── docs/            # Документация и Git информация
\`\`\`

## 🚀 Восстановление
\`\`\`bash
# Распаковать архив
tar -xzf ${BACKUP_NAME}.tar.gz

# Восстановить файлы
cp -r ${BACKUP_NAME}/server/* /var/www/genealogy-app/server/
cp -r ${BACKUP_NAME}/client/* /var/www/genealogy-app/client/
cp -r ${BACKUP_NAME}/uploads/* /var/www/genealogy-app/server/uploads/
cp ${BACKUP_NAME}/database/database.sqlite /var/www/genealogy-app/server/

# Установить зависимости
cd /var/www/genealogy-app/server && npm install
cd /var/www/genealogy-app/client && npm install

# Запустить
cd /var/www/genealogy-app/server && npm run dev
cd /var/www/genealogy-app/client && npm run dev
\`\`\`

## 🔗 API Endpoints
- \`GET /api/health\` - проверка сервера
- \`GET /api/persons\` - список людей
- \`POST /api/persons\` - создать человека
- \`GET /api/relationships\` - список отношений
- \`POST /api/photos/:personId\` - загрузить фото

## 📝 Последние изменения (v0.7.0)
- Добавлен раздел статистики
- Общая статистика по людям и отношениям
- Распределение по полу (круговая диаграмма)
- Топ многодетных родителей
- Счетчик поколений
INFO

echo -e "${GREEN}   ✅ Информационный файл создан${NC}"

# 8. Создаем архив
echo -e "\n${YELLOW}8️⃣  Создаем архив...${NC}"
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# 9. Подсчет размера
SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)

echo -e "\n${GREEN}✅ ПОЛНАЯ РЕЗЕРВНАЯ КОПИЯ СОЗДАНА!${NC}"
echo -e "${BLUE}========================================${NC}"
echo "   📦 Архив: ${BACKUP_NAME}.tar.gz"
echo "   📁 Папка: $BACKUP_DIR/"
echo "   📊 Размер: $SIZE"
echo -e "${BLUE}========================================${NC}"

# 10. Очистка старых бэкапов (оставляем последние 10)
echo -e "\n${YELLOW}🧹 Очистка старых бэкапов...${NC}"
cd "$BACKUP_DIR"
ls -t *.tar.gz 2>/dev/null | tail -n +11 | while read file; do
    echo "   Удаление: $file"
    rm -f "$file"
done

REMAINING=$(ls -1 *.tar.gz 2>/dev/null | wc -l)
echo -e "${GREEN}   ✅ Осталось бэкапов: $REMAINING${NC}"

echo -e "\n${GREEN}✅ ГОТОВО! Версия 0.7.0 сохранена${NC}"
