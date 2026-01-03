/**
 * Утилита для логирования
 * В production режиме логи не выводятся
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Обычное логирование (только в development)
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Предупреждения (только в development)
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Ошибки (всегда выводятся, даже в production)
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  /**
   * Информационные сообщения (только в development)
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

