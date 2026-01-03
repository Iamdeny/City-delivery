/**
 * Модальное окно корзины
 */

import React, { useCallback } from 'react';
import CartItems from './CartItems';
import OrderForm from '../Order/OrderForm';
import { CartItem } from '../../types/cart';
import { OrderResponse } from '../../services/orderService';
import { StorageService } from '../../utils/storage';
import { CartSkeleton } from '../Skeleton/CartSkeleton';
import './CartModal.css';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalAmount: number;
  totalItems: number;
  hasItems: boolean;
  loading: boolean;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onPlaceOrder: (orderData: {
    phone: string;
    address: string;
    comment?: string;
    items: Array<{ productId: number; quantity: number }>;
    latitude?: number;
    longitude?: number;
  }) => Promise<OrderResponse>;
  onClearCart: () => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onRestoreCart: () => boolean;
}

const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cart,
  totalAmount,
  totalItems,
  hasItems,
  loading,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onClearCart,
  onShowNotification,
  onRestoreCart,
}) => {
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);


  if (!isOpen) return null;

  return (
    <div className='cart-modal-overlay' onClick={handleOverlayClick}>
      <div className='cart-modal' onClick={(e) => e.stopPropagation()}>
        <div className='cart-modal-header'>
          <div className='cart-modal-title'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='cart-header-icon'
            >
              <path
                d='M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z'
                fill='currentColor'
              />
            </svg>
            <h2>Корзина {hasItems && `(${totalItems})`}</h2>
          </div>
          <div className='cart-modal-actions'>
            {hasItems && (
              <button
                onClick={onClearCart}
                className='clear-cart-btn'
                aria-label='Очистить корзину'
              >
                Очистить
              </button>
            )}
            <button
              onClick={onClose}
              className='close-cart-btn'
              aria-label='Закрыть корзину'
            >
              <svg
                width='20'
                height='20'
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
        </div>

        <div className='cart-modal-content'>
          {!hasItems ? (
            <div className='empty-cart'>
              <div className='empty-cart-content'>
                <div className='empty-cart-icon'>🛒</div>
                <p>Корзина пуста</p>
                <small>Добавьте товары из списка</small>
                {StorageService.getCartCount() > 0 && (
                  <button
                    onClick={() => {
                      if (onRestoreCart()) {
                        onShowNotification('Корзина восстановлена', 'success');
                      }
                    }}
                    className='restore-cart-button'
                  >
                    ♻️ Восстановить сохранённую корзину
                  </button>
                )}
              </div>
            </div>
          ) : loading && cart.length === 0 ? (
            <CartSkeleton />
          ) : (
            <>
              <CartItems
                items={cart}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                totalAmount={totalAmount}
                totalItems={totalItems}
              />

              <OrderForm
                cart={cart}
                onPlaceOrder={onPlaceOrder}
                onClearCart={onClearCart}
                onShowNotification={onShowNotification}
                totalAmount={totalAmount}
                totalItems={totalItems}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;
