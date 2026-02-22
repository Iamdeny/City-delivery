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
      className="flex flex-col items-center justify-center py-16 px-5 min-h-[min(400px,60vh)] text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-5 max-w-md">
        <motion.div
          className="text-gray-300"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <ShoppingBag size={getIconSize('2xl')} strokeWidth={1.5} />
        </motion.div>

        <h2 className="text-[22px] font-extrabold text-[#1a1a1a] m-0 leading-tight">Корзина пуста</h2>
        <p className="text-[15px] text-[#5a5a5a] m-0 leading-relaxed">
          Добавьте товары из каталога, чтобы начать покупки
        </p>

        {onGoToShopping && (
          <motion.button
            className="flex items-center gap-2 py-4 px-8 rounded-2xl bg-blue-600 text-white text-[16px] font-semibold cursor-pointer transition-all shadow-sm hover:bg-blue-700 hover:shadow-md active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
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
