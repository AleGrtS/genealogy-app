#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_DIR="/var/www/genealogy-app/backups/git-backups"
mkdir -p "$BACKUP_DIR"

# Конфигурация
MAX_BACKUPS=10           # Сколько последних бэкапов хранить
MAX_AGE_DAYS=30          # Максимальный возраст бэкапов в днях
AUTO_CLEAN=true          # Автоматически чистить старые бэкапы

# Функция для очистки старых бэкапов
cleanup_old_backups() {
    echo -e "\n${YELLOW}🧹 ОЧИСТКА СТАРЫХ РЕЗЕРВНЫХ КОПИЙ${NC}"
    
    # Считаем сколько бэкапов у нас есть
    local total_backups=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
    
    if [ "$total_backups" -eq 0 ]; then
        echo "   Нет бэкапов для очистки"
        return
    fi
    
    echo "   Всего бэкапов: $total_backups"
    
    # Вариант 1: Удаляем по количеству (оставляем только MAX_BACKUPS последних)
    if [ "$total_backups" -gt "$MAX_BACKUPS" ]; then
        echo "   Удаляем старые бэкапы (оставляем $MAX_BACKUPS последних)..."
        
        # Получаем список бэкапов, сортируем по дате и удаляем старые
        ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | while read file; do
            echo "     Удаление: $(basename "$file")"
            rm -f "$file"
            
            # Удаляем связанные файлы (дампы, инфо)
            base_name=$(basename "$file" .tar.gz | sed 's/genealogy-full_//')
            rm -f "$BACKUP_DIR"/db_${base_name}*.sql
            rm -f "$BACKUP_DIR"/db_${base_name}*.sqlite
            rm -f "$BACKUP_DIR"/info_${base_name}*.txt
        done
    fi
    
    # Вариант 2: Удаляем по дате (старше MAX_AGE_DAYS дней)
    if [ "$MAX_AGE_DAYS" -gt 0 ]; then
        echo "   Удаляем бэкапы старше $MAX_AGE_DAYS дней..."
        
        find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$MAX_AGE_DAYS | while read file; do
            echo "     Удаление (старый): $(basename "$file")"
            rm -f "$file"
            
            # Удаляем связанные файлы
            base_name=$(basename "$file" .tar.gz | sed 's/genealogy-full_//')
            rm -f "$BACKUP_DIR"/db_${base_name}*.sql
            rm -f "$BACKUP_DIR"/db_${base_name}*.sqlite
            rm -f "$BACKUP_DIR"/info_${base_name}*.txt
        done
    fi
    
    # Подсчитываем результат
    local remaining=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}   ✅ Осталось бэкапов: $remaining${NC}"
}

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
    
    if [[ -n $(git status -s) ]]; then
        echo "   Есть незакоммиченные изменения. Коммитим..."
        git add .
        git commit -m "Backup before v$version: $description"
    fi
    
    git tag -a "$version" -m "$description"
    echo -e "${GREEN}   ✅ Git тег создан: $version${NC}"
    
    if git remote -v | grep -q origin; then
        git push origin "$version"
        echo -e "${GREEN}   ✅ Тег отправлен на GitHub${NC}"
    fi
    
    # 2. Бэкап базы данных
    echo -e "\n${YELLOW}2️⃣  Сохраняем базу данных...${NC}"
    
    DB_PATH="/var/www/genealogy-app/server/database.sqlite"
    if [ -f "$DB_PATH" ]; then
        DB_BACKUP="$BACKUP_DIR/db_${version}_${timestamp}.sql"
        sqlite3 "$DB_PATH" .dump > "$DB_BACKUP"
        echo -e "${GREEN}   ✅ Дамп базы создан: $(basename $DB_BACKUP)${NC}"
        
        DB_FILE_BACKUP="$BACKUP_DIR/db_${version}_${timestamp}.sqlite"
        cp "$DB_PATH" "$DB_FILE_BACKUP"
        echo -e "${GREEN}   ✅ Копия БД создана: $(basename $DB_FILE_BACKUP)${NC}"
        
        # Получаем статистику для информационного файла
        PERSONS_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM persons;" 2>/dev/null || echo "N/A")
        RELATIONS_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM relationships;" 2>/dev/null || echo "N/A")
    else
        echo -e "${RED}   ❌ База данных не найдена!${NC}"
        PERSONS_COUNT="N/A"
        RELATIONS_COUNT="N/A"
    fi
    
    # 3. Создаем полный архив проекта
    echo -e "\n${YELLOW}3️⃣  Создаем полный архив проекта...${NC}"
    
    ARCHIVE_NAME="genealogy-full_${version}_${timestamp}.tar.gz"
    tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='backups' \
        -C /var/www \
        genealogy-app/ 2>/dev/null
    
    echo -e "${GREEN}   ✅ Полный архив создан: $ARCHIVE_NAME${NC}"
    ARCHIVE_SIZE=$(du -h "$BACKUP_DIR/$ARCHIVE_NAME" | cut -f1)
    
    # 4. Создаем информационный файл
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
  - Коммит:   $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")

🗄️ База данных:
  - Дамп:     db_${version}_${timestamp}.sql
  - Копия:    db_${version}_${timestamp}.sqlite
  - Записей:  👥 Люди: $PERSONS_COUNT | 🔗 Отношения: $RELATIONS_COUNT

📁 Полный архив:
  - Файл:     $ARCHIVE_NAME
  - Размер:   $ARCHIVE_SIZE

⚙️ Политика хранения:
  - Максимум бэкапов: $MAX_BACKUPS
  - Максимальный возраст: $MAX_AGE_DAYS дней
========================================
INFO
    
    echo -e "\n${GREEN}✅ РЕЗЕРВНАЯ КОПИЯ УСПЕШНО СОЗДАНА!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "📁 Все файлы сохранены в: $BACKUP_DIR/"
    echo -e "📄 Информация: $(basename $INFO_FILE)"
    echo -e "${BLUE}========================================${NC}"
    
    # Показываем информацию
    cat "$INFO_FILE"
    
    # Очистка старых бэкапов (если включена)
    if [ "$AUTO_CLEAN" = true ]; then
        cleanup_old_backups
    fi
}

# Функция для просмотра всех бэкапов
list_backups() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}📋 ДОСТУПНЫЕ РЕЗЕРВНЫЕ КОПИИ${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    if [ -d "$BACKUP_DIR" ]; then
        echo -e "\n${YELLOW}📦 Архивы:${NC}"
        ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{printf "  %s (%s)\n", $9, $5}' | sort -r
        
        echo -e "\n${YELLOW}🗄️  Дампы БД:${NC}"
        ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null | awk '{printf "  %s (%s)\n", $9, $5}' | sort -r | head -5
        
        local total=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
        local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
        
        echo -e "\n${GREEN}📊 Статистика:${NC}"
        echo "   Всего бэкапов: $total"
        echo "   Общий размер: $total_size"
        echo "   Папка: $BACKUP_DIR"
    else
        echo "Бэкапов пока нет"
    fi
}

# Функция для настройки политики хранения
configure_retention() {
    echo -e "${YELLOW}⚙️  Настройка политики хранения бэкапов${NC}"
    echo "========================================"
    echo "Текущие настройки:"
    echo "  MAX_BACKUPS = $MAX_BACKUPS (хранить последние N бэкапов)"
    echo "  MAX_AGE_DAYS = $MAX_AGE_DAYS (удалять старше N дней)"
    echo "  AUTO_CLEAN = $AUTO_CLEAN"
    echo ""
    echo "Введите новые значения (Enter - оставить текущее):"
    
    read -p "MAX_BACKUPS [$MAX_BACKUPS]: " new_max
    MAX_BACKUPS=${new_max:-$MAX_BACKUPS}
    
    read -p "MAX_AGE_DAYS [$MAX_AGE_DAYS]: " new_age
    MAX_AGE_DAYS=${new_age:-$MAX_AGE_DAYS}
    
    read -p "AUTO_CLEAN (true/false) [$AUTO_CLEAN]: " new_clean
    AUTO_CLEAN=${new_clean:-$AUTO_CLEAN}
    
    echo -e "${GREEN}✅ Настройки обновлены${NC}"
    
    # Применяем очистку с новыми настройками
    cleanup_old_backups
}

# Функция для ручной очистки
manual_cleanup() {
    echo -e "${YELLOW}🧹 РУЧНАЯ ОЧИСТКА${NC}"
    echo "========================================"
    
    local total=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
    local size=$(du -sh "$BACKUP_DIR" | cut -f1)
    
    echo "Сейчас в папке:"
    echo "  Бэкапов: $total"
    echo "  Размер: $size"
    echo ""
    echo "Варианты очистки:"
    echo "  1) Удалить все старше N дней"
    echo "  2) Оставить только N последних"
    echo "  3) Удалить конкретную версию"
    echo "  4) Удалить всё"
    echo "  5) Отмена"
    
    read -p "Выберите вариант (1-5): " choice
    
    case $choice in
        1)
            read -p "Удалить старше N дней (N): " days
            find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$days -delete
            find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$days -delete
            find "$BACKUP_DIR" -name "*.txt" -type f -mtime +$days -delete
            echo "✅ Удалено"
            ;;
        2)
            read -p "Оставить последних N: " keep
            ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +$((keep + 1)) | xargs rm -f
            echo "✅ Удалено"
            ;;
        3)
            list_backups
            read -p "Введите версию для удаления (например v0.3.2): " version
            rm -f "$BACKUP_DIR"/*${version}*.{tar.gz,sql,sqlite,txt}
            echo "✅ Удалено"
            ;;
        4)
            read -p "Точно удалить ВСЕ бэкапы? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                rm -rf "$BACKUP_DIR"/*
                echo "✅ Все бэкапы удалены"
            fi
            ;;
        *) echo "Отмена" ;;
    esac
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
        last_tag=$(git tag -l | sort -V | tail -1)
        if [ -z "$last_tag" ]; then
            last_tag="v0.0.0"
        fi
        
        version=${last_tag#v}
        IFS='.' read -r major minor patch <<< "$version"
        patch=$((patch + 1))
        new_version="v$major.$minor.$patch"
        
        create_backup "$new_version" "Автоматический бэкап перед новым функционалом"
        ;;
    list)
        list_backups
        ;;
    clean)
        cleanup_old_backups
        ;;
    clean-manual)
        manual_cleanup
        ;;
    config)
        configure_retention
        ;;
    *)
        echo "Использование: $0 {create|auto|list|clean|clean-manual|config}"
        echo ""
        echo "  create <версия> <описание>  - создать полный бэкап"
        echo "  auto                         - автоматический бэкап"
        echo "  list                         - показать все бэкапы"
        echo "  clean                        - автоматическая очистка старых"
        echo "  clean-manual                  - ручная очистка"
        echo "  config                       - настройка политики хранения"
        echo ""
        echo "Текущие настройки:"
        echo "  MAX_BACKUPS = $MAX_BACKUPS (хранить последние N)"
        echo "  MAX_AGE_DAYS = $MAX_AGE_DAYS (удалять старше N дней)"
        echo "  AUTO_CLEAN = $AUTO_CLEAN"
        ;;
esac
