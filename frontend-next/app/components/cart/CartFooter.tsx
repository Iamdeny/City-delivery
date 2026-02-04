/**
 * Футер корзины с кнопкой оплаты
 * Согласно референсу из design/cart/
 */
'use client';

import { useEffect, useState } from 'react';
import { formatPriceWithCurrency } from '@/lib/format';

interface CartFooterProps {
  totalAmount: number;
  onCheckout: () => void;
  disabled?: boolean;
}

export function CartFooter({ totalAmount, onCheckout, disabled = false }: CartFooterProps) {
  const formattedTotal = formatPriceWithCurrency(totalAmount);
  const [isWorkingHours, setIsWorkingHours] = useState(true);

  // Проверяем, работаем ли мы сейчас (08:00 - 23:00) и обновляем в реальном времени
  useEffect(() => {
    const checkWorkingHours = () => {
      const now = new Date();
      const hours = now.getHours();
      setIsWorkingHours(hours >= 8 && hours < 23);
    };

    // Проверяем сразу
    checkWorkingHours();

    // Обновляем каждую минуту
    const interval = setInterval(checkWorkingHours, 60000);

    return () => clearInterval(interval);
  }, []);

  const isDisabled = disabled || !isWorkingHours;

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 px-4 pt-4 pb-[max(32px,calc(var(--safe-bottom)+16px))]">
      {/* Banani: Оплатить X ₽ */}
      <button
        onClick={onCheckout}
        disabled={isDisabled}
        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all rounded-2xl px-6 py-4 flex items-center justify-between active:scale-[0.98]"
        aria-label={`Оплатить ${formattedTotal}`}
      >
        <span className="text-[16px] font-extrabold text-white">Оплатить</span>
        <span className="text-[16px] font-extrabold text-white tabular-nums">{formattedTotal}</span>
      </button>
    </div>
  );
}
