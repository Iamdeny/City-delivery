/**
 * Главный файл сервера
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
const fs = require('fs');

// Загружаем .env: сначала пробуем корень проекта, затем backend/.env
const rootEnvPath = path.join(__dirname, '..', '.env');
const backendEnvPath = path.join(__dirname, '.env');

if (fs.existsSync(backendEnvPath)) {
  // Приоритет у backend/.env (там обычно все переменные)
  require('dotenv').config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  // Fallback на корневой .env (для Docker)
  require('dotenv').config({ path: rootEnvPath });
} else {
  // Последний fallback - текущая директория
  require('dotenv').config();
}

// Импорт маршрутов
const authRoutes = require('./src/routes/auth');
const orderRoutes = require('./src/routes/orders');
const productRoutes = require('./src/routes/products');
const cartRoutes = require('./src/routes/cart'); // ✅ Phase 3: Smart Cart
const trackingRoutes = require('./src/routes/tracking'); // ✅ Phase 3: Real-time Tracking
const checkoutRoutes = require('./src/routes/checkout'); // ✅ Phase 4: Checkout Optimization
// const paymentRoutes = require('./src/routes/payments');   // ✅ Payments: ЮKassa Integration
// TODO: Добавить остальные маршруты
// const courierRoutes = require('./src/routes/couriers');
// const pickerRoutes = require('./src/routes/pickers');
// const adminRoutes = require('./src/routes/admin');

// Импорт WebSocket обработчиков
const setupWebSocket = require('./src/websocket/socketHandler');

// Импорт сервисов
const queueService = require('./src/services/queueService');

const app = express();
const server = http.createServer(app);

// Настройка Socket.io
// Поддержка кастомного домена для Telegram Widget
const socketOrigins = [
  'http://localhost:3000',
  'http://local.severokat.ru:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: socketOrigins.length > 0 ? socketOrigins : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ============ MIDDLEWARE ============

// Безопасность
app.use(helmet());

// Сжатие ответов
app.use(compression());

// CORS
// Поддержка кастомного домена для Telegram Widget
const allowedOrigins = [
  'http://localhost:3000',
  'http://local.severokat.ru:3000',
  process.env.FRONTEND_URL,
  // Поддержка localtunnel (любой поддомен .loca.lt)
  /^https:\/\/.*\.loca\.lt$/,
  // Поддержка Cloudflare Tunnel
  /^https:\/\/.*\.trycloudflare\.com$/,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения или Postman)
    if (!origin) return callback(null, true);
    
    // В development режиме разрешаем все для удобства разработки
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    // Проверяем точное совпадение
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
      return;
    }
    
    // Проверяем регулярные выражения (для localtunnel, Cloudflare и т.д.)
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Логируем для отладки
      logger.warn(`[CORS] Запрос заблокирован от origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов, попробуйте позже',
});
app.use('/api/', limiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'City Delivery API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes); // ✅ Phase 3: Smart Cart
app.use('/api/tracking', trackingRoutes); // ✅ Phase 3: Real-time Tracking
app.use('/api/checkout', checkoutRoutes); // ✅ Phase 4: Checkout Optimization
// app.use('/api/payments', paymentRoutes); // ✅ Payments: ЮKassa Integration
// TODO: Добавить остальные маршруты
// app.use('/api/couriers', courierRoutes);
// app.use('/api/pickers', pickerRoutes);
// app.use('/api/admin', adminRoutes);

// Статика для изображений
app.use('/uploads', express.static('uploads'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.path,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============ WEBSOCKET ============

setupWebSocket(io);

// ============ SERVER START ============

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API доступно по адресу: http://localhost:${PORT}/api`);
  console.log(`📡 WebSocket доступен на ws://localhost:${PORT}`);
  console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);

  // Настройка повторяющихся задач
  await queueService.setupRecurringJobs();
  console.log(`⏰ Повторяющиеся задачи настроены`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');

  // Закрываем очереди
  await queueService.close();

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');

  // Закрываем очереди
  await queueService.close();

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
