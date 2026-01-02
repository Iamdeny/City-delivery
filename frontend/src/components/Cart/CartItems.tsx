import React from 'react';
import { CartItem } from '../../types/cart';
import './CartItems.css';

interface CartItemsProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  totalAmount: number;
  totalItems: number;
}

const CartItems: React.FC<CartItemsProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  totalAmount,
  totalItems,
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className='cart-items-container'>
      <div className='cart-items'>
        {items.map((item) => (
          <div key={item.id} className='cart-item fade-in'>
            <div className='cart-item-image'>{item.image || '📦'}</div>
            <div className='cart-item-details'>
              <h4 className='cart-item-name'>{item.name}</h4>
              <p className='cart-item-category'>{item.category}</p>
              {item.inStock === false && (
                <span className='cart-item-out-of-stock'>🔴 Нет в наличии</span>
              )}
              <div className='cart-item-controls'>
                <button
                  className='quantity-btn'
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  aria-label={`Уменьшить количество ${item.name}`}
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span className='quantity'>{item.quantity} шт</span>
                <button
                  className='quantity-btn'
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  aria-label={`Увеличить количество ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
            <div className='cart-item-right'>
              <div className='cart-item-price'>
                {item.price * item.quantity} ₽
                <div className='cart-item-unit-price'>{item.price} ₽/шт</div>
              </div>
              <button
                className='remove-btn'
                onClick={() => onRemoveItem(item.id)}
                aria-label={`Удалить ${item.name} из корзины`}
              >
                ❌
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className='cart-summary-details'>
        <div className='summary-row'>
          <span>Товары ({totalItems} шт)</span>
          <span>{totalAmount} ₽</span>
        </div>
        <div className='summary-row'>
          <span>Доставка</span>
          <span className='free'>Бесплатно</span>
        </div>
        <div className='summary-total'>
          <span>К оплате:</span>
          <span className='total-amount'>{totalAmount} ₽</span>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
