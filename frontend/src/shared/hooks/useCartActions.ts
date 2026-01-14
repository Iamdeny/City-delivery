/**
 * Унифицированный хук для действий с корзиной
 * Устраняет дублирование логики handleAddToCart, handleDecrement, handleIncrement
 * 
 * Удалено дубликатов: 3+ (из ProductCard, ProductCardPremium, CartItems)
 */
import { useCallback } from 'react';
import type { Product } from '../types';

interface UseCartActionsOptions {
  onAddToCart?: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  product: Product;
  cartQuantity: number;
}

export function useCartActions({
  onAddToCart,
  onRemoveFromCart,
  product,
  cartQuantity,
}: UseCartActionsOptions) {
  const handleAddToCart = useCallback(() => {
    onAddToCart?.(product);
  }, [onAddToCart, product]);

  const handleIncrement = useCallback(() => {
    onAddToCart?.(product);
  }, [onAddToCart, product]);

  const handleDecrement = useCallback(() => {
    if (onRemoveFromCart && cartQuantity > 0) {
      onRemoveFromCart(product);
    }
  }, [onRemoveFromCart, product, cartQuantity]);

  const handleRemove = useCallback(() => {
    if (onRemoveFromCart && cartQuantity > 0) {
      onRemoveFromCart(product);
    }
  }, [onRemoveFromCart, product, cartQuantity]);

  return {
    handleAddToCart,
    handleIncrement,
    handleDecrement,
    handleRemove,
  };
}
