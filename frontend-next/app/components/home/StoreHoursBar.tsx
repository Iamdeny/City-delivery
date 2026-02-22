/**
 * Полоса с часами работы в стиле Самоката
 */
'use client';

import { Moon } from 'lucide-react';

export default function StoreHoursBar() {
  return (
    <div className="bg-[#333333] text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2">
      <Moon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Работаем с 08:00 до 23:00</span>
    </div>
  );
}
