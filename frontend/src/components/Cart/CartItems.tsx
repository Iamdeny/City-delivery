import React, { useCallback, useMemo } from 'react';
import type { CartItem } from '../../types/cart';
import './CartItems.css';

interface CartItemsProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  totalAmount: number;
  totalItems: number;
}

function CartItems({
  items,
  onUpdateQuantity,
  onRemoveItem,
  totalAmount,
  totalItems,
}: CartItemsProps) {
  const handleDecrease = useCallback(
    (id: number, currentQuantity: number) => {
      onUpdateQuantity(id, currentQuantity - 1);
    },
    [onUpdateQuantity]
  );

  const handleIncrease = useCallback(
    (id: number, currentQuantity: number) => {
      onUpdateQuantity(id, currentQuantity + 1);
    },
    [onUpdateQuantity]
  );

  const formattedTotal = useMemo(
    () => totalAmount.toLocaleString('ru-RU'),
    [totalAmount]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className='cart-items-container'>
      <div className='cart-items'>
        {items.map((item) => (
          <div key={item.id} className='cart-item-modern fade-in'>
            <div className='cart-item-image-modern'>
              {item.image && item.image.startsWith('http') ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className='cart-item-image-placeholder'>{item.image || '📦'}</div>
              )}
            </div>
            <div className='cart-item-content'>
              <div className='cart-item-header'>
                <h4 className='cart-item-name-modern'>{item.name}</h4>
                <button
                  className='remove-btn-modern'
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Удалить ${item.name} из корзины`}
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z'
                      fill='currentColor'
                    />
                  </svg>
                </button>
              </div>
              {item.category && (
                <p className='cart-item-weight'>{item.category}</p>
              )}
              <div className='cart-item-footer'>
                <div className='quantity-controls-modern'>
                  <button
                    type='button'
                    className='quantity-btn-modern minus'
                    onClick={() => handleDecrease(item.id, item.quantity)}
                    aria-label={`Уменьшить количество ${item.name}`}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span className='quantity-value-modern'>{item.quantity}</span>
                  <button
                    type='button'
                    className='quantity-btn-modern plus'
                    onClick={() => handleIncrease(item.id, item.quantity)}
                    aria-label={`Увеличить количество ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <div className='cart-item-price-modern'>
                  {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(CartItems);
