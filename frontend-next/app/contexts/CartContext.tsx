/**
 * Context для глобального состояния корзины
 * Обеспечивает синхронизацию состояния корзины между всеми компонентами
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CartItem, Product } from '@/types';
import { StorageService } from '@/lib/storage';

interface CartContextType {
  cart: CartItem[];
  totalAmount: number;
  totalItems: number;
  hasItems: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  decrementQuantity: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Загружаем данные из localStorage только на клиенте после монтирования
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    
    // Используем requestIdleCallback для неблокирующего чтения localStorage
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const savedCart = StorageService.getCart();
        if (savedCart.length > 0) {
          setItems(savedCart);
        }
      }, { timeout: 200 });
    } else {
      // Fallback для браузеров без requestIdleCallback
      setTimeout(() => {
        const savedCart = StorageService.getCart();
        if (savedCart.length > 0) {
          setItems(savedCart);
        }
      }, 50);
    }
  }, []);

  // Мемоизируем вычисляемые значения
  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const hasItems = useMemo(() => {
    return items.length > 0;
  }, [items]);

  // Мемоизируем обработчики
  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        const newItems = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return newItems;
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.image ?? '',
          inStock: product.inStock ?? true,
          quantity: 1,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const decrementQuantity = useCallback((product: Product) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      
      if (!existingItem) {
        return prev;
      }

      if (existingItem.quantity <= 1) {
        return prev.filter((item) => item.id !== product.id);
      }

      return prev.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: number, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(productId);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Сохранение в localStorage (только после монтирования)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const timeoutId = setTimeout(() => {
      if (items.length > 0) {
        StorageService.saveCart(items);
      } else {
        StorageService.clearCart();
      }
    }, 300); // Debounce сохранения

    return () => clearTimeout(timeoutId);
  }, [items, mounted]);

  // Мемоизируем значение контекста
  const value = useMemo(() => ({
    cart: items,
    totalAmount,
    totalItems,
    hasItems,
    addToCart,
    removeFromCart,
    decrementQuantity,
    updateQuantity,
    clearCart,
  }), [
    items,
    totalAmount,
    totalItems,
    hasItems,
    addToCart,
    removeFromCart,
    decrementQuantity,
    updateQuantity,
    clearCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}
