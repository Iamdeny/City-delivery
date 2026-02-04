/**
 * Блок с адресом доставки и временем в стиле Самоката
 */
'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeliveryInfoBar() {
  const router = useRouter();

  // Дефолт как в макете Banani
  const [address, setAddress] = useState('Дом, Пискарёвский проспект');
  const [deliveryTime, setDeliveryTime] = useState('15–20 мин');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cd_address');
      if (stored) {
        setAddress(stored);
      }
      // TODO: Получить реальное время доставки из API
      setDeliveryTime('15–20 мин');
    } catch {
      // ignore
    }
  }, []);

  const handleAddressClick = () => {
    // TODO: Открыть модальное окно выбора адреса
    router.push('/products');
  };

  return (
    <div className="px-4 pb-2.5">
      {/* Карточка доставки: время, заголовок, адрес + самокат (референс) */}
      <button
        type="button"
        onClick={handleAddressClick}
        className="w-full bg-white rounded-[20px] px-4 py-3 flex items-center justify-between shadow-sm active:scale-[0.99] transition-transform border border-gray-100"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-[#8a8a8a] leading-tight mb-0.5">
            {deliveryTime}
          </div>
          <div className="text-[18px] font-extrabold text-[#1a1a1a] leading-tight">
            Доставка до дома
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#404040]">
            <MapPin className="w-3.5 h-3.5 text-[#e11d48] flex-shrink-0" />
            <span className="truncate">{address}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        <div className="ml-3 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffedf2] to-[#ffe9d6] flex items-center justify-center shadow-sm">
            <span className="text-2xl" aria-hidden="true">
              🛵
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
