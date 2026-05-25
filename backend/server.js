/**
 * Главный файл сервера (улучшенная версия)
 * Масштабируемая архитектура для MVP доставки продуктов
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const analyticsRouter = require('./src/routes/analytics');
const adminAnalyticsRouter = require('./src/routes/admin/analytics');

// Загрузка конфигурации и логгера
const config = require('./config');
const logger = require('./src/utils/logger');
const { metrics, metricsMiddleware } = require('./src/utils/metrics');

// Импорт модулей (модульный монолит)
const { authRouter, createAdminUsersRouter } = require('./src/modules/users');
const {
  createOrdersModule,
  createAdminOrdersRouter,
} = require('./src/modules/orders');
const {
  productsRouter,
  createInventoryGateway,
  createDarkStoresRouter,
  createInventoryRouter,
  createAdminDarkStoresRouter,
} = require('./src/modules/inventory');
const {
  createAuditLogger,
  createAdminAuditRouter,
} = require('./src/modules/audit');

// Импорт WebSocket обработчиков
const setupWebSocket = require('./src/websocket/socketHandler');

// Импорт сервисов (они сами управляют своим состоянием)
const queueService = require('./src/services/queueService');
const orderDispatcher = require('./src/services/orderDispatcher');

// ============ ПРОВЕРКА СОЕДИНЕНИЙ ============
async function checkConnections() {
  try {
    // Проверка БД
    const { query } = require('./src/config/database');
    await query('SELECT 1');
    logger.info('✅ Подключение к БД установлено');

    // Проверка Redis
    const redisClient = require('./src/config/redis');
    await redisClient.ping();
    logger.info('✅ Подключение к Redis установлено');
  } catch (error) {
    logger.error('❌ Ошибка подключения к базе данных:', error);
    process.exit(1);
  }
}

// ============ СОЗДАНИЕ ПРИЛОЖЕНИЯ ============
const app = express();
const server = http.createServer(app);

// Настройка Socket.io
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (config.env === 'development') return callback(null, true);
      if (!origin) return callback(null, true);
      const allowed = config.cors.allowedOrigins.some((allowed) =>
        allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
      );
      allowed
        ? callback(null, true)
        : callback(new Error('Not allowed by CORS'));
    },
    methods: config.cors.methods,
    credentials: config.cors.credentials,
  },
});

// ============ MIDDLEWARE ============

// Безопасность
app.use(helmet());

// Сжатие
app.use(compression());

// Доверие к прокси (для корректной работы rate limit)
app.set('trust proxy', 1);

// CORS для HTTP
app.use(
  cors({
    origin: (origin, callback) => {
      if (config.env === 'development') return callback(null, true);
      if (!origin) return callback(null, true);
      const allowed = config.cors.allowedOrigins.some((allowed) =>
        allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
      );
      if (allowed) {
        callback(null, true);
      } else {
        logger.warn(`[CORS] Запрос заблокирован от origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: config.cors.credentials,
  })
);

// Rate limiting
if (!(config.rateLimit.skipInDev && config.env === 'development')) {
  app.use(
    '/api/',
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: 'RATE_LIMITED',
          message: 'Слишком много запросов, попробуйте позже',
        });
      },
    })
  );
} else {
  logger.info('Rate limiting отключён в режиме разработки');
}

// Где-то после инициализации всех зависимостей
// require('./telegramBotAuth/telegramBot'); // просто импортируем, чтобы бот запустился

// Парсинг тела запроса
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Метрики
app.use(metricsMiddleware);

// ============ РОУТИНГ ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'City Delivery API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Метрики (in-memory snapshot)
app.get('/api/metrics', (req, res) => {
  res.json(metrics.snapshot());
});

// Инициализация модулей с DI
let auditLogger, inventoryGateway, ordersModule;
try {
  auditLogger = createAuditLogger();
  inventoryGateway = createInventoryGateway();
  ordersModule = createOrdersModule({
    inventoryGateway,
    queueService,
    auditLogger,
    orderDispatcher,
  });
} catch (error) {
  logger.error('❌ Ошибка инициализации модулей:', error);
  process.exit(1);
}

// Подключение роутеров
app.use('/api/auth', authRouter);
app.use('/api/admin', createAdminUsersRouter({ auditLogger }));
app.use('/api/orders', ordersModule.ordersRouter);
app.use(
  '/api/admin',
  createAdminOrdersRouter({ inventoryGateway, queueService, auditLogger })
);
app.use('/api/admin', createAdminDarkStoresRouter({ auditLogger }));
app.use('/api/admin', createAdminAuditRouter({ auditLogger }));
app.use('/api/products', productsRouter);
app.use('/api/dark-stores', createDarkStoresRouter());
app.use('/api/inventory', createInventoryRouter());

app.use('/api/admin/analytics', adminAnalyticsRouter);

// Дополнительные роутеры из модуля заказов
app.use('/api/cart', ordersModule.cartRouter);
app.use('/api/checkout', ordersModule.checkoutRouter);
app.use('/api/tracking', ordersModule.trackingRouter);

// Аналитика Функции Рекомендации в Корзине
app.use('/api/analytics', analyticsRouter);

// Статика для изображений
app.use('/uploads', express.static(config.uploadsDir));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден',
    path: req.path,
  });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  logger.error('Необработанная ошибка:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Внутренняя ошибка сервера',
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

// ============ WEBSOCKET ============
setupWebSocket(io);

// ============ ЗАПУСК СЕРВЕРА ============
async function startServer() {
  try {
    await checkConnections();

    server.listen(config.port, async () => {
      logger.info(`🚀 Сервер запущен на порту ${config.port}`);
      logger.info(
        `📡 API доступно по адресу: http://localhost:${config.port}/api`
      );
      logger.info(`📡 WebSocket доступен на ws://localhost:${config.port}`);
      logger.info(`🌍 Окружение: ${config.env}`);

      // Настройка повторяющихся задач
      try {
        await queueService.setupRecurringJobs();
        logger.info('⏰ Повторяющиеся задачи настроены');
      } catch (error) {
        logger.error('❌ Ошибка настройки повторяющихся задач:', error);
      }
    });
  } catch (error) {
    logger.error('❌ Не удалось запустить сервер:', error);
    process.exit(1);
  }
}

startServer();
// Cервис который раз в сутки пересчитывает популярность товаров на основе количества заказов за последние 30 дней
const cron = require('node-cron');
const updatePopularProducts = require('./cron/updatePopularProducts');

// Запускаем обновление популярных товаров каждый день в 3:00
cron.schedule('0 3 * * *', async () => {
  logger.info('🔄 Запуск обновления популярных товаров...');
  await updatePopularProducts();
});

// Также можно выполнить сразу при старте (опционально)
updatePopularProducts();

// ============ GRACEFUL SHUTDOWN ============
async function shutdown(signal) {
  logger.info(`${signal} получен, завершаем работу...`);

  try {
    // Закрываем очереди
    await queueService.close();

    // Закрываем HTTP сервер
    await new Promise((resolve) => server.close(resolve));

    // Закрываем соединения с БД
    const { close: closeDb } = require('./src/config/database');
    if (closeDb) await closeDb();

    // Закрываем Redis клиент
    const redisClient = require('./src/config/redis');
    if (redisClient?.quit) await redisClient.quit();

    logger.info('✅ Все ресурсы освобождены');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Ошибка при завершении:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server, io };
