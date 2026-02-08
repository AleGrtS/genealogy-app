#!/bin/bash
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="genealogy_working_${TIMESTAMP}"

mkdir -p $BACKUP_DIR

echo "📦 Создание резервной копии: $BACKUP_NAME"

# Создаем архив, игнорируя ошибки если файлов нет
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  server/ client/ shared/ scripts/ 2>/dev/null || true

# Добавляем корневые файлы отдельно (если они есть)
for file in *.md *.json *.sh; do
  if [ -f "$file" ]; then
    tar -rf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "$file" 2>/dev/null || true
  fi
done

echo "✅ Резервная копия создана: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
ls -lh "$BACKUP_DIR/$BACKUP_NAME.tar.gz"
