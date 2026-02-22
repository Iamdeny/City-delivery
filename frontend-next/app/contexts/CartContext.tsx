/**
 * Context для глобального состояния корзины
 * - Без авторизации: state + localStorage
 * - С авторизацией: при загрузке — корзина с сервера; при изменениях — синхронизация с API
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CartItem, Product } from '@/types';
import { StorageService } from '@/lib/storage';
import {
  hasCartApiToken,
  fetchCartFromServer,
  addCartItemOnServer,
  updateCartItemOnServer,
  removeCartItemOnServer,
  clearCartOnServer,
} from '@/app/services/cartService';

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

  // Загрузка корзины при монтировании: с сервера (если авторизован) или из localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);

    const loadCart = () => {
      if (hasCartApiToken()) {
        fetchCartFromServer().then((serverItems) => {
          setItems((prev) => {
            // Не затирать корзину, если пользователь уже что-то добавил пока грузилась корзина с сервера
            if (prev.length > 0) return prev;
            return serverItems;
          });
          if (serverItems.length > 0) StorageService.saveCart(serverItems);
        });
      } else {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            const savedCart = StorageService.getCart();
            setItems((prev) => (prev.length > 0 ? prev : savedCart.length > 0 ? savedCart : prev));
          }, { timeout: 200 });
        } else {
          setTimeout(() => {
            const savedCart = StorageService.getCart();
            setItems((prev) => (prev.length > 0 ? prev : savedCart.length > 0 ? savedCart : prev));
          }, 50);
        }
      }
    };

    loadCart();
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

  const addToCartLocal = useCallback((product: Product) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [...prev, { id: product.id, name: product.name, price: product.price, category: product.category, image: product.image ?? '', inStock: product.inStock ?? true, quantity: 1 }];
    });
  }, []);

  const addToCart = useCallback((product: Product) => {
    if (hasCartApiToken()) {
      addToCartLocal(product);
      addCartItemOnServer(product.id, 1).then((result) => {
        if (result !== null && result.length > 0) setItems(result);
      });
      return;
    }
    addToCartLocal(product);
  }, [addToCartLocal]);

  const removeFromCart = useCallback((productId: number) => {
    if (hasCartApiToken()) {
      removeCartItemOnServer(productId).then((result) => {
        if (result !== null) setItems(result);
        else setItems((prev) => prev.filter((item) => item.id !== productId));
      });
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const decrementQuantity = useCallback((product: Product) => {
    if (hasCartApiToken()) {
      const existingItem = items.find((item) => item.id === product.id);
      const nextQty = existingItem ? existingItem.quantity - 1 : 0;
      if (nextQty < 1) {
        removeCartItemOnServer(product.id).then((result) => {
          if (result !== null) setItems(result);
          else setItems((prev) => prev.filter((item) => item.id !== product.id));
        });
      } else {
        updateCartItemOnServer(product.id, nextQty).then((result) => {
          if (result !== null) setItems(result);
          else setItems((prev) => prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item)));
        });
      }
      return;
    }
    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (!existingItem) return prev;
      if (existingItem.quantity <= 1) return prev.filter((item) => item.id !== product.id);
      return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item));
    });
  }, [items]);

  const updateQuantity = useCallback(
    (productId: number, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(productId);
        return;
      }
      if (hasCartApiToken()) {
        updateCartItemOnServer(productId, quantity).then((result) => {
          if (result !== null) setItems(result);
          else setItems((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)));
        });
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)));
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    if (hasCartApiToken()) {
      clearCartOnServer().then((result) => {
        if (result !== null) setItems([]);
        else setItems([]);
      });
      return;
    }
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
