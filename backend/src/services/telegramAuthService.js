/**
 * Сервис для авторизации через Telegram Login Widget
 * Проверяет подпись данных от Telegram и создает/находит пользователя
 */

const crypto = require('crypto');
const { query } = require('../config/database');
const { generateTokens } = require('../middleware/auth');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

class TelegramAuthService {
  /**
   * Проверяет подпись данных от Telegram
   * @param {Object} data - Данные от Telegram Widget
   * @param {string} botToken - Токен бота (из .env)
   * @returns {boolean} - true если подпись валидна
   */
  verifyHash(data, botToken) {
    try {
      const { hash, ...userData } = data;
      
      if (!hash || !botToken) {
        return false;
      }

      // Создаем строку для проверки подписи
      // Формат: key1=value1\nkey2=value2\n... (в алфавитном порядке)
      const dataCheckString = Object.keys(userData)
        .sort()
        .map((key) => `${key}=${userData[key]}`)
        .join('\n');

      // Создаем секретный ключ из bot token
      const secretKey = crypto
        .createHash('sha256')
        .update(botToken)
        .digest();

      // Вычисляем HMAC-SHA256
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Сравниваем хеши
      return calculatedHash === hash;
    } catch (error) {
      logger.error('Ошибка проверки Telegram hash:', error);
      return false;
    }
  }

  /**
   * Проверяет, не истек ли срок действия данных (auth_date)
   * Telegram рекомендует проверять данные не старше 86400 секунд (24 часа)
   * @param {number} authDate - Unix timestamp от Telegram
   * @returns {boolean} - true если данные актуальны
   */
  isAuthDateValid(authDate) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - authDate;
    const maxAge = 86400; // 24 часа в секундах

    return timeDiff >= 0 && timeDiff <= maxAge;
  }

  /**
   * Создает или находит пользователя по telegram_id
   * @param {Object} telegramData - Данные от Telegram
   * @returns {Object} - { user, isNew, tokens }
   */
  async getOrCreateUserByTelegram(telegramData) {
    const { id, first_name, last_name, username, photo_url } = telegramData;
    const telegramId = parseInt(id, 10);
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || username || `Пользователь ${telegramId}`;
    const avatarUrl = photo_url || null;

    try {
      // Ищем пользователя по telegram_id
      let userResult = await query(
        'SELECT id, email, name, role, telegram_id, telegram_avatar FROM users WHERE telegram_id = $1',
        [telegramId]
      );

      let user;
      let isNew = false;

      if (userResult.rows.length === 0) {
        // Создаем нового пользователя
        // Для Telegram авторизации email не обязателен, но поле в БД NOT NULL
        // Создаем уникальный email на основе telegram_id
        const defaultEmail = `telegram_${telegramId}@telegram.local`;
        // Генерируем случайный пароль (пользователь не будет его использовать)
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const newUserResult = await query(
          `INSERT INTO users (email, password_hash, name, telegram_id, telegram_avatar, role)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, email, name, role, telegram_id, telegram_avatar`,
          [defaultEmail, hashedPassword, fullName, telegramId, avatarUrl, 'customer']
        );

        user = newUserResult.rows[0];
        isNew = true;
        logger.info(`[Telegram Auth] Создан новый пользователь: telegram_id=${telegramId}, name=${fullName}`);
      } else {
        // Обновляем имя и аватар, если они изменились
        user = userResult.rows[0];
        
        if (user.name !== fullName || user.telegram_avatar !== avatarUrl) {
          await query(
            'UPDATE users SET name = $1, telegram_avatar = $2, updated_at = NOW() WHERE id = $3',
            [fullName, avatarUrl, user.id]
          );
          user.name = fullName;
          user.telegram_avatar = avatarUrl;
          logger.info(`[Telegram Auth] Обновлен профиль пользователя: id=${user.id}`);
        }

        logger.info(`[Telegram Auth] Пользователь найден: telegram_id=${telegramId}, id=${user.id}`);
      }

      // Генерируем JWT токены
      const tokens = generateTokens(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        isNew,
        tokens,
      };
    } catch (error) {
      logger.error('[Telegram Auth] Ошибка создания/поиска пользователя:', error);
      throw error;
    }
  }
}

module.exports = new TelegramAuthService();
