# Frontend Next.js

Миграция frontend (Create React App) → frontend-next (Next.js 15)

## Статус миграции

### ✅ Фаза 1: Утилиты и типы (завершено)
- [x] `lib/format.ts` - утилиты форматирования
- [x] `types/product.ts` - типы продуктов
- [x] `types/cart.ts` - типы корзины
- [x] `types/index.ts` - единая точка экспорта
- [x] `lib/constants.ts` - константы (адаптировано для Next.js)

### ✅ Фаза 2: Простые UI компоненты (завершено)
- [x] `lib/icon-sizes.ts` - размеры иконок (зависимость)
- [x] `app/components/shared/ui/PriceDisplay.tsx` - отображение цены (Server Component)
- [x] `app/components/shared/ui/QuantityControls.tsx` - управление количеством (Client Component)
- [x] `app/test-components/page.tsx` - тестовая страница для проверки компонентов

**Изменения:**
- CSS модули заменены на Tailwind классы
- PriceDisplay - Server Component (нет интерактивности)
- QuantityControls - Client Component с `'use client'` (framer-motion, event handlers)
- Сохранена вся функциональность и UX

### ✅ Фаза 3: Хуки (завершено)
- [x] `lib/logger.ts` - утилита логирования (улучшена: префиксы, временные метки)
- [x] `lib/storage.ts` - сервис для работы с localStorage (Client Component)
- [x] `app/hooks/useCartActions.ts` - хук для действий с корзиной (Client Component)
- [x] `app/hooks/useProductFilters.ts` - хук для фильтрации и сортировки продуктов (Client Component)
- [x] `app/test-hooks/page.tsx` - тестовая страница для проверки хуков
- [x] `app/demo-products/page.tsx` - демо-страница с полной интеграцией
- [x] `lib/placeholders.ts` - утилиты для локальных SVG placeholder'ов (замена via.placeholder.com)

**Изменения:**
- Все хуки помечены как Client Components (`'use client'`)
- StorageService адаптирован для Next.js (проверка `typeof window`)
- Импорты обновлены на алиасы `@/` вместо относительных путей
- Сохранена вся функциональность и оптимизации
- Исправлены все предупреждения ESLint
- Logger улучшен: префиксы, временные метки, уровни логирования
- **Замена внешних placeholder'ов:** `via.placeholder.com` заменен на локальные SVG data URI (`lib/placeholders.ts`)
- **Преимущества:** не требуют интернета, работают в любой стране, быстрая загрузка

### ✅ Фаза 4: Сложные компоненты (завершено)
- [x] `app/components/product/ProductCardPremium.tsx` - премиум карточка товара (Client Component)
- [x] `app/components/product/ProductGrid.tsx` - сетка товаров с фильтрацией (Client Component)
- [x] `app/test-phase4/page.tsx` - тестовая страница для проверки компонентов
- [x] `tailwind.config.ts` - добавлены анимации shimmer и fadeIn

**Изменения:**
- CSS модули заменены на Tailwind классы
- `ProductCardPremium` - Client Component с framer-motion, useState, useEffect
- `ProductGrid` - Client Component с useMemo для оптимизации
- Использованы уже мигрированные компоненты: `PriceDisplay`, `QuantityControls`, `useCartActions`
- Заменены внешние placeholder'ы на локальные (`getPlaceholderByCategory`)
- Использован `next/image` для реальных изображений, обычный `<img>` для data URI
- Сохранена вся функциональность: анимации, badges, quick view, оптимизация производительности
- React.memo для оптимизации ре-рендеров
- Все проверки пройдены: type-check ✅, lint ✅

### ✅ Фаза 5: Формы (завершено)
- [x] `lib/phoneMask.ts` - утилиты для работы с маской телефона
- [x] `app/services/authService.ts` - сервис авторизации (временная версия, будет заменена на API Routes)
- [x] `app/services/orderService.ts` - сервис заказов (временная версия, будет заменена на API Routes)
- [x] `app/components/auth/LoginForm.tsx` - форма входа/регистрации (Client Component)
- [x] `app/components/order/OrderForm.tsx` - форма оформления заказа (Client Component)
- [x] `app/test-phase5/page.tsx` - тестовая страница для проверки форм
- [x] `tailwind.config.ts` - добавлена анимация slideUp

**Изменения:**
- CSS модули заменены на Tailwind классы
- `LoginForm` - Client Component с framer-motion, useState, useEffect
- `OrderForm` - Client Component с useState для управления состоянием
- Использованы уже мигрированные компоненты: `PriceDisplay`, `logger`
- Мигрированы утилиты: `phoneMask` (formatPhone, validatePhone, handlePhoneChange)
- Созданы временные сервисы `authService` и `orderService` (будут заменены на API Routes в Фазе 8)
- Сохранена вся функциональность: email/password, phone/OTP, Telegram авторизация, геолокация
- Адаптированы для Next.js: проверки `typeof window`, `typeof navigator` для SSR
- Все проверки пройдены: type-check ✅, lint ✅

### ✅ Фаза 7: Тестирование (завершено)
- [x] `vitest.config.mjs` - конфигурация Vitest
- [x] `vitest.setup.ts` - настройка тестовой среды
- [x] `lib/__tests__/format.test.ts` - тесты для утилит форматирования (8 тестов)
- [x] `app/components/shared/ui/__tests__/PriceDisplay.test.tsx` - тесты для компонента цены (4 теста)
- [x] `app/components/shared/ui/__tests__/QuantityControls.test.tsx` - тесты для компонента количества (5 тестов)
- [x] `app/hooks/__tests__/useCartActions.test.ts` - тесты для хука действий корзины (4 теста)
- [x] `app/hooks/__tests__/useCart.test.ts` - тесты для хука корзины (6 тестов)
- [x] `package.json` - добавлены скрипты: `test`, `test:ui`, `test:coverage`, `test:run`

**Изменения:**
- Настроена тестовая среда: Vitest + React Testing Library + happy-dom
- Созданы тесты для утилит, компонентов и хуков
- Все тесты проходят: ✅ 27 тестов, 5 файлов
- Исправлена логика `formatPriceWithDiscount` для корректной обработки скидок >100%
- Добавлены моки для Next.js router и next/image
- Все проверки пройдены: type-check ✅, lint ✅, test ✅

### ✅ Фаза 6: Модальные окна (завершено)
- [x] `app/components/cart/CartItems.tsx` - список товаров в корзине (Client Component, обновлен согласно референсу)
- [x] `app/components/cart/CartEmptyState.tsx` - пустое состояние корзины (Client Component, упрощено)
- [x] `app/components/cart/CartFooter.tsx` - футер корзины с кнопкой оплаты (Client Component, новый)
- [x] `app/components/skeleton/CartSkeleton.tsx` - skeleton для корзины (Client Component)
- [x] `app/components/cart/CartModal.tsx` - модальное окно корзины (Client Component, обновлен)
- [x] `app/test-phase6/page.tsx` - тестовая страница для проверки модального окна
- [x] `tailwind.config.ts` - добавлена анимация scaleIn
- [x] `design/cart/cart-reference.md` - описание дизайна корзины (референс)

**Изменения:**
- CSS модули заменены на Tailwind классы
- `CartModal` - Client Component с framer-motion, AnimatePresence
- `CartItems` - обновлен согласно референсу из `design/cart/`:
  - Изображение слева с количеством поверх (белый прямоугольник)
  - Название товара (жирный черный)
  - Цена (жирный черный)
  - Детали справа (серый текст, поддержка веса и штук)
  - Кнопка "Edit" вместо удаления
  - Разделители между товарами
- `CartModal` - упрощен заголовок (только "Cart" по центру)
- `CartFooter` - новый компонент с синей кнопкой оплаты:
  - "Together to pay" и сумма слева
  - Иконка стрелки справа
- `CartEmptyState` - упрощено, убрана зависимость от useCartStore
- Использован `next/image` для изображений товаров
- Сохранена вся функциональность: анимации, адаптивность, обработка событий
- Адаптивный дизайн: мобильная версия (slideUp), десктопная версия (scaleIn)
- **Дизайн обновлен согласно референсу из `design/cart/`**
- Все проверки пройдены: type-check ✅, lint ✅

**Примечание:** `AuthModal` не найден - `LoginForm` уже используется как модальное окно

### ✅ Фаза 7: Страницы (ЗАВЕРШЕНО)

**Мигрированные страницы:**
- `app/products/page.tsx` - основная страница с товарами:
  - Использует хуки useProducts, useCart, useProductFilters
  - Интегрирует ProductGrid для отображения товаров
  - Поддерживает фильтрацию и поиск
  - Адаптивный дизайн (мобильная/десктопная версии)
- `app/cart/page.tsx` - страница корзины:
  - Использует CartModal для отображения корзины
  - Интегрирует логику оформления заказа
- `app/order/page.tsx` - страница оформления заказа:
  - Использует OrderForm для ввода данных заказа
  - Показывает страницу успеха после оформления

**Созданные хуки:**
- `app/hooks/useProducts.ts` - загрузка продуктов с сервера
- `app/hooks/useCart.ts` - управление корзиной (добавление, удаление, обновление)
- `app/hooks/useNotifications.ts` - управление уведомлениями

**Созданные компоненты:**
- `app/components/skeleton/ProductSkeleton.tsx` - скелетон для товаров при загрузке

**Обновления:**
- `app/services/orderService.ts` - добавлена функция `placeOrder` для совместимости

**Проверки:**
- `type-check` — 0 ошибок ✅
- `lint` — 0 ошибок ✅

### ✅ Фаза 8: API Routes (ЗАВЕРШЕНО)

**Созданные API Routes:**
- `app/api/products/route.ts` - проксирование запросов к backend для получения продуктов
- `app/api/orders/route.ts` - проксирование запросов для создания заказов
- `app/api/auth/register/route.ts` - регистрация пользователей
- `app/api/auth/login/route.ts` - вход пользователей
- `app/api/auth/phone/send-code/route.ts` - отправка OTP кода на телефон
- `app/api/auth/phone/verify/route.ts` - верификация OTP кода
- `app/api/auth/telegram/route.ts` - авторизация через Telegram

**Обновленные сервисы:**
- `app/hooks/useProducts.ts` - теперь использует `/api/products` вместо прямого запроса к backend
- `app/services/orderService.ts` - теперь использует `/api/orders` вместо прямого запроса к backend
- `app/services/authService.ts` - теперь использует `/api/auth/*` вместо прямых запросов к backend

**Особенности:**
- Все API Routes проксируют запросы к backend API
- Добавлена обработка ошибок подключения и таймаутов
- Использован AbortController для совместимости с Node.js
- Добавлено кэширование для продуктов (60 секунд)
- Все запросы теперь идут через Next.js API Routes, что обеспечивает единую точку входа

**Проверки:**
- `type-check` — 0 ошибок ✅
- `lint` — 0 ошибок ✅

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Структура

```
frontend-next/
├── app/              # Next.js App Router
├── design/            # UI референсы (скриншоты для разработки)
│   ├── cart/         # Референсы корзины
│   ├── products/     # Референсы продуктов
│   ├── forms/        # Референсы форм
│   └── general/      # Общие референсы
├── lib/              # Утилиты
├── types/            # TypeScript типы
└── components/       # React компоненты (будет создано)
```

## Тестирование компонентов

После установки зависимостей и запуска dev сервера:

### 1. Тест компонентов UI
- **URL:** [http://localhost:3000/test-components](http://localhost:3000/test-components)
- Проверьте отображение PriceDisplay с разными размерами и скидками
- Проверьте QuantityControls с разными вариантами и состояниями
- Попробуйте интерактивно изменить количество в контролах

### 2. Тест хуков
- **URL:** [http://localhost:3000/test-hooks](http://localhost:3000/test-hooks)
- Проверьте работу `useCartActions` (добавление/удаление товаров)
- Проверьте работу `useProductFilters` (поиск, фильтры, сортировка)
- Интеграция хуков с компонентами

### 3. Демо-страница (полная интеграция)
- **URL:** [http://localhost:3000/demo-products](http://localhost:3000/demo-products)
- Полная интеграция всех мигрированных компонентов и хуков
- Sticky корзина с общей суммой
- Сетка товаров с изображениями
- Боковая панель фильтров
- Реальный пример использования в продакшене

### 4. Тест Фазы 4 (сложные компоненты)
- **URL:** [http://localhost:3000/test-phase4](http://localhost:3000/test-phase4)
- Проверка `ProductCardPremium` с анимациями и badges
- Проверка `ProductGrid` с фильтрацией и состояниями
- Интеграция с корзиной и обработчиками событий

### 5. Тест Фазы 5 (формы)
- **URL:** [http://localhost:3000/test-phase5](http://localhost:3000/test-phase5)
- Проверка `LoginForm` с email/password и phone/OTP методами
- Проверка `OrderForm` с геолокацией и оформлением заказа
- Интеграция с уведомлениями и обработчиками событий

### 6. Тест Фазы 6 (модальные окна)
- **URL:** [http://localhost:3000/test-phase6](http://localhost:3000/test-phase6)
- Проверка `CartModal` с анимациями и состояниями
- Проверка `CartItems` с управлением количеством
- Проверка `CartEmptyState` для пустой корзины
- Интеграция с `OrderForm` и обработчиками событий

**Важно:** Все тестовые страницы - Client Components (`'use client'`), так как используют хуки и передают event handlers. Это правильный паттерн для Next.js 15.

## UI Референсы

Для разработки компонентов используются референсы из `frontend-next/design/`:

### Как использовать

1. **Добавьте скриншоты** в соответствующие папки (например: `design/cart/cart-modal.png`)
2. **Назовите файлы** понятно (kebab-case: `cart-modal-desktop.png`)
3. **Я буду использовать их** как основу для разработки и адаптации под Tailwind CSS

### Структура

- `design/cart/` - референсы корзины (модальное окно, список товаров, пустое состояние)
- `design/products/` - референсы продуктов (карточки, сетка, фильтры)
- `design/forms/` - референсы форм (авторизация, оформление заказа)
- `design/general/` - общие референсы (цвета, типографика, spacing)

Подробнее: [frontend-next/design/README.md](./design/README.md)

## Проверка после каждой фазы

После завершения каждой фазы миграции **обязательно** выполните проверки:

```bash
# Полная проверка (рекомендуется)
npm run verify

# Или по отдельности
npm run type-check  # Проверка типов TypeScript
npm run lint        # Проверка линтера ESLint
npm run check:deps  # Проверка зависимостей
```

**Или используйте скрипт проверки:**
```bash
npm run check-phase
```

**Подробный чеклист:** см. [PHASE_CHECKLIST.md](./PHASE_CHECKLIST.md)

### Автоматизация

- **CI/CD:** Проверки автоматически выполняются в GitHub Actions (`.github/workflows/ci.yml`)
- **Pre-commit:** Можно настроить через husky (см. PHASE_CHECKLIST.md)

---

## Следующие шаги

Согласно `.cursor/rules/migration-frontend-next.md`, следующая фаза:
- Фаза 7: Миграция страниц (ProductsPage, CartPage, OrderPage)
- Фаза 8: Создание API Routes для проксирования к backend (заменит временные сервисы)
