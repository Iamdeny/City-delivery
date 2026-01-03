import { useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem } from '../types/cart';
import { Product } from '../types/product';
import { StorageService } from '../utils/storage';
import { TIMEOUTS } from '../config/constants';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(() => {
    return StorageService.getCart();
  });

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
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.image,
          inStock: product.inStock,
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

  const restoreCart = useCallback(() => {
    const saved = StorageService.getCart();
    if (saved.length > 0) {
      setItems(saved);
      return true;
    }
    return false;
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (items.length > 0) {
        StorageService.saveCart(items);
      } else {
        StorageService.clearCart();
      }
    }, TIMEOUTS.CART_SAVE);

    return () => clearTimeout(timeoutId);
  }, [items]);

  // Мемоизируем возвращаемый объект
  return useMemo(() => ({
    cart: items,
    totalAmount,
    totalItems,
    hasItems,
    addToCart,
    removeFromCart,
    decrementQuantity,
    updateQuantity,
    clearCart,
    restoreCart,
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
    restoreCart,
  ]);
};
