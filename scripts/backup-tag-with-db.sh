#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="/var/www/genealogy-app/backups/git-backups"
mkdir -p "$BACKUP_DIR"

# Функция для создания резервной копии
create_backup() {
    local version=$1
    local description=$2
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}📦 СОЗДАНИЕ РЕЗЕРВНОЙ КОПИИ v$version${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # 1. Git операции
    echo -e "\n${YELLOW}1️⃣  Сохраняем код в Git...${NC}"
    
    # Проверяем, есть ли изменения
    if [[ -n $(git status -s) ]]; then
        echo "   Есть незакоммиченные изменения. Коммитим..."
        git add .
        git commit -m "Backup before v$version: $description"
    fi
    
    # Создаем тег
    git tag -a "$version" -m "$description"
    echo -e "${GREEN}   ✅ Git тег создан: $version${NC}"
    
    # Отправляем на GitHub
    if git remote -v | grep -q origin; then
        git push origin "$version"
        echo -e "${GREEN}   ✅ Тег отправлен на GitHub${NC}"
    fi
    
    # 2. Бэкап базы данных
    echo -e "\n${YELLOW}2️⃣  Сохраняем базу данных...${NC}"
    
    DB_PATH="/var/www/genealogy-app/server/database.sqlite"
    if [ -f "$DB_PATH" ]; then
        # Создаем дамп базы
        DB_BACKUP="$BACKUP_DIR/db_${version}_${timestamp}.sql"
        sqlite3 "$DB_PATH" .dump > "$DB_BACKUP"
        echo -e "${GREEN}   ✅ Дамп базы создан: $(basename $DB_BACKUP)${NC}"
        
        # Создаем копию самого файла БД
        DB_FILE_BACKUP="$BACKUP_DIR/db_${version}_${timestamp}.sqlite"
        cp "$DB_PATH" "$DB_FILE_BACKUP"
        echo -e "${GREEN}   ✅ Копия БД создана: $(basename $DB_FILE_BACKUP)${NC}"
    else
        echo -e "${RED}   ❌ База данных не найдена!${NC}"
    fi
    
    # 3. Создаем полный архив проекта с БД
    echo -e "\n${YELLOW}3️⃣  Создаем полный архив проекта...${NC}"
    
    ARCHIVE_NAME="genealogy-full_${version}_${timestamp}.tar.gz"
    tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='backups' \
        /var/www/genealogy-app/
    
    echo -e "${GREEN}   ✅ Полный архив создан: $ARCHIVE_NAME${NC}"
    
    # 4. Создаем файл с информацией о бэкапе
    INFO_FILE="$BACKUP_DIR/info_${version}_${timestamp}.txt"
    cat > "$INFO_FILE" << INFO
========================================
📋 ИНФОРМАЦИЯ О РЕЗЕРВНОЙ КОПИИ
========================================
Версия:      $version
Дата:        $(date)
Описание:    $description
Автор:       $USER

📦 Git:
  - Тег:      $version
  - Коммит:   $(git rev-parse --short HEAD)

🗄️ База данных:
  - Дамп:     db_${version}_${timestamp}.sql
  - Копия:    db_${version}_${timestamp}.sqlite

📁 Полный архив:
  - Файл:     $ARCHIVE_NAME
  - Размер:   $(du -h "$BACKUP_DIR/$ARCHIVE_NAME" | cut -f1)

📊 Статистика:
  - Люди:     $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM persons;" 2>/dev/null || echo "N/A")
  - Отношения: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM relationships;" 2>/dev/null || echo "N/A")
========================================
INFO
    
    echo -e "\n${GREEN}✅ РЕЗЕРВНАЯ КОПИЯ УСПЕШНО СОЗДАНА!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "📁 Все файлы сохранены в: $BACKUP_DIR/"
    echo -e "📄 Информация: $(basename $INFO_FILE)"
    echo -e "${BLUE}========================================${NC}"
    
    # Выводим содержимое информационного файла
    echo ""
    cat "$INFO_FILE"
}

# Функция для просмотра всех бэкапов
list_backups() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}📋 ДОСТУПНЫЕ РЕЗЕРВНЫЕ КОПИИ${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    if [ -d "$BACKUP_DIR" ]; then
        echo -e "\n${YELLOW}Git теги:${NC}"
        git tag -l | sort -V
        
        echo -e "\n${YELLOW}Архивы с БД:${NC}"
        ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
        
        echo -e "\n${YELLOW}Дампы БД:${NC}"
        ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    else
        echo "Бэкапов пока нет"
    fi
}

# Функция для восстановления
restore_backup() {
    local version=$1
    
    echo -e "${YELLOW}🔄 Восстановление версии $version${NC}"
    echo -e "${RED}ВНИМАНИЕ: Это перезапишет текущие файлы и БД!${NC}"
    read -p "Продолжить? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Находим архив
        ARCHIVE=$(ls "$BACKUP_DIR"/genealogy-full_${version}_*.tar.gz 2>/dev/null | head -1)
        
        if [ -f "$ARCHIVE" ]; then
            # Распаковываем архив
            tar -xzf "$ARCHIVE" -C /var/www/
            echo "✅ Код восстановлен"
            
            # Восстанавливаем БД из дампа
            DB_DUMP=$(ls "$BACKUP_DIR"/db_${version}_*.sql 2>/dev/null | head -1)
            if [ -f "$DB_DUMP" ]; then
                rm -f /var/www/genealogy-app/server/database.sqlite
                sqlite3 /var/www/genealogy-app/server/database.sqlite < "$DB_DUMP"
                echo "✅ База данных восстановлена"
            fi
            
            echo -e "${GREEN}✅ Восстановление завершено!${NC}"
        else
            echo "❌ Архив для версии $version не найден"
        fi
    fi
}

# Основная логика
case $1 in
    create)
        if [ $# -eq 3 ]; then
            create_backup "$2" "$3"
        else
            echo "Использование: $0 create <версия> <описание>"
            echo "Пример: $0 create v0.4.0 \"Добавлена визуализация дерева\""
        fi
        ;;
    auto)
        # Автоматическое создание с увеличением patch версии
        # Получаем последний тег
        last_tag=$(git tag -l | sort -V | tail -1)
        if [ -z "$last_tag" ]; then
            last_tag="v0.0.0"
        fi
        
        # Увеличиваем patch версию
        version=${last_tag#v}
        IFS='.' read -r major minor patch <<< "$version"
        patch=$((patch + 1))
        new_version="v$major.$minor.$patch"
        
        create_backup "$new_version" "Автоматический бэкап перед новым функционалом"
        ;;
    list)
        list_backups
        ;;
    restore)
        if [ $# -eq 2 ]; then
            restore_backup "$2"
        else
            echo "Использование: $0 restore <версия>"
        fi
        ;;
    *)
        echo "Использование: $0 {create|auto|list|restore}"
        echo ""
        echo "  create <версия> <описание>  - создать полный бэкап"
        echo "  auto                         - автоматический бэкап"
        echo "  list                         - показать все бэкапы"
        echo "  restore <версия>             - восстановить из бэкапа"
        ;;
esac
