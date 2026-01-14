/**
 * Cart Entity - Zod схемы для валидации
 */

import { z } from 'zod';

/**
 * Схема элемента корзины
 */
export const cartItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string().min(1),
  image: z.string(),
  inStock: z.boolean().optional().default(true),
  quantity: z.number().int().positive().min(1).max(99),
});

/**
 * Схема состояния корзины
 */
export const cartStateSchema = z.object({
  items: z.array(cartItemSchema),
  totalAmount: z.number().nonnegative(),
  totalItems: z.number().int().nonnegative(),
});

/**
 * Типы на основе схем
 */
export type CartItem = z.infer<typeof cartItemSchema>;
export type CartState = z.infer<typeof cartStateSchema>;

/**
 * Валидация элемента корзины
 */
export function validateCartItem(data: unknown): CartItem {
  return cartItemSchema.parse(data);
}

/**
 * Валидация состояния корзины
 */
export function validateCartState(data: unknown): CartState {
  return cartStateSchema.parse(data);
}
