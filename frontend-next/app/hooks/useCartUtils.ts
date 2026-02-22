/**
 * Утилиты для работы с корзиной
 * Централизованные функции для преобразования cart в разные форматы
 */
'use client';

import { useMemo } from 'react';
import type { CartItem } from '@/types';

/**
 * Преобразует cart в упрощенный формат { id, quantity }
 * Используется для передачи в компоненты, которые не нуждаются в полных данных товара
 */
export function useCartItems(cart: CartItem[]) {
  return useMemo(
    () => cart.map(item => ({ id: item.id, quantity: item.quantity })),
    [cart]
  );
}

/**
 * Создает Set с ID товаров в корзине для быстрой проверки наличия
 */
export function useCartProductIds(cart: CartItem[]) {
  return useMemo(
    () => new Set(cart.map(item => item.id)),
    [cart]
  );
}

/**
 * Создает Map для быстрого доступа к количеству товаров в корзине по ID
 */
export function useCartQuantityMap(cart: CartItem[]) {
  return useMemo(() => {
    const map = new Map<number, number>();
    cart.forEach(item => map.set(item.id, item.quantity));
    return map;
  }, [cart]);
}

/**
 * Комбинированный хук, возвращающий все структуры данных для корзины
 * Оптимизирован для случаев, когда нужны все структуры одновременно
 */
export function useCartMaps(cart: CartItem[]) {
  return useMemo(() => {
    const ids = new Set<number>();
    const quantityMap = new Map<number, number>();
    const items = cart.map(item => {
      ids.add(item.id);
      quantityMap.set(item.id, item.quantity);
      return { id: item.id, quantity: item.quantity };
    });
    return { ids, quantityMap, items };
  }, [cart]);
}

/**
 * Преобразует cart в формат для API заказа
 */
export function useCartOrderItems(cart: CartItem[]) {
  return useMemo(
    () => cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
    })),
    [cart]
  );
}
