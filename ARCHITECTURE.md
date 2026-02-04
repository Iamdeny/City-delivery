# Архитектура City Delivery

Модульный монолит + Clean Architecture. Цель: изолировать домены **orders**, **inventory**, **users**, **audit** так, чтобы при необходимости их можно было выделить в микросервисы с минимальными изменениями.

---

## 1. Принципы

- **Модульный монолит:** один деплой/процесс, жёсткие границы внутри кода.
- **Clean Architecture:** зависимости направлены внутрь:
  - **domain** ← **application** ← **interfaces / infrastructure**
- **Без скрытых связей:**
  - Модуль `orders` не импортирует инфраструктуру `inventory` (DB/Redis) напрямую.
  - Взаимодействие только через **порты** (gateway / repository / publisher).
- **Composition root:** сборка зависимостей только в `server.js` и `modules/*/index.js`.

---

## 2. Границы модулей

| Модуль | Зона ответственности | Владение данными |
|--------|----------------------|-------------------|
| **users** | Auth (email/password, OTP, Telegram), профиль, роли, политики | `users`, `refresh_tokens` и т.п. |
| **inventory** | Каталог, остатки, резервации, склады (dark_stores) | `products`, `inventory_reservations`, `dark_stores` |
| **orders** | Жизненный цикл заказа, статусы, курьер/сборщик, события | `orders`, `order_items`, курьеры, возвраты |
| **audit** | Аудит событий (действия пользователей, изменения) | таблицы аудита |

Правило: `orders` не обращается к таблицам inventory напрямую — только через **InventoryGateway** (резерв/подтверждение/освобождение).

---

## 3. Целевая структура модуля (backend)

```
backend/src/modules/<module>/
├── application/
│   ├── queries/          # Чтение (ListXxx, GetXxx)
│   └── useCases/         # Команды (CreateOrder, UpdateOrderStatus, …)
├── interfaces/http/       # Express-роутеры (публичные и admin*.router.js)
└── infrastructure/
    ├── postgres/         # Репозитории (реализация портов)
    ├── queue/            # Очереди (при необходимости)
    └── ...                # Внешние адаптеры
```

Общий shared-kernel: `backend/src/utils/` (logger, metrics), `middleware/`, `validators/`.

---

## 4. Правила зависимостей

- **domain** — не импортирует Express/DB/Redis/HTTP.
- **application** — только порты (OrderRepository, InventoryGateway, QueuePublisher и т.д.).
- **interfaces/http** — без бизнес-логики: аутентификация, валидация ввода, вызов use-case, маппинг DTO.
- **infrastructure** — реализует порты (Postgres, Redis, очередь).

---

## 5. Контракты между модулями

- В монолите: модуль A вызывает B только через порт, например:
  - `orders` → `InventoryGateway.reserve/confirm/release`
  - `orders` → `QueuePublisher` (уведомления, аналитика)
- При переходе к микросервисам тот же порт заменяется адаптером (HTTP/gRPC/Kafka). Use-case не меняется.

---

## 6. Когда выделять микросервисы

Обычно при выполнении **не менее 2 из 3** условий:

- **Независимые релизы:** >30–40% релизов блокируются изменениями в другом домене.
- **Разная нагрузка/масштаб:** catalog читается в 10–50× чаще orders; разный профиль масштабирования.
- **Изоляция отказов/SLA:** падение некритичного сервиса не должно ломать создание заказа.

Первые кандидаты на выделение: **catalog/products**, затем **inventory**; **orders** — позже (оркестратор, много связей).

---

## 7. Чеклист для PR (архитектура)

- [ ] Код в правильном модуле (`modules/<module>/...`)
- [ ] Нет прямых импортов инфраструктуры другого модуля
- [ ] Use-case не зависит от Express/DB
- [ ] Внешние взаимодействия через порты (gateway/repository/publisher)
- [ ] Бизнес-правила в application/domain, а не в route

---

## 8. Текущее состояние (2026)

### Backend

- **Точка входа:** `backend/server.js` — composition root, монтирует модульные роутеры и legacy routes.
- **Модули (Clean Architecture):**
  - **users** — ListUsers, UpdateUserAdmin; auth (в т.ч. Telegram) через legacy `routes/auth.js`.
  - **inventory** — dark_stores, список товаров/резерваций; CreateDarkStore, UpdateDarkStore; роутеры: dark-stores, inventory, admin dark-stores.
  - **orders** — CreateOrder, UpdateOrderStatus, AssignCourierToOrder, ReturnOrder; запросы: ListLiveOrders, ListOrdersByStore, GetReturnSummary; общение с inventory через gateway.
  - **audit** — ListAuditEvents; admin-роутер аудита.
- **Legacy:** `src/routes/` (auth, cart, checkout, orders, payments, products, tracking) и `src/services/` (checkout, inventory, orderDispatcher, payment, queue, telegramAuth и т.д.) — постепенно переносятся в модули.
- **WebSocket:** `src/websocket/socketHandler.js` — real-time статусы заказов, курьер.
- **Инфраструктура:** PostgreSQL, миграции в `src/database/migrations/`, опционально Redis, pgbouncer (docker-compose).

### Frontend

- **frontend/** — legacy (Create React App + React 19), источник миграции.
- **frontend-next/** — основной веб (Next.js 15 App Router):
  - Клиент: каталог, корзина, заказ, категории, фильтры, поиск.
  - Ops (админка): `app/ops/` — склады (warehouses), заказы (live dashboard), пользователи, аудит; модульная структура (page, *Client.tsx, types).
  - API: BFF-прокси в `app/api/` (auth, products, orders, dark-stores, health, geocode и т.д.).
- **collector/** и **courier/** — вспомогательные приложения (App.js).

### Стек

- **Backend:** Node.js, Express, PostgreSQL, Socket.io, JWT.
- **Frontend-next:** Next.js 15, React 18, TypeScript, Tailwind, shadcn/ui, Vitest.
- **Инфра:** Docker (PostgreSQL, Redis, pgbouncer), скрипты запуска (start-dev.ps1, start-postgres.ps1 и т.д.).

---

## 9. Обзор системы

**Цель продукта:** MVP доставки продуктов из дарксторов (модель Samokat / Uber Eats).  
**Масштаб:** быстрая доставка 15–30 минут.

### Основные приложения

- **Клиент (frontend-next):** каталог, корзина, оформление заказа, отслеживание в реальном времени, профиль.
- **Ops (frontend-next/app/ops):** управление складами, заказами, пользователями, аудит.
- **Курьер / сборщик:** отдельные приложения (courier/, collector/) или расширение ops.

### Жизненный цикл заказа (упрощённо)

1. Клиент создаёт заказ → 2. Назначение склада (по геолокации) → 3. Очередь сборки → 4. Назначение сборщика → 5. Сборка → 6. Готов к доставке → 7. Назначение курьера → 8. Курьер забирает и доставляет → 9. Заказ завершён (или возврат).

---

## 10. Backend: структура каталогов

```
backend/
├── server.js
├── src/
│   ├── config/           # database.js, delivery.js
│   ├── database/         # schema.sql, migrations/, migrate.js
│   ├── middleware/       # auth.js
│   ├── modules/
│   │   ├── users/        # application, interfaces/http, infrastructure/postgres
│   │   ├── inventory/    # + infrastructure/inventoryGateway.js
│   │   ├── orders/       # + infrastructure/queue, delivery
│   │   └── audit/
│   ├── routes/           # auth, cart, checkout, orders, payments, products, tracking (legacy)
│   ├── services/         # checkout, inventory, orderDispatcher, payment, queue, telegramAuth, …
│   ├── validators/
│   ├── utils/            # logger, metrics
│   └── websocket/        # socketHandler.js
└── scripts/              # seed-data, arch-lint, ops-smoke, …
```

---

## 11. База данных (основное)

- **users**, **refresh_tokens** — пользователи и сессии.
- **products**, **dark_stores**, **inventory_reservations** — каталог и склады.
- **orders**, **order_items** — заказы; курьеры и сборщики (связанные таблицы).
- **Аудит, платежи** — отдельные схемы/миграции в `src/database/`.

Индексы: по статусу заказов, по складу, по времени создания, по геолокации при необходимости.

---

## 12. Авторизация

- JWT (access + refresh), роль в payload.
- Роли: customer, courier, picker, admin, manager.
- Админские эндпоинты под префиксом `/api/admin/`, проверка роли в middleware.

---

## 13. Real-time (WebSocket)

- События для клиента: обновление статуса заказа, назначение курьера, местоположение курьера.
- Для курьера/сборщика: новый заказ, отмена, обновление маршрута.
- Для админа: новый заказ, статусы, алерты.

---

## 14. Масштабирование и безопасность

- **Сейчас:** монолит, PostgreSQL, опционально Redis, WebSocket.
- **Дальше:** при росте нагрузки — выделение catalog/inventory в отдельные сервисы, очереди (Kafka/RabbitMQ), репликация БД.
- **Безопасность:** HTTPS, валидация входных данных, rate limiting, CORS, секреты не в коде.

---

## 15. Следующие шаги

- Перенос оставшейся логики из `routes/` и `services/` в модули (orders, inventory, users).
- Продолжение миграции UI с frontend на frontend-next (см. `.cursor/rules/migration-frontend-next.md`).
- Усиление типизации (Zod/OpenAPI) и сквозных метрик/observability.
