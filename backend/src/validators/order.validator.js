/**
 * Валидаторы для заказов
 * Использует Zod для строгой валидации входных данных
 */

const { z } = require('zod');

/**
 * Схема валидации товара в заказе
 */
const orderItemSchema = z.object({
  productId: z
    .number()
    .int('ID товара должен быть целым числом')
    .positive('ID товара должен быть положительным числом'),
  quantity: z
    .number()
    .int('Количество должно быть целым числом')
    .positive('Количество должно быть положительным числом')
    .max(100, 'Максимальное количество товара в заказе: 100'),
});

/**
 * Схема валидации создания заказа
 */
const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'Корзина не может быть пустой')
    .max(50, 'Максимальное количество товаров в заказе: 50'),
  address: z
    .string()
    .min(10, 'Адрес должен быть не менее 10 символов')
    .max(500, 'Адрес слишком длинный')
    .trim(),
  phone: z
    .string()
    .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Неверный формат телефона. Используйте: +7 (999) 123-45-67')
    .trim(),
  comment: z
    .string()
    .max(1000, 'Комментарий слишком длинный')
    .optional()
    .or(z.literal('')),
  latitude: z
    .number()
    .min(-90, 'Широта должна быть от -90 до 90')
    .max(90, 'Широта должна быть от -90 до 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Долгота должна быть от -180 до 180')
    .max(180, 'Долгота должна быть от -180 до 180')
    .optional(),
}).refine(
  (data) => {
    // Если указана широта, должна быть указана и долгота, и наоборот
    if (data.latitude !== undefined || data.longitude !== undefined) {
      return data.latitude !== undefined && data.longitude !== undefined;
    }
    return true;
  },
  {
    message: 'Широта и долгота должны быть указаны вместе',
    path: ['latitude'],
  }
);

/**
 * Схема валидации обновления статуса заказа
 */
const updateOrderStatusSchema = z.object({
  status: z.enum(
    [
      'pending',
      'preparing',
      'picking',
      'ready',
      'assigned_to_courier',
      'picked_up',
      'delivering',
      'delivered',
      'cancelled',
    ],
    {
      errorMap: () => ({ message: 'Невалидный статус заказа' }),
    }
  ),
});

/**
 * Middleware для валидации создания заказа
 */
const validateCreateOrder = (req, res, next) => {
  const result = createOrderSchema.safeParse(req.body);

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

  // Нормализуем данные
  req.body = {
    ...result.data,
    comment: result.data.comment || null,
  };

  next();
};

/**
 * Middleware для валидации обновления статуса
 */
const validateUpdateOrderStatus = (req, res, next) => {
  const result = updateOrderStatusSchema.safeParse(req.body);

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
  validateCreateOrder,
  validateUpdateOrderStatus,
  createOrderSchema,
  updateOrderStatusSchema,
  orderItemSchema,
};

