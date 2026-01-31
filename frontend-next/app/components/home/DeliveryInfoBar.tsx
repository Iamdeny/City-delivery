/**
 * Блок с адресом доставки и временем в стиле Самоката
 */
'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeliveryInfoBar() {
  const router = useRouter();
  const [address, setAddress] = useState('Выберите адрес');
  const [deliveryTime, setDeliveryTime] = useState('30 минут');

  useEffect(() => {
    try {
      const addr = localStorage.getItem('cd_address') || 'Выберите адрес';
      setAddress(addr);
      // TODO: Получить реальное время доставки из API
      setDeliveryTime('30 минут');
    } catch {
      // ignore
    }
  }, []);

  const handleAddressClick = () => {
    // TODO: Открыть модальное окно выбора адреса
    router.push('/products');
  };

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <button
        type="button"
        onClick={handleAddressClick}
        className="flex-1 min-w-0 flex items-center gap-1.5 text-left active:opacity-70 transition-opacity"
      >
        <span className="text-base font-extrabold text-[#1a1a1a] truncate">{address}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-[#404040] whitespace-nowrap ml-1">Доставка {deliveryTime}</span>
      </button>
      <button
        type="button"
        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        aria-label="Профиль"
      >
        <User className="w-4 h-4 text-[#404040]" />
      </button>
    </div>
  );
}
