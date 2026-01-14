/**
 * Унифицированный компонент для управления количеством товара
 * Устраняет дублирование quantity controls в ProductCard, ProductCardPremium, CartItems
 * 
 * Удалено дубликатов: 3+ (quantity controls повторялись в 3+ компонентах)
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { getIconSize } from '../constants/icon-sizes';
import './QuantityControls.css';

interface QuantityControlsProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'modern' | 'premium';
  className?: string;
  disabled?: boolean;
}

export function QuantityControls({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 99,
  size = 'md',
  variant = 'default',
  className = '',
  disabled = false,
}: QuantityControlsProps) {
  const iconSize = size === 'sm' ? getIconSize('sm') : size === 'lg' ? getIconSize('lg') : getIconSize('md');
  const canDecrement = quantity > min && !disabled;
  const canIncrement = quantity < max && !disabled;

  return (
    <div className={`quantity-controls quantity-controls-${variant} quantity-controls-${size} ${className}`}>
      <motion.button
        type="button"
        className="quantity-btn quantity-btn-minus"
        onClick={onDecrement}
        disabled={!canDecrement}
        whileHover={canDecrement ? { scale: 1.1 } : {}}
        whileTap={canDecrement ? { scale: 0.9 } : {}}
        aria-label="Уменьшить количество"
        aria-disabled={!canDecrement}
      >
        <Minus size={iconSize} />
      </motion.button>
      
      <span className="quantity-value" aria-label={`Количество: ${quantity}`}>
        {quantity}
      </span>
      
      <motion.button
        type="button"
        className="quantity-btn quantity-btn-plus"
        onClick={onIncrement}
        disabled={!canIncrement}
        whileHover={canIncrement ? { scale: 1.1 } : {}}
        whileTap={canIncrement ? { scale: 0.9 } : {}}
        aria-label="Увеличить количество"
        aria-disabled={!canIncrement}
      >
        <Plus size={iconSize} />
      </motion.button>
    </div>
  );
}
