/**
 * Product Entity - Zod схемы для валидации
 * Строгая типизация для всех операций с продуктами
 */

import { z } from 'zod';

/**
 * Схема продукта от API
 */
const productSchemaBase = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category: z.string().min(1),
  image: z.string().url().or(z.string().startsWith('data:')).or(z.string().startsWith('https://via.placeholder.com')).optional(),
  description: z.string().optional(),
  inStock: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  dark_store_id: z.number().int().positive().optional(),
});

export const productSchema = productSchemaBase.transform((data) => ({
  ...data,
  inStock: data.inStock ?? true, // Гарантируем что inStock всегда boolean
}));

/**
 * Схема ответа API с продуктами
 */
export const productsResponseSchema = z.object({
  success: z.boolean().optional(),
  products: z.array(productSchema).optional(),
  count: z.number().int().nonnegative().optional(),
}).or(z.array(productSchema));

/**
 * Типы на основе схем
 * Используем z.output чтобы получить тип после transform
 * Гарантируем что inStock всегда boolean (не undefined)
 */
export type Product = Omit<z.output<typeof productSchema>, 'inStock'> & { 
  inStock: boolean;
};
export type ProductsResponse = z.infer<typeof productsResponseSchema>;

/**
 * Валидация продукта
 */
export function validateProduct(data: unknown): Product {
  return productSchema.parse(data);
}

/**
 * Валидация ответа с продуктами
 */
export function validateProductsResponse(data: unknown): Product[] {
  const parsed = productsResponseSchema.parse(data);
  
  // Если это массив - возвращаем его
  if (Array.isArray(parsed)) {
    return parsed.map(validateProduct);
  }
  
  // Если это объект с products
  if (parsed.products && Array.isArray(parsed.products)) {
    return parsed.products.map(validateProduct);
  }
  
  throw new Error('Invalid products response format');
}
