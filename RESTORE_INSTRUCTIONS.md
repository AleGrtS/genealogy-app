# Инструкция по восстановлению проекта

## 📦 Восстановление из архива

1. **Создайте директорию:**
```bash
mkdir -p /var/www/genealogy-app
cd /var/www/genealogy-app

    Распакуйте архив:

bash

tar -xzvf genealogy-app-v1.0.0-YYYYMMDD.tar.gz
# или
unzip genealogy-app-v1.0.0-YYYYMMDD.zip

    Установите зависимости:

bash

cd server
npm install

    Запустите сервер:

bash

npm run dev

🔧 Первоначальная настройка

    Создайте файл .env:

bash

cp .env.example .env

    Проверьте права доступа:

bash

chmod 755 .
chmod 644 .env

    Запустите и проверьте:

bash

# Запуск сервера
cd server
npm run dev

# Проверка в другом терминале
curl http://localhost:3001/api/health
curl http://localhost:3001/api/persons

🧪 Тестовые данные

Для создания тестовых данных:
bash

curl -X POST http://localhost:3001/api/persons \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Тест","lastName":"Пользователь"}'

📁 Важные файлы

    server/src/index.ts - главный файл сервера

    server/src/models/Person.ts - модель данных

    server/src/controllers/person.controller.ts - логика API

    database.sqlite - файл базы данных (создается автоматически)
    




### 6. Проверим текущее состояние:

```bash
# Посмотрим что в архиве
tar -tzf ~/backups/genealogy-app-v1.0.0-*.tar.gz | head -20

# Создадим краткий отчет
echo "=== Отчет о проекте ==="
echo "Дата: $(date)"
echo "Версия: 1.0.0"
echo "API endpoints: 6"
echo "Модели: Person"
echo "База данных: SQLite"
echo "Тестовые данные: есть"
echo "Документация: README.md, CHANGELOG.md"
echo "Архив создан: ~/backups/"
echo "======================"
