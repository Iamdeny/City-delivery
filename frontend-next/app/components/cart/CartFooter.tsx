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
    <div className="sticky bottom-0 left-0 right-0 bg-white z-10 px-5 pt-4 pb-[max(24px,calc(var(--safe-bottom)+16px))]">
      <button
        onClick={onCheckout}
        disabled={isDisabled}
        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:bg-[#d1d5db] disabled:cursor-not-allowed transition-all rounded-2xl px-6 py-4 min-h-[56px] flex items-center justify-between active:scale-[0.99]"
        aria-label={`Оплатить ${formattedTotal}`}
      >
        <span className="text-[16px] font-bold text-white">Оплатить</span>
        <span className="text-[16px] font-bold text-white tabular-nums">{formattedTotal}</span>
      </button>
    </div>
  );
}
