/**
 * Унифицированная форма входа/регистрации
 * Поддерживает email/password и phone/OTP методы авторизации
 * Стиль Самоката: минимализм, большие отступы, розовый акцент
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, type LoginCredentials, type RegisterData } from '../../services/authService';
import { logger } from '../../utils/logger';
import { validatePhone, handlePhoneChange } from '../../utils/phoneMask';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess: () => void;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type AuthMethod = 'email' | 'phone';

function LoginForm({ onSuccess, onClose, initialMode = 'login' }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone'); // По умолчанию телефон (Самокат стиль)
  
  // Email/Password поля
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Phone/OTP поля
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  
  // Общие состояния
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'otp'>('input'); // Для phone метода

  // Таймер обратного отсчета для повторной отправки OTP
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Сброс состояния при смене метода
  useEffect(() => {
    setError(null);
    setOtpCode('');
    setStep('input');
    setOtpCountdown(0);
  }, [authMethod, isLogin]);

  // Отправка OTP кода
  const handleSendOTP = async () => {
    if (!validatePhone(phone)) {
      setError('Введите корректный номер телефона');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await authService.sendPhoneOTP(phone);
      setStep('otp');
      setOtpCountdown(60); // 60 секунд до повторной отправки
      logger.log('✅ OTP код отправлен');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка отправки кода';
      setError(message);
      logger.error('Ошибка отправки OTP:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Верификация OTP кода
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.verifyPhoneOTP(phone, otpCode);
      logger.log(result.isNew ? '✅ Регистрация по телефону выполнена' : '✅ Вход по телефону выполнен');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка верификации кода';
      setError(message);
      logger.error('Ошибка верификации OTP:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка отправки формы (email/password)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const credentials: LoginCredentials = { email, password };
        await authService.login(credentials);
        logger.log('✅ Вход выполнен');
        onSuccess();
      } else {
        const registerData: RegisterData = {
          email,
          password,
          name,
        };
        await authService.register(registerData);
        logger.log('✅ Регистрация выполнена');
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации';
      setError(message);
      logger.error('Ошибка авторизации:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка изменения телефона с маской
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePhoneChange(e.target.value, setPhone);
  };

  // Обработка клика по кнопке Telegram
  const handleTelegramClick = () => {
    // Telegram Widget требует указания bot username
    // Для работы нужно создать бота через @BotFather и указать его username
    const botUsername = process.env.REACT_APP_TELEGRAM_BOT_USERNAME;
    
    if (!botUsername || botUsername === 'YOUR_BOT_USERNAME' || botUsername === 'your_bot_username') {
      setError('Telegram бот не настроен. Укажите REACT_APP_TELEGRAM_BOT_USERNAME в .env файле.');
      logger.warn('Telegram bot username не установлен в REACT_APP_TELEGRAM_BOT_USERNAME');
      return;
    }

    // Проверяем, используется ли HTTPS или кастомный домен
    const currentHost = window.location.hostname;
    const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
    const isHttp = window.location.protocol === 'http:';

    if (isLocalhost || (isHttp && currentHost.includes('local.'))) {
      setError(
        'Telegram Widget требует HTTPS и доступный из интернета домен. ' +
        'Для локальной разработки используйте Cloudflare Tunnel: cloudflared tunnel --url http://localhost:3000 --protocol http2'
      );
      logger.warn('Telegram Widget требует HTTPS. Текущий URL:', window.location.href);
      return;
    }

    // Создаем скрипт Telegram Widget динамически
    const container = document.getElementById('telegram-widget-container');
    if (!container) {
      setError('Контейнер для Telegram Widget не найден');
      return;
    }

    // Очищаем предыдущий виджет
    container.innerHTML = '';
    setError(null);
    setIsLoading(true);

    // Создаем скрипт виджета
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Обработка ошибок загрузки скрипта
    script.onerror = () => {
      setError('Не удалось загрузить Telegram Widget. Проверьте подключение к интернету.');
      setIsLoading(false);
    };

    script.onload = () => {
      setIsLoading(false);
    };

    container.appendChild(script);
    
    // Показываем контейнер (виджет создаст iframe)
    container.style.display = 'block';
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <motion.div
        className="login-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <button className="login-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>

        {/* Переключатель метода авторизации */}
        <div className="auth-method-switcher">
          <button
            type="button"
            className={`method-btn ${authMethod === 'phone' ? 'active' : ''}`}
            onClick={() => setAuthMethod('phone')}
          >
            📱 Телефон
          </button>
          <button
            type="button"
            className={`method-btn ${authMethod === 'email' ? 'active' : ''}`}
            onClick={() => setAuthMethod('email')}
          >
            ✉️ Email
          </button>
        </div>

        {error && (
          <motion.div
            className="login-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {authMethod === 'phone' ? (
            // Phone/OTP метод
            <motion.div
              key="phone-auth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 'input' ? (
                // Шаг 1: Ввод телефона
                <div className="phone-input-step">
                  <div className="form-group">
                    <label htmlFor="phone">Номер телефона *</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneInputChange}
                      placeholder="+7 (999) 123-45-67"
                      autoComplete="tel"
                      disabled={isLoading}
                      maxLength={18}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isLoading || !validatePhone(phone)}
                    className="login-submit"
                  >
                    {isLoading ? 'Отправка...' : 'Получить код'}
                  </button>
                </div>
              ) : (
                // Шаг 2: Ввод кода
                <div className="otp-input-step">
                  <div className="otp-info">
                    <p>Код отправлен на {phone}</p>
                    <button
                      type="button"
                      className="change-phone-btn"
                      onClick={() => {
                        setStep('input');
                        setOtpCode('');
                      }}
                    >
                      Изменить номер
                    </button>
                  </div>
                  <div className="form-group">
                    <label htmlFor="otp">Код подтверждения *</label>
                    <input
                      id="otp"
                      type="text"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(value);
                        setError(null);
                      }}
                      placeholder="000000"
                      autoComplete="one-time-code"
                      disabled={isLoading}
                      maxLength={6}
                      className="otp-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otpCode.length !== 6}
                    className="login-submit"
                  >
                    {isLoading ? 'Проверка...' : 'Подтвердить'}
                  </button>
                  {otpCountdown > 0 ? (
                    <p className="otp-resend-info">
                      Повторная отправка через {otpCountdown} сек
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="resend-otp-btn"
                      onClick={handleSendOTP}
                      disabled={isLoading}
                    >
                      Отправить код повторно
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            // Email/Password метод
            <motion.form
              key="email-auth"
              onSubmit={handleEmailSubmit}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Имя *</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ваше имя"
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Пароль *</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isLogin ? 'Ваш пароль' : 'Минимум 8 символов'}
                  minLength={isLogin ? 1 : 8}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={isLoading}
                />
              </div>

              <button type="submit" disabled={isLoading} className="login-submit">
                {isLoading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Кнопка входа через Telegram - показываем только на HTTPS (не localhost) */}
        {window.location.protocol === 'https:' && 
         window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' && (
          <div className="telegram-auth-section">
            <div className="divider">
              <span>или</span>
            </div>
            <button
              type="button"
              onClick={handleTelegramClick}
              disabled={isLoading}
              className="telegram-login-btn"
              aria-label="Войти через Telegram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.193l-1.87 8.81c-.14.625-.5.78-1.015.485l-2.8-2.063-1.35 1.295c-.15.15-.275.275-.565.275l.2-2.83 5.18-4.68c.225-.2-.05-.31-.345-.11l-6.405 4.03-2.76-.86c-.6-.19-.615-.6.12-.89l10.74-4.14c.5-.19.94.11.78.69z"/>
              </svg>
              Войти через Telegram
            </button>
            <div id="telegram-widget-container" style={{ display: 'none', marginTop: '12px' }}></div>
          </div>
        )}

        <div className="login-switch">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setStep('input');
              setOtpCode('');
            }}
            className="login-switch-btn"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginForm;
