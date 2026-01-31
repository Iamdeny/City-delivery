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
      {/* Итого */}
      <div className="flex items-center justify-center mb-4">
        <div className="text-center">
          <span className="text-sm font-medium text-gray-600">Итого</span>
          <div className="text-2xl font-bold text-gray-800 mt-1">{formattedTotal}</div>
        </div>
      </div>
      
      {/* Кнопка в стиле Самоката */}
      <button
        onClick={onCheckout}
        disabled={isDisabled}
        className={`w-full bg-[#ff3363] hover:bg-[#ff1a52] active:bg-[#ff0040] disabled:bg-[#ff3363] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all rounded-[40px] px-6 py-5 shadow-[0_4px_16px_rgba(255,51,95,0.4)] active:scale-[0.98]`}
        style={{
          fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
        }}
        aria-label={`Оформить заказ на сумму ${formattedTotal}`}
      >
        <div className="text-center text-white">
          <div className="text-[13.3333px] font-semibold leading-tight">Работаем с 08:00 до 23:00</div>
        </div>
      </button>
    </div>
  );
}
