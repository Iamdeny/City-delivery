/**
 * Унифицированная форма входа/регистрации
 * Поддерживает email/password и phone/OTP методы авторизации
 * Стиль Самоката: минимализм, большие отступы, розовый акцент
 * Мигрировано из frontend/src/components/Auth/LoginForm.tsx
 */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, type LoginCredentials, type RegisterData } from '@/app/services/authService';
import { logger } from '@/lib/logger';
import { formatPhone, validatePhone, handlePhoneChange } from '@/lib/phoneMask';

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
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  
  // Общие состояния
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'otp'>('input'); // Для phone метода
  const [showTelegram, setShowTelegram] = useState(false);

  // Telegram Widget только на HTTPS (избегаем hydration mismatch)
  useEffect(() => {
    setShowTelegram(
      window.location.protocol === 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
    );
  }, []);

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
    setOtpSent(false);
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
      setOtpSent(true);
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
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    
    if (!botUsername || botUsername === 'YOUR_BOT_USERNAME' || botUsername === 'your_bot_username') {
      setError('Telegram бот не настроен. Укажите NEXT_PUBLIC_TELEGRAM_BOT_USERNAME в .env файле.');
      logger.warn('Telegram bot username не установлен в NEXT_PUBLIC_TELEGRAM_BOT_USERNAME');
      return;
    }

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

    const container = document.getElementById('telegram-widget-container');
    if (!container) {
      setError('Контейнер для Telegram Widget не найден');
      return;
    }

    // Безопасная очистка контейнера
    container.replaceChildren();
    setError(null);
    setIsLoading(true);

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    script.onerror = () => {
      setError('Не удалось загрузить Telegram Widget. Проверьте подключение к интернету.');
      setIsLoading(false);
    };

    script.onload = () => {
      setIsLoading(false);
    };

    container.appendChild(script);
    container.style.display = 'block';
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center z-[1050] animate-[fadeIn_0.3s_ease-in-out] px-3 sm:px-5 pb-3 sm:pb-5 safe-top kb-safe-bottom"
      onClick={onClose}
    >
      <motion.div
        className="mt-20 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-w-[420px] w-full relative animate-[slideUp_0.3s_ease-in-out] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-none overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <button 
          className="absolute top-4 right-4 bg-none border-none text-[22px] cursor-pointer text-gray-500 leading-none min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full transition-all hover:text-gray-900 hover:bg-gray-100 active:scale-95"
          onClick={onClose} 
          aria-label="Закрыть"
        >
          ✕
        </button>

        <h2 className="m-0 mb-2 text-[24px] font-extrabold text-gray-900 tracking-[-0.3px]">
          Вход или регистрация
        </h2>
        <p className="mb-6 text-base text-gray-600 leading-relaxed">
          Мы отправим код подтверждения на ваш номер
        </p>

        {/* Переключатель метода авторизации */}
        <div className="flex gap-3 mb-6 bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            className={`flex-1 py-3 px-5 border-none rounded-xl text-sm font-medium text-gray-500 cursor-pointer transition-all hover:text-gray-900 hover:bg-white/50 active:scale-[0.98] ${
              authMethod === 'phone' ? 'bg-white text-blue-600 font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.15)]' : 'bg-transparent'
            }`}
            onClick={() => setAuthMethod('phone')}
          >
            📱 Телефон
          </button>
          <button
            type="button"
            className={`flex-1 py-3 px-5 border-none rounded-xl text-sm font-medium text-gray-500 cursor-pointer transition-all hover:text-gray-900 hover:bg-white/50 active:scale-[0.98] ${
              authMethod === 'email' ? 'bg-white text-blue-600 font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.15)]' : 'bg-transparent'
            }`}
            onClick={() => setAuthMethod('email')}
          >
            ✉️ Email
          </button>
        </div>

        {error && (
          <motion.div
            className="bg-red-50 text-red-600 py-4 px-5 rounded-2xl mb-6 text-sm border border-red-200"
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
                <div className="flex flex-col gap-6">
                  <div>
                    <label htmlFor="phone" className="block mb-2 font-medium text-gray-700 text-sm">
                      Номер телефона *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneInputChange}
                      placeholder="+7 (999) 123-45-67"
                      autoComplete="tel"
                      disabled={isLoading}
                      maxLength={18}
                      className="w-full py-4 px-5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 transition-all box-border placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isLoading || !validatePhone(phone)}
                    className="w-full py-[18px] bg-blue-600 text-white border-none rounded-2xl text-base font-semibold cursor-pointer transition-all mt-2 shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(37,99,235,0.35)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? 'Отправка...' : 'Получить код'}
                  </button>
                </div>
              ) : (
                // Шаг 2: Ввод кода
                <div className="flex flex-col gap-6">
                  <div className="text-center py-4 bg-gray-100 rounded-2xl mb-2">
                    <p className="m-0 mb-2 text-sm text-gray-700 font-medium">
                      Код отправлен на {phone}
                    </p>
                    <button
                      type="button"
                      className="bg-none border-none text-blue-600 text-sm font-medium cursor-pointer underline p-1 transition-colors hover:text-blue-700"
                      onClick={() => {
                        setStep('input');
                        setOtpCode('');
                        setOtpSent(false);
                      }}
                    >
                      Изменить номер
                    </button>
                  </div>
                  <div>
                    <label htmlFor="otp" className="block mb-2 font-medium text-gray-700 text-sm">
                      Код подтверждения *
                    </label>
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
                      className="w-full py-4 px-5 border border-gray-300 rounded-2xl text-2xl font-semibold tracking-[8px] text-center font-mono bg-white text-gray-900 transition-all box-border placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full py-[18px] bg-blue-600 text-white border-none rounded-2xl text-base font-semibold cursor-pointer transition-all mt-2 shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(37,99,235,0.35)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? 'Проверка...' : 'Подтвердить'}
                  </button>
                  {otpCountdown > 0 ? (
                    <p className="text-center text-sm text-gray-500 m-2 mt-0">
                      Повторная отправка через {otpCountdown} сек
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="bg-none border-none text-blue-600 text-sm font-medium cursor-pointer underline py-2 mt-2 transition-colors hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {!isLogin && (
                <div className="mb-6">
                  <label htmlFor="name" className="block mb-2 font-medium text-gray-700 text-sm">
                    Имя *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ваше имя"
                    autoComplete="name"
                    disabled={isLoading}
                    className="w-full py-4 px-5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 transition-all box-border placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                  />
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="email" className="block mb-2 font-medium text-gray-700 text-sm">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full py-4 px-5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 transition-all box-border placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block mb-2 font-medium text-gray-700 text-sm">
                  Пароль *
                </label>
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
                  className="w-full py-4 px-5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 transition-all box-border placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-[18px] bg-blue-600 text-white border-none rounded-2xl text-base font-semibold cursor-pointer transition-all mt-2 shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:bg-blue-700 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Кнопка входа через Telegram — только на HTTPS (не localhost) */}
        {showTelegram && (
          <div className="mt-6">
            <div className="flex items-center text-center my-6 text-gray-500 text-sm">
              <div className="flex-1 border-b border-gray-300"></div>
              <span className="px-4">или</span>
              <div className="flex-1 border-b border-gray-300"></div>
            </div>
            <button
              type="button"
              onClick={handleTelegramClick}
              disabled={isLoading}
              className="w-full h-[52px] bg-[#0088cc] text-white border-none rounded-2xl text-base font-semibold cursor-pointer flex items-center justify-center transition-all mt-4 shadow-[0_2px_8px_rgba(0,136,204,0.2)] hover:bg-[#0077b5] hover:scale-[0.98] active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              aria-label="Войти через Telegram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.193l-1.87 8.81c-.14.625-.5.78-1.015.485l-2.8-2.063-1.35 1.295c-.15.15-.275.275-.565.275l.2-2.83 5.18-4.68c.225-.2-.05-.31-.345-.11l-6.405 4.03-2.76-.86c-.6-.19-.615-.6.12-.89l10.74-4.14c.5-.19.94.11.78.69z"/>
              </svg>
              Войти через Telegram
            </button>
            <div id="telegram-widget-container" className="hidden mt-3"></div>
          </div>
        )}

        <div className="mt-6 text-center pt-6 border-t border-gray-200">
          <button
            type="button"
            className="bg-none border-none text-blue-600 cursor-pointer text-sm font-medium p-2 transition-all hover:text-blue-700 hover:underline active:scale-[0.98]"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setStep('input');
              setOtpSent(false);
              setOtpCode('');
            }}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginForm;
