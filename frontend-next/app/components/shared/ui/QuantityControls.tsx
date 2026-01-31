/**
 * Унифицированный компонент для управления количеством товара
 * Устраняет дублирование quantity controls в ProductCard, ProductCardPremium, CartItems
 * 
 * Удалено дубликатов: 3+ (quantity controls повторялись в 3+ компонентах)
 * 
 * Client Component - использует framer-motion и event handlers
 */
'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { getIconSize } from '@/lib/icon-sizes';

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

const sizeClasses = {
  sm: {
    container: 'gap-0.5 p-0.5',
    button: 'w-6 h-6',
  },
  md: {
    container: 'gap-1 p-1',
    button: 'w-8 h-8',
  },
  lg: {
    container: 'gap-2 p-1.5',
    button: 'w-10 h-10',
  },
};

const variantClasses = {
  default: 'bg-gray-50',
  modern: 'bg-white border border-gray-200',
  premium: 'bg-gradient-to-br from-indigo-500 via-pink-500 to-orange-500 p-1.5',
};

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
  const sizeConfig = sizeClasses[size];
  const isPremium = variant === 'premium';
  const isModern = variant === 'modern';
  const rounding = isModern ? 'rounded-full' : 'rounded-xl';
  const btnRounding = isModern ? 'rounded-full' : 'rounded-xl';

  return (
    <div className={`flex items-center ${rounding} ${sizeConfig.container} ${variantClasses[variant]} ${className}`}>
      <motion.button
        type="button"
        className={`
          ${sizeConfig.button}
          flex items-center justify-center
          ${btnRounding}
          border-none
          cursor-pointer
          transition-all duration-150
          shadow-sm
          ${isPremium 
            ? 'bg-white/20 text-white backdrop-blur-sm' 
            : isModern ? 'bg-gray-50 text-slate-900 border border-gray-200' : 'bg-white text-slate-900'
          }
          ${!canDecrement ? 'opacity-50 cursor-not-allowed' : ''}
          ${!isPremium && canDecrement ? 'hover:bg-gray-100 active:scale-95' : ''}
        `}
        onClick={onDecrement}
        disabled={!canDecrement}
        whileHover={canDecrement && !isPremium ? { scale: 1.1 } : {}}
        whileTap={canDecrement ? { scale: 0.9 } : {}}
        aria-label="Уменьшить количество"
        aria-disabled={!canDecrement}
      >
        <Minus size={iconSize} className={isPremium ? 'text-white' : 'text-red-500'} />
      </motion.button>
      
      <span 
        className={`min-w-[24px] text-center text-base font-semibold ${
          isPremium ? 'text-white' : 'text-slate-900'
        }`}
        aria-label={`Количество: ${quantity}`}
      >
        {quantity}
      </span>
      
      <motion.button
        type="button"
        className={`
          ${sizeConfig.button}
          flex items-center justify-center
          ${btnRounding}
          border-none
          cursor-pointer
          transition-all duration-150
          shadow-sm
          ${isPremium 
            ? 'bg-white/20 text-white backdrop-blur-sm' 
            : isModern ? 'bg-gray-50 text-slate-900 border border-gray-200' : 'bg-white text-slate-900'
          }
          ${!canIncrement ? 'opacity-50 cursor-not-allowed' : ''}
          ${!isPremium && canIncrement ? 'hover:bg-gray-100 active:scale-95' : ''}
        `}
        onClick={onIncrement}
        disabled={!canIncrement}
        whileHover={canIncrement && !isPremium ? { scale: 1.1 } : {}}
        whileTap={canIncrement ? { scale: 0.9 } : {}}
        aria-label="Увеличить количество"
        aria-disabled={!canIncrement}
      >
        <Plus size={iconSize} className={isPremium ? 'text-white' : 'text-indigo-600'} />
      </motion.button>
    </div>
  );
}
