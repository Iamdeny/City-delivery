/**
 * Валидаторы для авторизации и регистрации
 * Использует Zod для строгой валидации входных данных
 */

const { z } = require('zod');

/**
 * Схема валидации регистрации
 */
const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный формат email')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Пароль должен быть не менее 8 символов')
    .max(100, 'Пароль слишком длинный')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру')
    .regex(/[^A-Za-z0-9]/, 'Пароль должен содержать хотя бы один специальный символ'),
  name: z
    .string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(100, 'Имя слишком длинное')
    .trim(),
  phone: z
    .string()
    .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Неверный формат телефона. Используйте: +7 (999) 123-45-67')
    .optional()
    .or(z.literal('')),
  role: z
    .enum(['customer', 'courier', 'picker', 'admin', 'manager'], {
      errorMap: () => ({ message: 'Невалидная роль' }),
    })
    .default('customer'),
});

/**
 * Схема валидации входа
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный формат email')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Пароль обязателен'),
});

/**
 * Схема валидации обновления токена
 */
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token обязателен'),
});

/**
 * Middleware для валидации регистрации
 */
const validateRegister = (req, res, next) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      error: 'Ошибка валидации',
      details: errors,
    });
  }

  // Нормализуем данные (убираем пустые строки)
  req.body = {
    ...result.data,
    phone: result.data.phone || null,
  };

  next();
};

/**
 * Middleware для валидации входа
 */
const validateLogin = (req, res, next) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      error: 'Ошибка валидации',
      details: errors,
    });
  }

  req.body = result.data;
  next();
};

/**
 * Middleware для валидации refresh token
 */
const validateRefreshToken = (req, res, next) => {
  const result = refreshTokenSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      error: 'Ошибка валидации',
      details: errors,
    });
  }

  req.body = result.data;
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};

