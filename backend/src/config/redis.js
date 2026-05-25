const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  logger.info('✅ Redis подключен');
});

redisClient.on('error', (err) => {
  logger.error('❌ Ошибка Redis:', err);
});

module.exports = redisClient;
