/**
 * Сервис для авторизации
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/constants';
import { STORAGE_KEYS } from '../config/constants';

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

class AuthService {
  private getAccessToken(): string | null {
    return localStorage.getItem(`${STORAGE_KEYS.PREFIX}access_token`);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(`${STORAGE_KEYS.PREFIX}refresh_token`);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(`${STORAGE_KEYS.PREFIX}access_token`, accessToken);
    localStorage.setItem(`${STORAGE_KEYS.PREFIX}refresh_token`, refreshToken);
  }

  private clearTokens(): void {
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
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Проверяем Content-Type перед парсингом JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text();
        throw new Error(`Сервер вернул не JSON ответ. Статус: ${response.status}`);
      }

      // Проверяем, что есть тело ответа
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Пустой ответ от сервера');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        logger.error('Ошибка парсинга JSON:', parseError, 'Ответ:', text);
        throw new Error('Сервер вернул некорректный JSON. Проверьте подключение к серверу.');
      }

      if (!response.ok) {
        throw new Error(result.error || `Ошибка регистрации (${response.status})`);
      }

      if (result.success && result.accessToken) {
        this.setTokens(result.accessToken, result.refreshToken);
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));
        logger.log('✅ Регистрация успешна');
        return result;
      }

      throw new Error('Неожиданный формат ответа');
    } catch (error) {
      logger.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  /**
   * Вход в систему
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      logger.log('🔐 Вход в систему...');
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      // Проверяем Content-Type перед парсингом JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text();
        throw new Error(`Сервер вернул не JSON ответ. Статус: ${response.status}. Проверьте, что backend запущен.`);
      }

      // Проверяем, что есть тело ответа
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Пустой ответ от сервера. Проверьте подключение к backend.');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        logger.error('Ошибка парсинга JSON:', parseError, 'Ответ:', text);
        throw new Error('Сервер вернул некорректный JSON. Проверьте подключение к серверу.');
      }

      if (!response.ok) {
        throw new Error(result.error || `Ошибка входа (${response.status})`);
      }

      if (result.success && result.accessToken) {
        this.setTokens(result.accessToken, result.refreshToken);
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));
        logger.log('✅ Вход успешен');
        return result;
      }

      throw new Error('Неожиданный формат ответа');
    } catch (error) {
      logger.error('Ошибка входа:', error);
      throw error;
    }
  }

  /**
   * Выход из системы
   */
  logout(): void {
    this.clearTokens();
    logger.log('👋 Выход из системы');
  }

  /**
   * Проверка авторизации
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Получение текущего пользователя
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(`${STORAGE_KEYS.PREFIX}user`);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Получение access token
   */
  getToken(): string | null {
    return this.getAccessToken();
  }

  /**
   * Обновление токена
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Refresh token не найден');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      // Безопасный парсинг JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Сервер вернул не JSON ответ');
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Пустой ответ от сервера');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        logger.error('Ошибка парсинга JSON при обновлении токена:', parseError);
        throw new Error('Сервер вернул некорректный JSON');
      }

      if (!response.ok || !result.success) {
        this.clearTokens();
        throw new Error(result.error || 'Ошибка обновления токена');
      }

      this.setTokens(result.accessToken, result.refreshToken);
      logger.log('✅ Токен обновлен');
      return result.accessToken;
    } catch (error) {
      logger.error('Ошибка обновления токена:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Отправка OTP кода на телефон
   */
  async sendPhoneOTP(phone: string): Promise<PhoneOTPResponse> {
    try {
      logger.log('📱 Отправка OTP кода на телефон...');
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PHONE_SEND_CODE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text();
        throw new Error(`Сервер вернул не JSON ответ. Статус: ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Пустой ответ от сервера');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        logger.error('Ошибка парсинга JSON:', parseError);
        throw new Error('Сервер вернул некорректный JSON');
      }

      if (!response.ok) {
        throw new Error(result.error || `Ошибка отправки кода (${response.status})`);
      }

      logger.log('✅ OTP код отправлен');
      return result;
    } catch (error) {
      logger.error('Ошибка отправки OTP:', error);
      throw error;
    }
  }

  /**
   * Вход/Регистрация по телефону с OTP
   */
  async verifyPhoneOTP(phone: string, code: string): Promise<PhoneVerifyResponse> {
    try {
      logger.log('🔐 Верификация OTP кода...');
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PHONE_VERIFY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text();
        throw new Error(`Сервер вернул не JSON ответ. Статус: ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Пустой ответ от сервера');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        logger.error('Ошибка парсинга JSON:', parseError);
        throw new Error('Сервер вернул некорректный JSON');
      }

      if (!response.ok) {
        throw new Error(result.error || `Ошибка верификации (${response.status})`);
      }

      if (result.success && result.accessToken) {
        this.setTokens(result.accessToken, result.refreshToken);
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));
        logger.log(result.isNew ? '✅ Регистрация по телефону успешна' : '✅ Вход по телефону успешен');
        return result;
      }

      throw new Error('Неожиданный формат ответа');
    } catch (error) {
      logger.error('Ошибка верификации OTP:', error);
      throw error;
    }
  }

  /**
   * Получение информации о текущем пользователе с сервера
   */
  async getMe(): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Не авторизован');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CURRENT_USER}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Токен истек, пробуем обновить
        const newToken = await this.refreshToken();
        if (newToken) {
          const retryResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CURRENT_USER}`, {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          
          // Безопасный парсинг для retry
          const retryContentType = retryResponse.headers.get('content-type');
          if (retryContentType && retryContentType.includes('application/json')) {
            const retryText = await retryResponse.text();
            if (retryText && retryText.trim() !== '') {
              try {
                const retryResult = JSON.parse(retryText);
                if (retryResponse.ok && retryResult.user) {
                  localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(retryResult.user));
                  return retryResult.user;
                }
              } catch (parseError) {
                logger.error('Ошибка парсинга JSON при retry:', parseError);
              }
            }
          }
        }
        throw new Error('Требуется повторный вход');
      }

      // Безопасный парсинг JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Сервер вернул не JSON ответ');
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Пустой ответ от сервера');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        logger.error('Ошибка парсинга JSON при получении пользователя:', parseError);
        throw new Error('Сервер вернул некорректный JSON');
      }
      if (result.user) {
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));
        return result.user;
      }

      throw new Error('Неожиданный формат ответа');
    } catch (error) {
      logger.error('Ошибка получения пользователя:', error);
      throw error;
    }
  }

  /**
   * Авторизация через Telegram Login Widget
   */
  async verifyTelegramAuth(telegramData: TelegramAuthData): Promise<TelegramAuthResponse> {
    try {
      logger.log('📱 Авторизация через Telegram...');
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TELEGRAM_AUTH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text();
        throw new Error(`Сервер вернул не JSON ответ. Статус: ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Пустой ответ от сервера');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        logger.error('Ошибка парсинга JSON:', parseError);
        throw new Error('Сервер вернул некорректный JSON');
      }

      if (!response.ok) {
        throw new Error(result.error || `Ошибка авторизации через Telegram (${response.status})`);
      }

      if (result.success && result.user && result.accessToken && result.refreshToken) {
        // Сохраняем токены
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}access_token`, result.accessToken);
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}refresh_token`, result.refreshToken);
        localStorage.setItem(`${STORAGE_KEYS.PREFIX}user`, JSON.stringify(result.user));

        logger.log(result.isNew ? '✅ Регистрация через Telegram выполнена' : '✅ Вход через Telegram выполнен');
        return result;
      }

      throw new Error('Неожиданный формат ответа от сервера');
    } catch (error) {
      logger.error('Ошибка авторизации через Telegram:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();

