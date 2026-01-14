/**
 * Плавающая кнопка корзины для мобильных устройств
 * Показывается внизу экрана с суммой и временем доставки
 */

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '../../shared/lib/format';
import { PriceDisplay } from '../../shared/ui/PriceDisplay';
import { getIconSize } from '../../shared/constants/icon-sizes';
import './FloatingCartButton.css';

interface FloatingCartButtonProps {
  totalAmount: number;
  totalItems: number;
  estimatedTime?: string;
  onClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  totalAmount,
  totalItems,
  estimatedTime = '15 минут',
  onClick,
}) => {
  if (totalItems === 0) {
    return null;
  }

  return (
    <button 
      className='floating-cart-button' 
      onClick={onClick}
      aria-label={`Корзина: ${totalItems} товаров на сумму ${formatPrice(totalAmount)} рублей. Доставка за ${estimatedTime}`}
    >
      <div className='floating-cart-content'>
        <div className='floating-cart-amount'>
          <span className='floating-cart-price'><PriceDisplay price={totalAmount} size="md" /></span>
          <span className='floating-cart-time'>{estimatedTime}</span>
        </div>
        <div className='floating-cart-icon'>
          <ShoppingCart size={getIconSize('lg')} strokeWidth={2.5} />
          {totalItems > 0 && (
            <span className='floating-cart-badge' aria-label={`Товаров в корзине: ${totalItems}`}>
              {totalItems}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default FloatingCartButton;

