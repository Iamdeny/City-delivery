// config.js
const path = require('path');
const fs = require('fs');

// Загрузка переменных окружения из .env
const rootEnvPath = path.join(__dirname, '..', '.env');
const backendEnvPath = path.join(__dirname, '.env');

if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config();
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  uploadsDir: 'uploads',

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  database: {
    // Здесь можно добавить параметры подключения к БД
  },

  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      process.env.FRONTEND_URL,
      /^https:\/\/.*\.loca\.lt$/,
      /^https:\/\/.*\.trycloudflare\.com$/,
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    skipInDev: true, // пропускать в development режиме
  },
};
