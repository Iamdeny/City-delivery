/**
 * Обработчики WebSocket для real-time обновлений
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function setupWebSocket(io) {
  // Middleware для аутентификации WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Токен не предоставлен'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Получаем пользователя
      const result = await query(
        'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('Пользователь не найден'));
      }

      socket.user = result.rows[0];
      next();
    } catch (error) {
      next(new Error('Невалидный токен'));
    }
  });

  io.on('connection', (socket) => {
    logger.log(`Пользователь подключен: ${socket.user.email} (${socket.user.role})`);

    // Подключение к комнатам в зависимости от роли
    if (socket.user.role === 'customer') {
      socket.join(`user-${socket.user.id}`);
      logger.log(`Клиент ${socket.user.id} подключен`);
    } else if (socket.user.role === 'courier') {
      socket.join('couriers');
      socket.join(`courier-${socket.user.id}`);
      logger.log(`Курьер ${socket.user.id} подключен`);
    } else if (socket.user.role === 'picker') {
      socket.join('pickers');
      socket.join(`picker-${socket.user.id}`);
      logger.log(`Сборщик ${socket.user.id} подключен`);
    } else if (socket.user.role === 'admin' || socket.user.role === 'manager') {
      socket.join('admin-room');
      logger.log(`Админ ${socket.user.id} подключен`);
    }

    // Подписка на обновления заказа
    socket.on('subscribe-to-order', async (orderId) => {
      try {
        // Проверяем права доступа
        const result = await query(
          `SELECT 
            client_id, 
            courier_id, 
            picker_id,
            (SELECT user_id FROM couriers WHERE id = orders.courier_id) as courier_user_id,
            (SELECT user_id FROM order_pickers WHERE id = orders.picker_id) as picker_user_id
          FROM orders 
          WHERE id = $1`,
          [orderId]
        );

        if (result.rows.length === 0) {
          return socket.emit('error', { message: 'Заказ не найден' });
        }

        const order = result.rows[0];

        // Проверяем права
        const hasAccess =
          order.client_id === socket.user.id ||
          order.courier_user_id === socket.user.id ||
          order.picker_user_id === socket.user.id ||
          socket.user.role === 'admin' ||
          socket.user.role === 'manager';

        if (!hasAccess) {
          return socket.emit('error', { message: 'Нет доступа к этому заказу' });
        }

        socket.join(`order-${orderId}`);
        logger.log(`Пользователь ${socket.user.id} подписался на заказ ${orderId}`);
      } catch (error) {
        logger.error('Ошибка подписки на заказ:', error);
        socket.emit('error', { message: 'Ошибка подписки' });
      }
    });

    // Обновление местоположения курьера
    socket.on('location-update', async (data) => {
      try {
        if (socket.user.role !== 'courier') {
          return socket.emit('error', { message: 'Только курьеры могут обновлять местоположение' });
        }

        const { lat, lng } = data;

        // Обновляем в БД
        await query(
          `UPDATE couriers 
           SET current_location_lat = $1, 
               current_location_lng = $2, 
               last_seen = NOW()
           WHERE user_id = $3`,
          [lat, lng, socket.user.id]
        );

        // Отправляем админам
        io.to('admin-room').emit('courier-location', {
          courierId: socket.user.id,
          lat,
          lng,
          timestamp: new Date(),
        });

        logger.log(`Курьер ${socket.user.id} обновил местоположение: ${lat}, ${lng}`);
      } catch (error) {
        logger.error('Ошибка обновления местоположения:', error);
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      logger.log(`Пользователь отключен: ${socket.user.email}`);
    });
  });

  // Функция для отправки обновления заказа
  const emitOrderUpdate = (orderId, orderData) => {
    io.to(`order-${orderId}`).emit('order-updated', orderData);
    io.to('admin-room').emit('order-changed', { orderId, ...orderData });
  };

  // Функция для отправки нового заказа сборщикам
  const emitNewPickupTask = (pickerId, orderData) => {
    io.to(`picker-${pickerId}`).emit('new-pickup-task', orderData);
    io.to('pickers').emit('new-order-available', orderData);
  };

  // Функция для отправки нового заказа курьерам
  const emitNewDeliveryTask = (courierId, orderData) => {
    io.to(`courier-${courierId}`).emit('new-delivery-task', orderData);
  };

  // Экспортируем функции для использования в других модулях
  io.emitOrderUpdate = emitOrderUpdate;
  io.emitNewPickupTask = emitNewPickupTask;
  io.emitNewDeliveryTask = emitNewDeliveryTask;
}

module.exports = setupWebSocket;

