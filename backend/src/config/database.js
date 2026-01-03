/**
 * Подключение к базе данных PostgreSQL
 * Использует connection pooling для масштабируемости
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'city_delivery',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Максимум соединений в пуле
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Обработка ошибок подключения
pool.on('error', (err) => {
  const logger = require('../utils/logger');
  logger.error('Unexpected error on idle client', err);
  // Не завершаем процесс, просто помечаем БД как недоступную
  isDbAvailable = false;
});

// Флаг для проверки доступности БД
let isDbAvailable = true;

// Проверяем подключение при старте (с таймаутом, не блокируем запуск)
const checkConnection = async () => {
  try {
    await Promise.race([
      pool.query('SELECT NOW()'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )
    ]);
    const logger = require('../utils/logger');
    logger.log('✅ База данных подключена');
    isDbAvailable = true;
    return true;
  } catch (err) {
    // Не показываем предупреждение сразу - БД может еще запускаться
    // Предупреждение появится только если первый реальный запрос не пройдет
    isDbAvailable = false;
    // Проверяем еще раз через задержку (на случай если БД еще запускается)
    setTimeout(async () => {
      try {
        await pool.query('SELECT NOW()');
        const logger = require('../utils/logger');
        logger.log('✅ База данных подключена (проверка после задержки)');
        isDbAvailable = true;
      } catch (retryErr) {
        // Только если и повторная проверка не прошла - показываем предупреждение
        const logger = require('../utils/logger');
        logger.warn('⚠️ База данных не доступна, будет использован fallback на моковые данные');
        logger.info('💡 Для подключения к БД: запустите Docker контейнер или настройте PostgreSQL');
        isDbAvailable = false;
      }
    }, 3000);
    return false;
  }
};

// Выполняем проверку при старте (не блокируем запуск сервера)
checkConnection().catch(() => {
  // Игнорируем ошибки при проверке, fallback уже настроен
});

// Функция для выполнения запросов
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    // Если запрос успешен, значит БД доступна
    if (!isDbAvailable) {
      isDbAvailable = true;
      const logger = require('../utils/logger');
      logger.log('✅ База данных подключена (обнаружена при запросе)');
    }
    const duration = Date.now() - start;
    // Логируем только медленные запросы (>100ms) или в development
    if (process.env.NODE_ENV === 'development' || duration > 100) {
      const logger = require('../utils/logger');
      logger.log(`Query (${duration}ms): ${text.substring(0, 100)}...`);
    }
    return res;
  } catch (error) {
    // Если ошибка подключения - помечаем БД как недоступную
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === '28P01') {
      isDbAvailable = false;
      const logger = require('../utils/logger');
      logger.warn('⚠️ База данных стала недоступна, переключаемся на fallback');
    }
    const logger = require('../utils/logger');
    logger.error('Database query error', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

// Функция для получения клиента для транзакций
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Переопределяем release для логирования
  client.release = () => {
    const time = Date.now() - client.lastQuery;
    if (time > 1000) {
      const logger = require('../utils/logger');
      logger.warn('Client has been checked out for more than 1 second', {
        time,
        query: client.lastQuery,
      });
    }
    release();
  };
  
  return client;
};

// Функция для повторной проверки подключения (можно вызывать периодически)
const reconnect = async () => {
  if (isDbAvailable) {
    return true;
  }
  return await checkConnection();
};

module.exports = {
  pool,
  query,
  getClient,
  isDbAvailable: () => isDbAvailable,
  reconnect,
};

