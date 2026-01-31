/**
 * Поле поиска
 * Согласно ТЗ: прямоугольное поле с закругленными углами, иконка лупы слева
 */
'use client';

import { Search } from 'lucide-react';

interface SearchFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function SearchField({ 
  value = '', 
  onChange, 
  placeholder = 'Search for a product...' 
}: SearchFieldProps) {
  return (
    <div className="px-4 pb-6">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          <Search size={20} strokeWidth={2} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-11 pr-4 bg-gray-100 rounded-xl border-none outline-none text-gray-900 placeholder:text-gray-500 text-base focus:bg-white focus:shadow-md transition-all"
        />
      </div>
    </div>
  );
}
