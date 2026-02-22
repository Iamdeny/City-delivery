/**
 * Сервис для авторизации
 * Временная версия - будет заменена на API Routes в Фазе 8
 * Мигрировано из frontend/src/services/authService.ts
 */
'use client';

import { logger } from '@/lib/logger';
import { API_CONFIG } from '@/lib/constants';
import { STORAGE_KEYS } from '@/lib/constants';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'courier' | 'picker' | 'admin' | 'manager';
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface PhoneOTPResponse {
  success: boolean;
  message?: string;
}

export interface PhoneVerifyResponse extends AuthResponse {
  isNew?: boolean; // Был ли создан новый пользователь
}

export interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramAuthResponse extends AuthResponse {
  isNew?: boolean; // Был ли создан новый пользователь
}

type ValidationDetail = { field?: string; message?: string };

function formatValidation(details: unknown): string | null {
  if (!Array.isArray(details)) return null;
  const parts = (details as ValidationDetail[])
    .map((d) => {
      const field = (d.field || '').trim();
      const msg = (d.message || '').trim();
      if (!field && !msg) return null;
      if (field && msg) return `${field}: ${msg}`;
      return msg || field;
    })
    .filter(Boolean) as string[];
  if (!parts.length) return null;
  return parts.slice(0, 4).join('; ');
}

class AuthService {
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`${STORAGE_KEYS.PREFIX}access_token`);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`${STORAGE_KEYS.PREFIX}refresh_token`);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${STORAGE_KEYS.PREFIX}access_token`, accessToken);
    localStorage.setItem(`${STORAGE_KEYS.PREFIX}refresh_token`, refreshToken);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${STORAGE_KEYS.PREFIX}access_token`);
    localStorage.removeItem(`${STORAGE_KEYS.PREFIX}refresh_token`);
    localStorage.removeItem(`${STORAGE_KEYS.PREFIX}user`);
  }

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      logger.log('📝 Регистрация пользователя...');
      // Используем API Route вместо прямого запроса к backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Сервер вернул не JSON ответ. Статус: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Пустой ответ от сервера');
      }

      const result: AuthResponse = JSON.parse(text);

      if (!response.ok || !result.success) {
        const anyResult = result as unknown as { error?: string; message?: string; code?: string; details?: unknown };
        if (response.status === 503 || anyResult.code === 'BACKEND_UNAVAILABLE') {
          throw new Error(
            `Сервер недоступен. Запустите backend (по умолчанию ${API_CONFIG.BASE_URL}).`
          );
        }
        if (response.status === 429 || anyResult.error === 'RATE_LIMITED') {
          throw new Error(anyResult.message || 'Слишком много запросов, попробуйте позже.');
        }
        if (anyResult.error === 'Ошибка валидации') {
          const formatted = formatValidation(anyResult.details);
          throw new Error(formatted ? `Ошибка валидации: ${formatted}` : 'Ошибка валидации');
        }
        throw new Error(anyResult.error || anyResult.message || 'Ошибка регистрации');
      }

      this.setTokens(result.accessToken, result.refreshToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));
      }

      logger.log('✅ Регистрация успешна');
      return result;
    } catch (error) {
      logger.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  /**
   * Вход пользователя
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      logger.log('🔐 Вход пользователя...');
      // Используем API Route вместо прямого запроса к backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Сервер вернул не JSON ответ. Статус: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Пустой ответ от сервера');
      }

      const result: AuthResponse = JSON.parse(text);

      if (!response.ok || !result.success) {
        const anyResult = result as unknown as { error?: string; message?: string; code?: string; details?: unknown };
        if (response.status === 503 || anyResult.code === 'BACKEND_UNAVAILABLE') {
          throw new Error(
            `Сервер недоступен. Проверьте, что backend запущен (по умолчанию ${API_CONFIG.BASE_URL}).`
          );
        }
        if (response.status === 429 || anyResult.error === 'RATE_LIMITED') {
          throw new Error(anyResult.message || 'Слишком много запросов, попробуйте позже.');
        }
        if (anyResult.error === 'Ошибка валидации') {
          const formatted = formatValidation(anyResult.details);
          throw new Error(formatted ? `Ошибка валидации: ${formatted}` : 'Ошибка валидации');
        }
        if (response.status === 401) {
          throw new Error(anyResult.error || 'Неверный email или пароль');
        }
        throw new Error(anyResult.error || anyResult.message || `Ошибка входа: ${response.status}`);
      }

      this.setTokens(result.accessToken, result.refreshToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));
      }

      logger.log('✅ Вход выполнен');
      return result;
    } catch (error) {
      logger.error('Ошибка входа:', error);
      throw error;
    }
  }

  /**
   * Отправка OTP кода на телефон
   */
  async sendPhoneOTP(phone: string): Promise<PhoneOTPResponse> {
    try {
      logger.log('📱 Отправка OTP кода...');
      // Используем API Route вместо прямого запроса к backend
      const response = await fetch('/api/auth/phone/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Ошибка отправки кода');
      }

      logger.log('✅ OTP код отправлен');
      return result;
    } catch (error) {
      logger.error('Ошибка отправки OTP:', error);
      throw error;
    }
  }

  /**
   * Верификация OTP кода
   */
  async verifyPhoneOTP(phone: string, code: string): Promise<PhoneVerifyResponse> {
    try {
      logger.log('✅ Верификация OTP кода...');
      // Используем API Route вместо прямого запроса к backend
      const response = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });

      const result: PhoneVerifyResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error('Неверный код подтверждения');
      }

      this.setTokens(result.accessToken, result.refreshToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));
      }

      logger.log('✅ OTP код подтвержден');
      return result;
    } catch (error) {
      logger.error('Ошибка верификации OTP:', error);
      throw error;
    }
  }

  /**
   * Авторизация через Telegram
   */
  async loginWithTelegram(data: TelegramAuthData): Promise<TelegramAuthResponse> {
    try {
      logger.log('📱 Авторизация через Telegram...');
      // Используем API Route вместо прямого запроса к backend
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: TelegramAuthResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error('Ошибка авторизации через Telegram');
      }

      this.setTokens(result.accessToken, result.refreshToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));
      }

      logger.log('✅ Авторизация через Telegram выполнена');
      return result;
    } catch (error) {
      logger.error('Ошибка авторизации через Telegram:', error);
      throw error;
    }
  }

  /**
   * Обновление токена доступа
   */
  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      logger.log('🔄 Обновление токена...');
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка обновления токена');
      }

      const result: AuthResponse = await response.json();

      if (!result.success) {
        throw new Error('Ошибка обновления токена');
      }

      this.setTokens(result.accessToken, result.refreshToken);
      logger.log('✅ Токен обновлен');
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      logger.error('Ошибка обновления токена:', error);
      this.clearTokens(); // Очищаем токены при ошибке
      return null;
    }
  }

  /**
   * Выход пользователя
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      logger.error('Ошибка выхода:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Получение текущего пользователя
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CURRENT_USER}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось получить данные пользователя');
      }

      const result = await response.json();
      return result.user;
    } catch (error) {
      logger.error('Ошибка получения пользователя:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
