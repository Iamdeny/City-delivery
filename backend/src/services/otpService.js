/**
 * Сервис для работы с OTP (One-Time Password)
 * Генерация и проверка кодов подтверждения для телефонов
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');

// Временное хранилище кодов (в production использовать Redis)
const otpStorage = new Map();

// Время жизни кода (5 минут)
const OTP_EXPIRY = 5 * 60 * 1000;

// Длина кода
const OTP_LENGTH = 6;

/**
 * Генерация случайного кода
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Отправка OTP кода (заглушка - в production использовать SMS сервис)
 */
async function sendOTP(phone, code) {
  // В development режиме просто логируем
  logger.log(`📱 OTP код для ${phone}: ${code}`);
  
  // В production здесь должен быть вызов SMS API (например, Twilio, Sms.ru)
  // await smsService.send(phone, `Ваш код подтверждения: ${code}`);
  
  return true;
}

/**
 * Отправка OTP кода на телефон
 * @param {string} phone - Номер телефона
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function sendOTPCode(phone) {
  try {
    // Нормализация телефона (убираем все кроме цифр)
    const normalizedPhone = phone.replace(/\D/g, '');
    
    if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('7')) {
      throw new Error('Неверный формат телефона. Используйте: +7 (999) 123-45-67');
    }

    // Генерируем код
    const code = generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRY;

    // Сохраняем код
    otpStorage.set(normalizedPhone, {
      code,
      expiresAt,
      attempts: 0,
    });

    // Отправляем код (в development только логируем)
    await sendOTP(phone, code);

    logger.log(`✅ OTP код отправлен на ${phone}`);

    return {
      success: true,
      message: 'Код подтверждения отправлен',
    };
  } catch (error) {
    logger.error('Ошибка отправки OTP:', error);
    throw error;
  }
}

/**
 * Проверка OTP кода
 * @param {string} phone - Номер телефона
 * @param {string} code - Код подтверждения
 * @returns {Promise<{success: boolean, isValid: boolean, message?: string}>}
 */
async function verifyOTP(phone, code) {
  try {
    const normalizedPhone = phone.replace(/\D/g, '');

    const otpData = otpStorage.get(normalizedPhone);

    if (!otpData) {
      return {
        success: false,
        isValid: false,
        message: 'Код не найден. Запросите новый код.',
      };
    }

    // Проверка истечения срока
    if (Date.now() > otpData.expiresAt) {
      otpStorage.delete(normalizedPhone);
      return {
        success: false,
        isValid: false,
        message: 'Код истек. Запросите новый код.',
      };
    }

    // Проверка количества попыток
    if (otpData.attempts >= 3) {
      otpStorage.delete(normalizedPhone);
      return {
        success: false,
        isValid: false,
        message: 'Превышено количество попыток. Запросите новый код.',
      };
    }

    // Проверка кода
    if (otpData.code !== code) {
      otpData.attempts += 1;
      return {
        success: false,
        isValid: false,
        message: `Неверный код. Осталось попыток: ${3 - otpData.attempts}`,
      };
    }

    // Код верный - удаляем из хранилища
    otpStorage.delete(normalizedPhone);

    return {
      success: true,
      isValid: true,
      message: 'Код подтвержден',
    };
  } catch (error) {
    logger.error('Ошибка проверки OTP:', error);
    throw error;
  }
}

/**
 * Получение или создание пользователя по телефону
 * @param {string} phone - Номер телефона
 * @returns {Promise<{user: object, isNew: boolean}>}
 */
async function getOrCreateUserByPhone(phone) {
  try {
    const normalizedPhone = phone.replace(/\D/g, '');
    const formattedPhone = `+7 (${normalizedPhone.substring(1, 4)}) ${normalizedPhone.substring(4, 7)}-${normalizedPhone.substring(7, 9)}-${normalizedPhone.substring(9, 11)}`;

    // Ищем пользователя по телефону
    const result = await query(
      'SELECT id, email, name, phone, role, is_active FROM users WHERE phone = $1',
      [formattedPhone]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (!user.is_active) {
        throw new Error('Аккаунт деактивирован');
      }
      return {
        user,
        isNew: false,
      };
    }

    // Пользователь не найден - создаем нового
    // Генерируем временное имя и email
    const tempName = `Пользователь ${normalizedPhone.substring(7)}`;
    const tempEmail = `user_${normalizedPhone}@temp.delivery`;

    // Создаем пользователя без пароля (авторизация только по OTP)
    const insertResult = await query(
      `INSERT INTO users (email, name, phone, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, phone, role`,
      [tempEmail, tempName, formattedPhone, 'customer', null] // password_hash = null для OTP пользователей
    );

    logger.log(`✅ Создан новый пользователь по телефону: ${formattedPhone}`);

    return {
      user: insertResult.rows[0],
      isNew: true,
    };
  } catch (error) {
    logger.error('Ошибка получения/создания пользователя:', error);
    throw error;
  }
}

/**
 * Очистка истекших кодов (периодическая задача)
 */
function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const [phone, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(phone);
    }
  }
}

// Запускаем очистку каждые 5 минут
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  sendOTPCode,
  verifyOTP,
  getOrCreateUserByPhone,
};
