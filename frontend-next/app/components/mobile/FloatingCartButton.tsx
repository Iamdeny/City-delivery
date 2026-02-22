/**
 * Плавающая кнопка корзины для мобильных устройств
 * Показывается внизу экрана с суммой и временем доставки
 * Мигрировано из frontend/src/components/Mobile/FloatingCartButton.tsx
 */
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';
import { useCart } from '@/app/hooks/useCart';
import { Check } from 'lucide-react';

interface FloatingCartButtonProps {
  estimatedTime?: string;
  onOpenCart?: () => void;
}

export default function FloatingCartButton({
  estimatedTime = '15 минут',
  onOpenCart,
}: FloatingCartButtonProps) {
  const router = useRouter();
  const { totalItems, totalAmount } = useCart();
  const [pulse, setPulse] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [prevItems, setPrevItems] = useState(0);

  // Самокат-стиль: эффектная "реанимация" при добавлении товаров
  useEffect(() => {
    if (totalItems > prevItems) {
      setPulse(true);
      setShowCheck(true);
      const pulseTimeout = setTimeout(() => setPulse(false), 600);
      const checkTimeout = setTimeout(() => setShowCheck(false), 800);
      return () => {
        clearTimeout(pulseTimeout);
        clearTimeout(checkTimeout);
      };
    }
    setPrevItems(totalItems);
  }, [totalItems, prevItems]);

  // Не показываем кнопку, если корзина пуста
  if (totalItems === 0) {
    return null;
  }

  const handleClick = () => {
    if (onOpenCart) {
      onOpenCart();
      return;
    }
    router.push('/cart');
  };

  return (
    <motion.button
      onClick={handleClick}
      className="fixed z-[998] lg:hidden
                 bottom-4 translate-y-[calc(-1*var(--safe-bottom))]
                 right-4
                 h-[56px] px-7 py-3
                 rounded-[40px]
                 bg-pink-500 text-white border-none
                 shadow-[0_4px_16px_rgba(255,51,95,0.4)]
                 cursor-pointer
                 transition-all duration-200 ease-out will-change-transform motion-reduce:transition-none
                 active:scale-[0.98] hover:shadow-[0_6px_20px_rgba(255,51,95,0.5)]
                 overflow-hidden relative"
      aria-label={`Корзина: ${totalItems} товаров на сумму ${totalAmount} рублей. Доставка за ${estimatedTime}`}
      animate={
        pulse
          ? {
              scale: [1, 1.25, 1.15, 1],
              boxShadow: [
                '0_4px_16px_rgba(255,51,95,0.4)',
                '0_8px_32px_rgba(255,51,95,0.6)',
                '0_6px_24px_rgba(255,51,95,0.5)',
                '0_4px_16px_rgba(255,51,95,0.4)',
              ],
            }
          : { scale: 1 }
      }
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Эффект "ripple" при добавлении */}
      {pulse && (
        <motion.div
          className="absolute inset-0 rounded-[40px] bg-white/30"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}

      <div className="relative flex flex-col items-center justify-center whitespace-nowrap h-full z-10">
        <AnimatePresence mode="wait">
          {showCheck ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3, ease: 'backOut' }}
              className="flex items-center justify-center"
            >
              <Check className="w-7 h-7 text-white" strokeWidth={3} />
            </motion.div>
          ) : (
            <motion.div
              key="price"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <span className="text-xl font-extrabold text-white tabular-nums leading-none tracking-tight">
                {totalAmount} ₽
              </span>
              <span className="mt-0.5 text-xs font-semibold text-white/90 leading-none">{estimatedTime}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
