// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');
// const helmet = require('helmet');
// const compression = require('compression');
// require('dotenv').config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//   },
// });

// // Middleware
// app.use(helmet());
// app.use(compression());
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // WebSocket соединения
// io.on('connection', (socket) => {
//   console.log('Новое подключение:', socket.id);

//   // Курьеры подключаются к своему каналу
//   socket.on('courier-connect', (courierId) => {
//     socket.join(`courier-${courierId}`);
//     console.log(`Курьер ${courierId} подключен`);
//   });

//   // Сборщики подключаются
//   socket.on('picker-connect', (pickerId) => {
//     socket.join(`picker-${pickerId}`);
//   });

//   // Администраторы подключаются
//   socket.on('admin-connect', () => {
//     socket.join('admin-room');
//   });

//   // Обновление местоположения курьера
//   socket.on('location-update', (data) => {
//     const { courierId, lat, lng } = data;
//     // Сохраняем в БД
//     // Рассылаем админам
//     io.to('admin-room').emit('courier-location', {
//       courierId,
//       lat,
//       lng,
//       timestamp: new Date(),
//     });
//   });

//   // Обновление статуса заказа
//   socket.on('order-status-update', (data) => {
//     io.to(`order-${data.orderId}`).emit('order-updated', data);
//     io.to('admin-room').emit('order-changed', data);
//   });

//   socket.on('disconnect', () => {
//     console.log('Клиент отключен:', socket.id);
//   });
// });

// // Импорт маршрутов
// const authRoutes = require('./routes/auth');
// const productRoutes = require('./routes/products');
// const orderRoutes = require('./routes/orders');
// const deliveryRoutes = require('./routes/delivery');
// const adminRoutes = require('./routes/admin');
// const analyticsRoutes = require('./routes/analytics');

// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/delivery', deliveryRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/analytics', analyticsRoutes);

// // Статика
// app.use('/uploads', express.static('uploads'));

// // Health check
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     timestamp: new Date(),
//     service: 'City Delivery API',
//     version: '1.0.0',
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Сервер запущен на порту ${PORT}`);
//   console.log(`📡 WebSocket доступен на ws://localhost:${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
// ============ НАСТРОЙКА CORS ============
// Разрешаем запросы с localhost:3000 (frontend)
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Разрешаем предварительные запросы OPTIONS
app.options('*', cors());

// Разрешаем JSON в теле запросов
app.use(express.json());

// Простые тестовые данные
const mockProducts = [
  {
    id: 1,
    name: 'Молоко 3.2%',
    price: 89,
    category: 'Молочные продукты',
    image: '🥛',
  },
  {
    id: 2,
    name: 'Хлеб Бородинский',
    price: 45,
    category: 'Хлеб',
    image: '🍞',
  },
  { id: 3, name: 'Яйца 10 шт', price: 120, category: 'Яйца', image: '🥚' },
  { id: 4, name: 'Сыр Российский', price: 350, category: 'Сыры', image: '🧀' },
  { id: 5, name: 'Вода 1.5л', price: 60, category: 'Напитки', image: '💧' },
  {
    id: 6,
    name: 'Колбаса Докторская',
    price: 280,
    category: 'Колбасы',
    image: '🌭',
  },
  { id: 7, name: 'Помидоры', price: 150, category: 'Овощи', image: '🍅' },
  { id: 8, name: 'Бананы', price: 90, category: 'Фрукты', image: '🍌' },
  {
    id: 9,
    name: 'Кофе растворимый',
    price: 450,
    category: 'Кофе/Чай',
    image: '☕',
  },
  { id: 10, name: 'Сахар 1кг', price: 85, category: 'Бакалея', image: '🍚' },
];

const orders = [];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'City Delivery API',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

app.get('/api/products', (req, res) => {
  res.json(mockProducts);
});

app.get('/api/products/:id', (req, res) => {
  const product = mockProducts.find((p) => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Товар не найден' });
  }
});

app.get('/api/categories', (req, res) => {
  const categories = [...new Set(mockProducts.map((p) => p.category))];
  res.json(
    categories.map((cat) => ({
      name: cat,
      products: mockProducts.filter((p) => p.category === cat),
    }))
  );
});

// Заказы
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Заказ не найден' });
  }
});

app.post('/api/orders', (req, res) => {
  const { phone, address, items, comment } = req.body;

  // Проверка данных
  if (!phone || !address || !items || items.length === 0) {
    return res
      .status(400)
      .json({ error: 'Не все обязательные поля заполнены' });
  }

  // Расчет суммы
  const total = items.reduce((sum, item) => {
    const product = mockProducts.find((p) => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  // Создание заказа
  const newOrder = {
    id: orders.length + 1,
    phone,
    address,
    items: items.map((item) => {
      const product = mockProducts.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: product?.name || 'Неизвестный товар',
        productImage: product?.image || '📦',
        price: product?.price || 0,
      };
    }),
    total,
    comment: comment || '',
    status: 'pending', // pending, preparing, delivering, delivered, cancelled
    createdAt: new Date(),
    estimatedDelivery: new Date(Date.now() + 30 * 60000), // +30 минут
  };

  orders.push(newOrder);

  // Уведомление через WebSocket
  io.emit('new-order', newOrder);

  res.json({
    success: true,
    orderId: newOrder.id,
    message: 'Заказ успешно создан!',
    order: newOrder,
  });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const orderIndex = orders.findIndex((o) => o.id === parseInt(req.params.id));

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Заказ не найден' });
  }

  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date();

  // Уведомление через WebSocket
  io.emit('order-updated', orders[orderIndex]);

  res.json({
    success: true,
    message: `Статус заказа обновлен на "${status}"`,
  });
});

// Dark stores (темные магазины)
app.get('/api/dark-stores', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Центральный склад',
      address: 'ул. Центральная, 1',
      phone: '+7 (999) 123-45-67',
      openingHours: '08:00-22:00',
      deliveryRadius: 5000, // 5 км
      coordinates: { lat: 55.7558, lng: 37.6173 },
    },
  ]);
});

// WebSocket события
io.on('connection', (socket) => {
  console.log('Новое подключение:', socket.id);

  socket.emit('welcome', {
    message: 'Добро пожаловать в City Delivery API',
    connected: true,
  });

  // Подписка на обновления заказа
  socket.on('subscribe-to-order', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`Клиент подписался на заказ ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключен:', socket.id);
  });
});

// Статика для изображений
app.use('/uploads', express.static('uploads'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    availableRoutes: [
      'GET /api/health',
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/categories',
      'GET /api/orders',
      'POST /api/orders',
      'GET /api/orders/:id',
      'PUT /api/orders/:id/status',
      'GET /api/dark-stores',
    ],
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API доступно по адресу: http://localhost:${PORT}/api`);
  console.log(`📡 WebSocket доступен на ws://localhost:${PORT}`);
  console.log(
    `🏪 Пример запроса товаров: http://localhost:${PORT}/api/products`
  );
});
