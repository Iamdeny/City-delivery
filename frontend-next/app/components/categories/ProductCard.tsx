/**
 * Карточка продукта для горизонтального блока
 * Согласно ТЗ: квадратная/прямоугольная карточка ~100x120px
 */
'use client';

import Image from 'next/image';
import { formatPriceWithCurrency } from '@/lib/format';

interface ProductCardProps {
  name: string;
  subtitle?: string;
  subtitle2?: string; // Вторая строка описания (для Onions)
  price?: number;
  priceLabel?: string;
  image?: string;
  onClick?: () => void;
}

export function ProductCard({ 
  name, 
  subtitle, 
  subtitle2,
  price, 
  priceLabel,
  image,
  onClick 
}: ProductCardProps) {
  const isDataUri = image?.startsWith('data:') ?? false;
  
  return (
    <div 
      className="flex flex-col items-center justify-center w-[100px] h-[120px] bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
      onClick={onClick}
    >
      {/* Иконка/изображение */}
      <div className="w-12 h-12 mb-2 flex items-center justify-center">
        {isDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
        ) : image ? (
          <Image
            src={image}
            alt={name}
            width={48}
            height={48}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-100 rounded-lg">
            📦
          </div>
        )}
      </div>

      {/* Название */}
      <h4 className="text-base font-bold text-gray-900 m-0 mb-1 text-center">
        {name}
      </h4>

      {/* Подзаголовок или цена за единицу */}
      {subtitle && (
        <p className="text-xs text-gray-600 m-0 text-center leading-tight mb-0.5">
          {subtitle}
        </p>
      )}

      {/* Вторая строка описания (для Onions) */}
      {subtitle2 && (
        <p className="text-xs text-gray-600 m-0 text-center leading-tight mb-1">
          {subtitle2}
        </p>
      )}

      {/* Цена (если есть) */}
      {price !== undefined && (
        <p className="text-lg font-bold text-[#2E7D32] m-0 mt-1">
          {formatPriceWithCurrency(price)}
        </p>
      )}

      {/* Или priceLabel */}
      {priceLabel && !price && (
        <p className="text-lg font-bold text-[#2E7D32] m-0 mt-1">
          {priceLabel}
        </p>
      )}
    </div>
  );
}
