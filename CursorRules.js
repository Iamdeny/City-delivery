// CursorRules.js
// Глобальные правила для ИИ-помощника в этом репо

module.exports = {
  schemaVersion: 1,

  // Общая стратегия
  project: {
    name: 'city-delivery',
    goal: 'Современная доставка уровня топ‑игроков рынка к 2026 году',
  },

  // Главные приоритеты (сильнее всего влияют на предлагаемые решения)
  priorities: [
    // ★★★★★
    {
      id: 'architecture-modular',
      level: 5,
      title: 'Микросервисы или модульный монолит',
      mustHave: true,
      why: 'Масштаб, независимые релизы, разные нагрузки между подсистемами.',
      prefer: [
        'NestJS / Fastify для Node.js сервисов',
        'Go / Spring Boot для высоконагруженных частей',
        'gRPC / Kafka для сервис‑ту‑сервис коммуникаций',
      ],
      rules: [
        'Не предлагать «толстый» монолит как основное направление, только как временный шаг.',
        'Структурировать код по bounded context (auth, orders, billing, catalog, delivery, notifications).',
        'При добавлении новых фич предлагать вынос в отдельный модуль или сервис, если домен явно обособлен.',
      ],
    },

    {
      id: 'realtime-everywhere',
      level: 5,
      title: 'Реал-тайм всё: заказы, курьер, чат',
      mustHave: true,
      why: 'Пользователи не прощают задержек >2–3 секунд. Real‑time — норма UX.',
      prefer: [
        'WebSocket + Socket.IO',
        'GraphQL Subscriptions',
        'Kafka + Redis Pub/Sub как транспорт событий',
      ],
      rules: [
        'Для любых статусов заказов, трекинга курьера, чата и уведомлений по умолчанию предлагать real‑time.',
        'Polling использовать только как временный fallback, сразу предлагать план миграции на WebSocket/Subscriptions.',
      ],
    },

    {
      id: 'strong-typing-e2e',
      level: 5,
      title: 'Strong typing end‑to‑end',
      mustHave: true,
      why: 'Сильная типизация на всём пути запрос → БД сильно снижает баги и ускоряет доработки через полгода.',
      prefer: [
        'TypeScript везде, где это возможно',
        'Zod для валидации и инференса типов',
        'tRPC / GraphQL Codegen / OpenAPI + TS‑клиенты',
      ],
      rules: [
        'Не предлагать новые участки кода на JS без причины — по умолчанию TypeScript.',
        'Для новых endpoint’ов всегда описывать типы запросов/ответов и схему валидации (Zod, OpenAPI, GraphQL).',
        'Предпочитать решения, где типы шарятся между фронтом и бэком (tRPC, codegen).',
      ],
    },

    // ★★★★½
    {
      id: 'multitenant-rbac',
      level: 4.5,
      title: 'Мультитенантная архитектура + мульти-роли',
      mustHave: true,
      why: 'Отдельные роли: Клиент / Ресторан / Курьер / Оператор / Админ. Готовность к SaaS‑мультиаренде.',
      prefer: [
        'RBAC поверх JWT',
        'Casbin / Permify / собственный policy‑layer',
        'Чёткие subdomain’ы (customer, courier, admin, restaurant)',
      ],
      rules: [
        'При добавлении эндпоинтов всегда указывать, какие роли имеют доступ.',
        'Не хардкодить права в UI; выносить в централизованный policy‑слой.',
      ],
    },

    {
      id: 'geo-routing',
      level: 4.5,
      title: 'Геопоиск + маршрутизация уровня production',
      mustHave: true,
      why: 'Логистика — самая дорогая часть. Гео и маршрутизация критичны для unit‑экономики.',
      prefer: [
        'PostGIS поверх PostgreSQL',
        'pg_trgm для fuzzy‑поиска по адресам',
        'Redis Geo',
        'GraphHopper / OSRM / Valhalla для маршрутов',
      ],
      rules: [
        'Все координаты и гео‑данные хранить так, чтобы их можно было использовать в PostGIS.',
        'Не зашивать логику маршрутизации в один сервис — думать о возможности смены движка.',
      ],
    },

    // ★★★★
    {
      id: 'ai-ml-light',
      level: 4,
      title: 'AI/ML фичи light уже на старте',
      mustHave: false,
      why: 'Персонализация может дать +25–40% к среднему чеку.',
      prefer: [
        'Простые рекомендательные модели (LightFM, Matrix Factorization)',
        'TensorFlow.js на фронте, если это оправдано',
        'Готовые облачные API (Vertex AI, Bedrock, OpenAI)',
      ],
      rules: [
        'При проектировании каталога и заказов оставлять хуки для событий: просмотры, клики, корзина, отказы.',
        'Предлагать MVP‑схемы рекомендаций (похожие товары, бандлы, персональные подборки).',
      ],
    },

    {
      id: 'pwa-native-like',
      level: 4,
      title: 'PWA + native-like опыт',
      mustHave: true,
      why: 'Пользователи ставят сервис на главный экран и ожидают ощущение «как приложение».',
      prefer: [
        'Next.js App Router',
        'Tailwind + shadcn/ui',
        'PWABuilder / Workbox',
        'Push‑уведомления + Web Share Target',
      ],
      rules: [
        'Все новые фронтовые фичи проектировать с учётом offline‑ и мобильного UX.',
        'Следить за размером бандла и TTFB; по умолчанию SSR/ISR вместо жирного CSR.',
      ],
    },

    {
      id: 'event-driven-cqrs-lite',
      level: 4,
      title: 'Event-driven + CQRS lite',
      mustHave: true,
      why: 'Заказы, статусы, финансы, аналитика — разные потоки, разные SLA.',
      prefer: [
        'Kafka / RabbitMQ / Redis Streams',
        'Outbox Pattern для надёжной доставки событий',
      ],
      rules: [
        'Важные изменения заказов и платежей оформлять как события (order.created, payment.captured и т.д.).',
        'Отделять команды (фиксация состояния) и запросы (чтение, отчёты) хотя бы логически.',
      ],
    },

    // ★★★
    {
      id: 'serverless-edge',
      level: 3,
      title: 'Serverless + edge там, где это даёт выгоду',
      mustHave: false,
      why: 'Быстрый старт и меньше DevOps‑нагрузки.',
      prefer: [
        'Vercel / Cloudflare Workers / Fly.io',
        'Lambda@Edge для тяжёлых задач ближе к пользователю',
      ],
      rules: [
        'Для простых API и публичных страниц рассматривать serverless/edge в приоритете.',
        'Учитывать холодные старты и лимиты провайдера при выборе архитектуры.',
      ],
    },

    {
      id: 'observability-otel',
      level: 3,
      title: 'OpenTelemetry + observability',
      mustHave: true,
      why: 'В production без наблюдаемости любая отладка превращается в ад.',
      prefer: [
        'OpenTelemetry для трейсов, логов и метрик',
        'Grafana Tempo / Loki / Prometheus / Jaeger',
      ],
      rules: [
        'Каждый новый сервис и ключевой use‑case снабжать трейсами и метриками.',
        'Не предлагать «просто console.log» для production‑проблем — только как временный шаг.',
      ],
    },

    // ★★½
    {
      id: 'ai-voice-conversational',
      level: 2.5,
      title: 'AI Voice ordering / conversational UI',
      mustHave: false,
      why: 'Уже появляется у лидеров, важно быть готовым интегрировать.',
      prefer: [
        'Groq / OpenAI Realtime API',
        'ElevenLabs + VAD для голоса',
      ],
      rules: [
        'При проектировании API для заказов учитывать возможность голосовых/диалоговых клиентов.',
      ],
    },

    {
      id: 'zero-trust-security',
      level: 2.5,
      title: 'Zero-trust security + secrets management',
      mustHave: true,
      why: 'Платежи и персональные данные — высокая регуляторика и риски.',
      prefer: [
        'HashiCorp Vault / AWS SSM / GCP Secret Manager',
        'Keycloak / Auth0 / Clerk',
      ],
      rules: [
        'Не хранить секреты в .env, если речь о production — только менеджеры секретов.',
        'Продумывать сегментацию ролей и минимально необходимые права для сервисов.',
      ],
    },

    // ★★
    {
      id: 'dark-kitchen-support',
      level: 2,
      title: 'Поддержка dark kitchen / cloud kitchen',
      mustHave: false,
      why: 'Растущий сегмент, который может потребовать отдельные рабочие процессы.',
      rules: [
        'В моделях ресторана и кухни предусматривать поддержку нескольких зон/брендов на одну кухню.',
      ],
    },

    {
      id: 'subscriptions-model',
      level: 2,
      title: 'Subscription модель (типа DashPass)',
      mustHave: false,
      why: 'Даёт стабильный доход в 2025–2027 и повышает LTV.',
      prefer: [
        'Stripe Subscriptions / аналоги',
        'Собственный слой entitlement‑логики',
      ],
      rules: [
        'При проектировании биллинга предусматривать возможность подписок и уровней лояльности.',
      ],
    },
  ],

  // Как ассистент должен принимать решения в Cursor
  assistant: {
    // Общие принципы
    principles: [
      'По умолчанию предлагать решения, совместимые с модульным монолитом или микросервисами.',
      'Везде, где возможно, усиливать типизацию и валидацию данных.',
      'Считать real‑time UX нормой, а не опциональной фичой.',
      'Стараться не усложнять stack ради моды: предлагать конкретную пользу для бизнеса.',
    ],

    // Предпочитаемые технологии при генерации кода/советов
    techPreferences: {
      backend: ['NestJS', 'Fastify', 'Node.js + TypeScript', 'PostgreSQL + PostGIS'],
      messaging: ['Kafka', 'RabbitMQ', 'Redis Pub/Sub', 'Redis Streams'],
      typing: ['TypeScript', 'Zod', 'tRPC', 'GraphQL Codegen', 'OpenAPI codegen'],
      frontend: ['Next.js 15 App Router', 'React 18 Server Components', 'Tailwind', 'shadcn/ui'],
      infra: ['Docker', 'Turborepo', 'Vercel', 'Railway', 'Fly.io'],
    },

    // Что избегать
    avoid: [
      'Предлагать stateful монолит без чёткой причинно-следственной связи.',
      'Добавлять новые части системы без типов и схем валидации.',
      'Игнорировать real‑time, если флоу связан с заказами, статусами или деньгами.',
    ],
  },

  // Правила миграции frontend → frontend-next
  migration: {
    from: 'frontend/ (Create React App + React 19)',
    to: 'frontend-next/ (Next.js 15 + App Router)',
    
    // Стратегия миграции
    strategy: {
      approach: 'incremental', // Постепенная миграция, не big bang
      parallel: true, // Старый и новый фронтенд работают параллельно
      testBeforeRemove: true, // Удалять старый код только после проверки нового
    },

    // Правила для компонентов
    componentRules: [
      {
        step: 1,
        title: 'Анализ зависимостей',
        rules: [
          'Перед миграцией компонента проанализировать все его зависимости (hooks, utils, services, types).',
          'Мигрировать зависимости перед компонентом (снизу вверх).',
          'Создать карту зависимостей: компонент → хуки → утилиты → типы → сервисы.',
        ],
      },
      {
        step: 2,
        title: 'Структура файлов',
        rules: [
          'frontend/src/components/ → frontend-next/app/components/',
          'frontend/src/hooks/ → frontend-next/app/hooks/',
          'frontend/src/shared/lib/ → frontend-next/lib/',
          'frontend/src/shared/types/ → frontend-next/types/',
          'frontend/src/services/ → frontend-next/app/services/ (или API routes)',
        ],
      },
      {
        step: 3,
        title: 'Client vs Server Components',
        rules: [
          'По умолчанию Server Component (без "use client").',
          'Добавлять "use client" только если: useState, useEffect, event handlers, браузерные API, framer-motion.',
          'Разделять на Server (данные) и Client (интерактивность) части компонента.',
        ],
      },
      {
        step: 4,
        title: 'Стилизация',
        rules: [
          'Удалять CSS модули и CSS файлы.',
          'Заменять на Tailwind классы.',
          'Использовать shadcn/ui компоненты вместо кастомных (Button, Card, Input, Dialog и т.д.).',
          'Сохранять существующую функциональность и UX.',
        ],
      },
      {
        step: 5,
        title: 'Роутинг',
        rules: [
          'React Router → Next.js App Router (file-based routing).',
          'useNavigate() → router.push() из next/navigation.',
          'useParams() → params из Server Component или useParams() из next/navigation.',
          'useSearchParams() → searchParams из Server Component или useSearchParams() из next/navigation.',
        ],
      },
      {
        step: 6,
        title: 'Data Fetching',
        rules: [
          'useEffect + fetch → Server Components с async/await или Server Actions.',
          'TanStack Query → оставить для Client Components, но предпочитать Server Components где возможно.',
          'API вызовы → Next.js API Routes (app/api/) для проксирования к существующему backend.',
        ],
      },
      {
        step: 7,
        title: 'State Management',
        rules: [
          'Zustand → оставить для глобального состояния (корзина, auth).',
          'Локальный state → useState (Client Components) или Server Components с props.',
          'URL state → searchParams и router.push() вместо локального state где возможно.',
        ],
      },
    ],

    // Правила для утилит и библиотек
    utilityRules: [
      {
        category: 'formatting',
        from: 'frontend/src/shared/lib/format.ts',
        to: 'frontend-next/lib/format.ts',
        rules: [
          'Копировать как есть, без изменений (чистые функции).',
          'Экспортировать именованные функции, не default.',
        ],
      },
      {
        category: 'types',
        from: 'frontend/src/shared/types/',
        to: 'frontend-next/types/',
        rules: [
          'Копировать типы как есть.',
          'Убедиться, что типы совместимы с Next.js (нет React Router типов).',
        ],
      },
      {
        category: 'constants',
        from: 'frontend/src/config/constants.ts',
        to: 'frontend-next/lib/constants.ts',
        rules: [
          'Адаптировать BASE_URL под Next.js (process.env.NEXT_PUBLIC_API_URL).',
          'Сохранить структуру ENDPOINTS, TIMEOUTS, STORAGE_KEYS.',
        ],
      },
    ],

    // Правила для API интеграции
    apiRules: [
      {
        step: 1,
        title: 'Временное решение',
        rules: [
          'Создать Next.js API Routes (app/api/*/route.ts) для проксирования к существующему backend.',
          'Использовать fetch с next: { revalidate } для кэширования.',
          'Сохранить существующие endpoints без изменений.',
        ],
      },
      {
        step: 2,
        title: 'Долгосрочное решение',
        rules: [
          'После миграции всех компонентов внедрить tRPC для end-to-end типизации.',
          'Или GraphQL Codegen, если tRPC не подходит.',
        ],
      },
    ],

    // Чеклист для каждого компонента
    checklist: [
      '✅ Проанализированы все зависимости компонента',
      '✅ Зависимости мигрированы перед компонентом',
      '✅ Компонент разделён на Server и Client части (если нужно)',
      '✅ CSS модули заменены на Tailwind',
      '✅ Использованы shadcn/ui компоненты где возможно',
      '✅ Роутинг адаптирован под App Router',
      '✅ Data fetching переведён на Server Components или API Routes',
      '✅ Типы проверены и обновлены',
      '✅ Компонент протестирован в изоляции',
      '✅ Компонент интегрирован в страницу/роут',
    ],

    // Порядок миграции (от простого к сложному)
    migrationOrder: [
      {
        phase: 1,
        name: 'Утилиты и типы',
        items: ['lib/format.ts', 'types/*.ts', 'lib/constants.ts'],
        priority: 'high',
      },
      {
        phase: 2,
        name: 'Простые UI компоненты',
        items: ['PriceDisplay', 'QuantityControls', 'Badge', 'Button'],
        priority: 'high',
      },
      {
        phase: 3,
        name: 'Хуки',
        items: ['useCartActions', 'useProductFilters', 'useAuth'],
        priority: 'high',
      },
      {
        phase: 4,
        name: 'Сложные компоненты',
        items: ['ProductCardPremium', 'ProductGrid', 'FiltersSidebar'],
        priority: 'medium',
      },
      {
        phase: 5,
        name: 'Формы',
        items: ['LoginForm', 'OrderForm'],
        priority: 'medium',
      },
      {
        phase: 6,
        name: 'Модальные окна',
        items: ['CartModal', 'AuthModal'],
        priority: 'medium',
      },
      {
        phase: 7,
        name: 'Страницы',
        items: ['ProductsPage', 'CartPage', 'OrderPage'],
        priority: 'low',
      },
      {
        phase: 8,
        name: 'API Routes',
        items: ['app/api/products/route.ts', 'app/api/orders/route.ts', 'app/api/auth/route.ts'],
        priority: 'high',
      },
    ],

    // Важные замечания
    warnings: [
      'Не удалять старый код до полной проверки нового.',
      'Тестировать каждый компонент в изоляции перед интеграцией.',
      'Сохранять существующую функциональность и UX.',
      'Документировать изменения в процессе миграции.',
      'Использовать TypeScript strict mode для выявления проблем.',
    ],

    // Правила обновления документации
    documentation: {
      required: true,
      files: [
        'frontend-next/README.md',
        'frontend-next/PHASE_CHECKLIST.md',
      ],
      rules: [
        'После любых изменений в frontend-next/ ОБЯЗАТЕЛЬНО обновлять README.md и PHASE_CHECKLIST.md.',
        'В README.md обновлять секцию "Статус миграции" с новыми файлами и изменениями.',
        'В PHASE_CHECKLIST.md обновлять соответствующий раздел фазы с деталями изменений, исправлений и результатов проверок.',
        'Добавлять информацию о новых файлах, исправленных ошибках, предупреждениях ESLint.',
        'Обновлять дату "Последнее обновление" в PHASE_CHECKLIST.md.',
        'Если созданы новые утилиты или зависимости, документировать их в README.md.',
        'Если исправлены критические ошибки, добавить их в раздел "Исправления" соответствующей фазы.',
      ],
      when: [
        'После завершения каждой фазы миграции',
        'После исправления ошибок или предупреждений',
        'После добавления новых файлов или компонентов',
        'После изменения структуры проекта',
        'После обновления зависимостей',
      ],
    },

    // Правила использования UI референсов
    uiReferences: {
      path: 'frontend-next/design/',
      structure: {
        cart: 'frontend-next/design/cart/',
        products: 'frontend-next/design/products/',
        forms: 'frontend-next/design/forms/',
        general: 'frontend-next/design/general/',
      },
      rules: [
        'Перед разработкой/миграцией компонента ПРОВЕРЯТЬ наличие референсов в frontend-next/design/',
        'Если есть скриншоты UI в frontend-next/design/, использовать их как основу для разработки',
        'Адаптировать дизайн из референсов под Tailwind CSS, сохраняя визуальную идентичность',
        'Сохранять все UX паттерны, анимации и интерактивность из референсов',
        'Если референсов нет, использовать существующий дизайн компонента как основу',
        'При расхождении между референсом и текущим кодом - приоритет у референса',
        'Документировать использование референсов в комментариях компонента',
      ],
      fileFormats: ['png', 'jpg', 'jpeg', 'webp'],
      naming: 'kebab-case (например: cart-modal-desktop.png)',
    },
  },
};
