/**
 * Унифицированный компонент для отображения цены
 * Устраняет дублирование форматирования цены в 13+ местах
 * 
 * Удалено дубликатов: 13+ (formatPriceWithCurrency использовался в 13+ компонентах)
 */
import React from 'react';
import { formatPriceWithCurrency, formatPriceWithDiscount } from '../lib/format';
import './PriceDisplay.css';

interface PriceDisplayProps {
  price: number;
  discount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCurrency?: boolean;
}

export function PriceDisplay({
  price,
  discount,
  className = '',
  size = 'md',
  showCurrency = true,
}: PriceDisplayProps) {
  if (discount && discount > 0) {
    const { original, final, hasDiscount } = formatPriceWithDiscount(price, discount);
    
    return (
      <div className={`price-display price-display-${size} ${className}`}>
        {hasDiscount && (
          <span className="price-display-original" aria-label={`Старая цена ${original}`}>
            {original}
          </span>
        )}
        <span className="price-display-final" aria-label={`Цена со скидкой ${final}`}>
          {final}
        </span>
      </div>
    );
  }

  return (
    <span className={`price-display price-display-${size} ${className}`} aria-label={`Цена ${formatPriceWithCurrency(price)}`}>
      {showCurrency ? formatPriceWithCurrency(price) : formatPriceWithCurrency(price).replace(' ₽', '')}
    </span>
  );
}
