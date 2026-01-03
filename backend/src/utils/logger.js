/**
 * Утилита для логирования
 * В production можно интегрировать с Winston, Pino и т.д.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },

  info: (...args) => {
    console.info('[INFO]', ...args);
  },

  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
};

module.exports = logger;

