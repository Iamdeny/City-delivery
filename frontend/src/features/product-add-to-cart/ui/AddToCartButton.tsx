/**
 * Feature: Add to Cart
 * Кнопка добавления в корзину с optimistic update
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { getIconSize } from '../../../shared/constants/icon-sizes';
import { useCartStore } from '../../../entities/cart/model/store';
import type { Product } from '../../../entities/product/model/types';
import './AddToCartButton.css';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function AddToCartButton({ 
  product, 
  className = '',
  size = 'medium' 
}: AddToCartButtonProps) {
  const { addItem, isInCart, getItemQuantity } = useCartStore();
  const quantity = getItemQuantity(product.id);
  const inCart = isInCart(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  if (inCart && quantity > 0) {
    return (
      <QuantityControls 
        productId={product.id} 
        quantity={quantity}
        className={className}
        size={size}
      />
    );
  }

  return (
    <motion.button
      type="button"
      className={`add-to-cart-btn ${size} ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      aria-label={`Добавить ${product.name} в корзину`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <ShoppingCart size={getIconSize('sm')} strokeWidth={2.5} />
      </motion.div>
      <span>В корзину</span>
    </motion.button>
  );
}

interface QuantityControlsProps {
  productId: number;
  quantity: number;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

function QuantityControls({ 
  productId, 
  quantity,
  className = '',
  size = 'medium'
}: QuantityControlsProps) {
  const { incrementQuantity, decrementQuantity } = useCartStore();

  return (
    <motion.div
      className={`quantity-controls ${size} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      <motion.button
        type="button"
        className="quantity-btn minus"
        onClick={(e) => {
          e.stopPropagation();
          decrementQuantity(productId);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={`Уменьшить количество товара. Текущее количество: ${quantity}`}
      >
        <Minus size={getIconSize('sm')} strokeWidth={2.5} />
      </motion.button>
      
      <motion.span
        className="quantity-value"
        key={quantity}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {quantity}
      </motion.span>
      
      <motion.button
        type="button"
        className="quantity-btn plus"
        onClick={(e) => {
          e.stopPropagation();
          incrementQuantity(productId);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        disabled={quantity >= 99}
        aria-label={`Увеличить количество товара. Текущее количество: ${quantity}`}
        aria-disabled={quantity >= 99}
      >
        <Plus size={getIconSize('sm')} strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}
