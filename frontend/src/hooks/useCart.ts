import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '../types/product';
import { StorageService } from '../utils/storage';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];

    const savedCart = StorageService.getCart();

    if (Array.isArray(savedCart)) {
      return savedCart
        .map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 1,
        }))
        .filter(
          (item) => item.id && item.name && typeof item.price === 'number'
        );
    }

    return [];
  });

  useEffect(() => {
    if (cart.length > 0) {
      StorageService.saveCart(cart);
    } else {
      StorageService.clearCart();
    }
  }, [cart]);

  const addToCart = useCallback((product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: number, newQuantity: number) => {
      if (newQuantity < 1) {
        removeFromCart(productId);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    if (window.confirm('Очистить корзину?')) {
      setCart([]);
      StorageService.clearCart();
    }
  }, []);

  const restoreCart = useCallback(() => {
    const savedCart = StorageService.getCart();
    if (savedCart.length > 0) {
      setCart(savedCart);
      return true;
    }
    return false;
  }, []);

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    totalAmount,
    totalItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    restoreCart,
    hasItems: cart.length > 0,
  };
}
