/**
 * Вертикальный элемент продукта (не карточка)
 * Согласно ТЗ: "Apples" - на всю ширину, название слева, цена справа
 */
'use client';

import { formatPriceWithCurrency } from '@/lib/format';

interface ProductRowProps {
  name: string;
  description: string;
  price: number;
  onClick?: () => void;
}

export function ProductRow({ name, description, price, onClick }: ProductRowProps) {
  return (
    <div 
      className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-bold text-gray-900 m-0 mb-1">
          {name}
        </h4>
        <p className="text-sm text-gray-600 m-0 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <p className="text-lg font-bold text-[#2E7D32] m-0">
          {formatPriceWithCurrency(price)}
        </p>
      </div>
    </div>
  );
}
