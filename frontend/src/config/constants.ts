/**
 * Константы приложения
 * Все магические числа и строки должны быть здесь
 */

// API конфигурация
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  ENDPOINTS: {
    AUTH: '/api/auth',
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
    CURRENT_USER: '/api/auth/me',
    PRODUCTS: '/api/products',
    ORDERS: '/api/orders',
    CATEGORIES: '/api/products/categories',
    HEALTH: '/api/health',
  },
} as const;

// WebSocket конфигурация
export const WS_CONFIG = {
  BASE_URL: process.env.REACT_APP_WS_URL || 'http://localhost:5000',
} as const;

// Таймауты и задержки
export const TIMEOUTS = {
  DEBOUNCE: 300, // мс - задержка для дебаунса
  CART_SAVE: 300, // мс - задержка перед сохранением корзины
  AUTO_RESTORE: 1000, // мс - задержка перед автовосстановлением корзины
} as const;

// Breakpoints для responsive дизайна
export const BREAKPOINTS = {
  MOBILE: 1024, // px - все что меньше считается мобильным
} as const;

// localStorage ключи
export const STORAGE_KEYS = {
  CART: 'delivery_app_cart',
  PREFIX: 'delivery_app_',
} as const;

// Настройки фильтров
export const FILTERS = {
  DEFAULT_PRICE_RANGE: [0, 1000] as [number, number],
  DEFAULT_SORT: 'relevance' as const,
} as const;

