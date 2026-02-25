#!/bin/bash
echo "🔍 Безопасное добавление файлов в Git..."

# Добавляем только исходный код
git add server/src/
git add client/src/
git add shared/
git add server/package.json server/package-lock.json
git add client/package.json client/package-lock.json
git add *.md
git add scripts/

echo "✅ Файлы добавлены. Статус:"
git status
