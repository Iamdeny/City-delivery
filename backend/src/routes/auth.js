/**
 * Маршруты для авторизации и регистрации
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateTokens, verifyRefreshToken, authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require('../validators/auth.validator');
const otpService = require('../services/otpService');
const telegramAuthService = require('../services/telegramAuthService');

/**
 * Регистрация
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Валидация уже выполнена в middleware validateRegister
    // Все данные уже нормализованы и проверены

    // Проверка существующего пользователя
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const result = await query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role`,
      [email, hashedPassword, name, phone || null, role]
    );

    const user = result.rows[0];

    // Генерация токенов
    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

/**
 * Вход
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валидация уже выполнена в middleware validateLogin

    // Поиск пользователя
    const result = await query(
      'SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Аккаунт деактивирован' });
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Генерация токенов
    const tokens = generateTokens(user.id, user.role);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

/**
 * Обновление токена
 */
router.post('/refresh', validateRefreshToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Валидация уже выполнена в middleware validateRefreshToken

    const decoded = verifyRefreshToken(refreshToken);

    // Получаем пользователя
    const result = await query(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Пользователь не найден или деактивирован' });
    }

    const user = result.rows[0];

    // Генерируем новые токены
    const tokens = generateTokens(user.id, user.role);

    res.json({ success: true, ...tokens });
  } catch (error) {
    logger.error('Ошибка обновления токена:', error);
    res.status(401).json({ error: 'Невалидный refresh token' });
  }
});

/**
 * Получение текущего пользователя
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка получения пользователя' });
  }
});

/**
 * Отправка OTP кода на телефон
 * POST /api/auth/phone/send-code
 * Body: { phone: string }
 */
router.post('/phone/send-code', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Телефон обязателен' });
    }

    const result = await otpService.sendOTPCode(phone);

    res.json(result);
  } catch (error) {
    logger.error('Ошибка отправки OTP:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка отправки кода',
    });
  }
});

/**
 * Вход/Регистрация по телефону с OTP
 * POST /api/auth/phone/verify
 * Body: { phone: string, code: string }
 */
router.post('/phone/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Телефон и код обязательны' });
    }

    // Проверяем OTP код
    const otpResult = await otpService.verifyOTP(phone, code);

    if (!otpResult.isValid) {
      return res.status(400).json({
        success: false,
        error: otpResult.message || 'Неверный код',
      });
    }

    // Получаем или создаем пользователя
    const { user, isNew } = await otpService.getOrCreateUserByPhone(phone);

    // Генерируем токены
    const tokens = generateTokens(user.id, user.role);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      isNew, // Информируем, был ли создан новый пользователь
      ...tokens,
    });
  } catch (error) {
    logger.error('Ошибка верификации OTP:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка верификации',
    });
  }
});

/**
 * Авторизация через Telegram Login Widget
 * POST /api/auth/telegram
 * Body: { id, first_name, last_name, username, photo_url, auth_date, hash }
 */
router.post('/telegram', async (req, res) => {
  try {
    const telegramData = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      logger.error('[Telegram Auth] TELEGRAM_BOT_TOKEN не установлен в .env');
      return res.status(500).json({
        success: false,
        error: 'Конфигурация Telegram не настроена',
      });
    }

    // Проверяем обязательные поля
    if (!telegramData.id || !telegramData.hash || !telegramData.auth_date) {
      return res.status(400).json({
        success: false,
        error: 'Недостаточно данных от Telegram',
      });
    }

    // Проверяем срок действия данных
    if (!telegramAuthService.isAuthDateValid(telegramData.auth_date)) {
      return res.status(400).json({
        success: false,
        error: 'Данные авторизации устарели. Пожалуйста, войдите снова.',
      });
    }

    // Проверяем подпись (hash)
    if (!telegramAuthService.verifyHash(telegramData, botToken)) {
      logger.warn(`[Telegram Auth] Неверная подпись для telegram_id=${telegramData.id}`);
      return res.status(401).json({
        success: false,
        error: 'Неверная подпись данных. Попытка подделки данных.',
      });
    }

    // Создаем или находим пользователя
    const { user, isNew, tokens } = await telegramAuthService.getOrCreateUserByTelegram(telegramData);

    logger.info(`[Telegram Auth] Успешная авторизация: user_id=${user.id}, isNew=${isNew}`);

    res.json({
      success: true,
      user,
      isNew,
      ...tokens,
    });
  } catch (error) {
    logger.error('[Telegram Auth] Ошибка авторизации через Telegram:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка авторизации через Telegram',
    });
  }
});

module.exports = router;

