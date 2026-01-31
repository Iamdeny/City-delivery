/**
 * Empty State для корзины
 * Показывается когда корзина пуста
 * Мигрировано из frontend/src/components/Cart/CartEmptyState.tsx
 * Упрощено: убрана зависимость от useCartStore
 */
'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { getIconSize } from '@/lib/icon-sizes';

interface CartEmptyStateProps {
  onGoToShopping?: () => void;
}

export function CartEmptyState({ 
  onGoToShopping,
}: CartEmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-6 min-h-[min(400px,60vh)] text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-4 max-w-md">
        {/* Иконка */}
        <motion.div
          className="text-gray-300 mb-2"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <ShoppingBag size={getIconSize('2xl')} strokeWidth={1.5} />
        </motion.div>

        {/* Текст */}
        <h2 className="text-2xl font-bold text-gray-900 m-0">Корзина пуста</h2>
        <p className="text-base text-gray-600 m-0 leading-relaxed">
          Добавьте товары из каталога, чтобы начать покупки
        </p>

        {/* Кнопка "Перейти к покупкам" */}
        {onGoToShopping && (
          <motion.button
            className="flex items-center gap-2 py-3.5 px-7 mt-2 border-none rounded-[28px] bg-indigo-500 text-white text-base font-semibold cursor-pointer transition-all shadow-sm hover:bg-indigo-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
            onClick={onGoToShopping}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Перейти к покупкам"
          >
            <span>Перейти к покупкам</span>
            <ArrowRight size={getIconSize('md')} strokeWidth={2.5} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
