import { useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem } from '../types/cart';
import { Product } from '../types/product';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
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
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (items.length > 0) {
        localStorage.setItem('cart', JSON.stringify(items));
      } else {
        localStorage.removeItem('cart');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [items]);

  return {
    cart: items,
    totalAmount,
    totalItems,
    hasItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    restoreCart,
  };
};
