# 🚀 City Delivery Backend

Backend API для системы доставки продуктов из дарксторов.

## 🏗️ Архитектура

- **Node.js + Express** - веб-сервер
- **PostgreSQL** - база данных
- **Socket.io** - real-time обновления
- **JWT** - авторизация

## 📋 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Создайте файл `.env` в корне папки `backend/`:

```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=city_delivery
DB_USER=admin
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars

# Сервер
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 3. Настройка базы данных

#### Вариант 1: Через Docker
```bash
docker-compose up -d postgres
```

#### Вариант 2: Локально
```bash
# Создать базу данных
createdb city_delivery

# Применить схему
psql city_delivery < src/database/schema.sql
```

### 4. Проверка подключения

```bash
node src/database/test-connection.js
```

### 5. Запуск сервера

```bash
# Development (с автоперезагрузкой)
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Текущий пользователь

### Товары
- `GET /api/products` - Список товаров
- `GET /api/products/:id` - Товар по ID
- `GET /api/products/categories/list` - Список категорий
- `GET /api/products/categories/grouped` - Товары по категориям

### Заказы
- `POST /api/orders` - Создать заказ (требует авторизации)
- `GET /api/orders/my-orders` - Мои заказы
- `GET /api/orders/:id` - Заказ по ID
- `PATCH /api/orders/:id/status` - Обновить статус

### Health Check
- `GET /api/health` - Проверка работоспособности

## 🔐 Авторизация

Все защищенные маршруты требуют заголовок:
```
Authorization: Bearer <access_token>
```

## 📝 Структура проекта

```
backend/
├── src/
│   ├── config/          # Конфигурация (БД, etc)
│   ├── database/        # Схема БД и миграции
│   ├── middleware/      # Express middleware
│   ├── routes/          # API маршруты
│   ├── services/        # Бизнес-логика
│   ├── utils/           # Утилиты
│   └── websocket/       # WebSocket обработчики
├── server.js            # Главный файл
└── package.json
```

## 🧪 Тестирование

### Проверка подключения к БД
```bash
node src/database/test-connection.js
```

### Тестирование API (с помощью curl)

```bash
# Health check
curl http://localhost:5000/api/health

# Регистрация
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test User"}'

# Вход
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Получение товаров
curl http://localhost:5000/api/products
```

## 🐛 Отладка

Логи выводятся в консоль. В development режиме логируются все запросы к БД.

## 📚 Документация

- [Архитектура](../ARCHITECTURE.md)
- [План разработки](../DEVELOPMENT_PLAN.md)

