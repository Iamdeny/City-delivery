/**
 * Подключение к базе данных PostgreSQL
 * Использует connection pooling для масштабируемости
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Загружаем .env из корня проекта (как в server.js)
const rootEnvPath = path.join(__dirname, '..', '..', '..', '.env');
const backendEnvPath = path.join(__dirname, '..', '..', '.env');

if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
} else {
  require('dotenv').config();
}

// Определяем параметры подключения: приоритет DATABASE_URL
let poolConfig;
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'city_delivery',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

// Обработка ошибок подключения
pool.on('error', (err) => {
  const logger = require('../utils/logger');
  logger.error('Unexpected error on idle client', err);
  isDbAvailable = false;
});

// Флаг для проверки доступности БД
let isDbAvailable = true;

// Проверяем подключение при старте
const checkConnection = async () => {
  try {
    await Promise.race([
      pool.query('SELECT NOW()'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      ),
    ]);
    const logger = require('../utils/logger');
    logger.info('✅ База данных подключена');
    isDbAvailable = true;
    return true;
  } catch (err) {
    isDbAvailable = false;
    // Повторная проверка через 3 секунды
    setTimeout(async () => {
      try {
        await pool.query('SELECT NOW()');
        const logger = require('../utils/logger');
        logger.info('✅ База данных подключена (после задержки)');
        isDbAvailable = true;
      } catch (retryErr) {
        const logger = require('../utils/logger');
        logger.warn('⚠️ База данных не доступна, будет использован fallback');
        logger.info('💡 Проверьте настройки подключения');
        isDbAvailable = false;
      }
    }, 3000);
    return false;
  }
};

// Выполняем проверку при старте (не блокируем запуск)
checkConnection().catch(() => {});

// Функция для выполнения запросов
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (!isDbAvailable) {
      isDbAvailable = true;
      const logger = require('../utils/logger');
      logger.info('✅ База данных подключена (обнаружена при запросе)');
    }
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' || duration > 100) {
      const logger = require('../utils/logger');
      logger.log(`Query (${duration}ms): ${text.substring(0, 100)}...`);
    }
    return res;
  } catch (error) {
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === '28P01'
    ) {
      isDbAvailable = false;
      const logger = require('../utils/logger');
      logger.warn('⚠️ База данных стала недоступна, переключаемся на fallback');
    }
    const logger = require('../utils/logger');
    logger.error('Database query error', {
      text: text.substring(0, 100),
      error: error.message,
    });
    throw error;
  }
};

// Функция для получения клиента для транзакций
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  client.release = () => {
    const time = Date.now() - client.lastQuery;
    if (time > 1000) {
      const logger = require('../utils/logger');
      logger.warn('Client has been checked out for more than 1 second', {
        time,
      });
    }
    release();
  };

  return client;
};

// Функция для повторной проверки подключения
const reconnect = async () => {
  if (isDbAvailable) return true;
  return await checkConnection();
};

module.exports = {
  pool,
  query,
  getClient,
  isDbAvailable: () => isDbAvailable,
  reconnect,
};
