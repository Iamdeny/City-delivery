/**
 * Хук для работы с корзиной
 * Мигрировано из frontend/src/hooks/useCart.ts
 * Теперь использует CartContext для глобального состояния
 */
'use client';

import { useCartContext } from '@/app/contexts/CartContext';

export const useCart = () => {
  // Используем глобальный контекст корзины
  return useCartContext();
};
