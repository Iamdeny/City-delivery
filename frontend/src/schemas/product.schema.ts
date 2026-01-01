// src/schemas/product.schema.ts
import { z } from 'zod';

// Базовая схема для товара
export const productSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Название товара обязательно'),
  price: z.number().positive('Цена должна быть положительной'),
  category: z.string().min(1, 'Категория обязательна'),
  image: z.string().default('📦'), // Эмодзи по умолчанию
  description: z.string().optional(),
  inStock: z.boolean().default(true),
  rating: z.number().min(0).max(5).optional(),
});

// Схема для ответа API (массив товаров)
export const productsResponseSchema = z.array(productSchema);

// Экспортируем тип Product, выведенный из схемы
export type Product = z.infer<typeof productSchema>;
