/**
 * Унифицированный компонент для отображения цены
 * Устраняет дублирование форматирования цены в 13+ местах
 * 
 * Удалено дубликатов: 13+ (formatPriceWithCurrency использовался в 13+ компонентах)
 * 
 * Server Component - нет интерактивности, только отображение
 */
import { formatPriceWithCurrency, formatPriceWithDiscount } from '@/lib/format';

interface PriceDisplayProps {
  price: number;
  discount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCurrency?: boolean;
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

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
      <div className={`inline-flex items-baseline gap-1 font-bold text-slate-900 ${sizeClasses[size]} ${className}`}>
        {hasDiscount && (
          <span 
            className="text-[0.85em] line-through text-slate-500 opacity-70"
            aria-label={`Старая цена ${original}`}
          >
            {original}
          </span>
        )}
        <span 
          className="text-indigo-600"
          aria-label={`Цена со скидкой ${final}`}
        >
          {final}
        </span>
      </div>
    );
  }

  const formattedPrice = formatPriceWithCurrency(price);
  const displayPrice = showCurrency ? formattedPrice : formattedPrice.replace(' ₽', '');

  return (
    <span 
      className={`inline-flex items-baseline font-bold text-slate-900 ${sizeClasses[size]} ${className}`}
      aria-label={`Цена ${formattedPrice}`}
    >
      {displayPrice}
    </span>
  );
}
