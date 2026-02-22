/**
 * Утилита для логирования
 * В production режиме логи не выводятся (кроме ошибок)
 * Добавлены префиксы и временные метки для лучшей диагностики
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const PREFIX = '[frontend-next]';

/**
 * Форматирование временной метки
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Форматирование сообщения с префиксом и временем
 */
function formatMessage(level: string, ...args: unknown[]): unknown[] {
  if (isDevelopment) {
    return [`${PREFIX} [${getTimestamp()}] [${level}]`, ...args];
  }
  return args;
}

export const logger = {
  /**
   * Обычное логирование (только в development)
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...formatMessage('LOG', ...args));
    }
  },

  /**
   * Предупреждения (только в development)
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...formatMessage('WARN', ...args));
    }
  },

  /**
   * Ошибки (всегда выводятся, даже в production)
   */
  error: (...args: unknown[]) => {
    console.error(...formatMessage('ERROR', ...args));
  },

  /**
   * Информационные сообщения (только в development)
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...formatMessage('INFO', ...args));
    }
  },

  /**
   * Отладочные сообщения (только в development)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...formatMessage('DEBUG', ...args));
    }
  },
};
