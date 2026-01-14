import React, { useState } from 'react';
import type { CartItem } from '../../shared/types';
import { logger } from '../../utils/logger';
import { OrderResponse } from '../../services/orderService';
import { PriceDisplay } from '../../shared/ui/PriceDisplay';
import './OrderForm.css';

interface OrderFormProps {
  cart: CartItem[];
  onPlaceOrder: (orderData: {
    phone: string;
    address: string;
    comment?: string;
    items: Array<{ productId: number; quantity: number }>;
    latitude?: number;
    longitude?: number;
  }) => Promise<OrderResponse>;
  onClearCart: () => void;
  onShowNotification: (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => void;
  totalAmount: number;
  totalItems: number;
}

const OrderForm: React.FC<OrderFormProps> = ({
  cart,
  onPlaceOrder,
  onClearCart,
  onShowNotification,
  totalAmount,
  totalItems,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState('+7 (999) 123-45-67');
  const [address, setAddress] = useState('ул. Ленина, д. 1, кв. 5');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showSberSpasibo, setShowSberSpasibo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      onShowNotification('Корзина пуста!', 'error');
      return;
    }

    if (!phone.trim()) {
      onShowNotification('Телефон обязателен!', 'error');
      return;
    }

    if (!address.trim()) {
      onShowNotification('Адрес обязателен!', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 60000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          logger.log('📍 Геолокация получена:', { latitude, longitude });
        } catch (geoError) {
          logger.warn('⚠️ Не удалось получить геолокацию:', geoError);
        }
      }

      const orderData = {
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        latitude,
        longitude,
      };

      logger.log('📤 Отправляем заказ:', orderData);

      const result = await onPlaceOrder(orderData);

      if (result.success) {
        const orderId = result.orderId || result.order?.id;
        
        onShowNotification(
          orderId 
            ? `Заказ #${orderId} создан! Ожидайте доставку.` 
            : 'Заказ успешно создан!',
          'success'
        );

        if (result.warning) {
          setTimeout(() => {
            const warningMessage = result.deliveryInfo?.distance
              ? `${result.warning} Расстояние до склада: ${result.deliveryInfo.distance} км.`
              : result.warning || 'Доставка может занять больше времени';
            onShowNotification(warningMessage, 'info');
          }, 1500);
        }

        onClearCart();
        setPhone('+7 (999) 123-45-67');
        setAddress('ул. Ленина, д. 1, кв. 5');
        setComment('');
      } else {
        onShowNotification(`Ошибка: ${result.error || 'Неизвестная ошибка'}`, 'error');
      }
    } catch (err) {
      logger.error('Ошибка оформления заказа:', err);
      onShowNotification('Ошибка соединения с сервером', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Всегда показываем расширенную версию (товары уже видны в CartItems)
  // Компактная версия больше не нужна - при открытии корзины сразу показывается полная форма

  // Расширенная версия (полная форма)
  return (
    <div className='order-form-modern'>
      <div className='order-sections'>
        <div className='order-section'>
          <div className='order-section-content'>
            <span className='order-section-label'>Доставка</span>
            <span className='order-section-value free'>0 ₽</span>
          </div>
        </div>

        <div className='order-section clickable' onClick={() => onShowNotification('Функция промокодов скоро появится!', 'info')}>
          <div className='order-section-content'>
            <span className='order-section-label'>Промокод</span>
            <span className='order-section-arrow'>›</span>
          </div>
        </div>

        {showSberSpasibo && (
          <div className='order-section sber-spasibo'>
            <div className='order-section-content'>
              <div className='sber-spasibo-content'>
                <div className='sber-spasibo-header'>
                  <span className='sber-spasibo-icon'>S</span>
                  <span className='order-section-label'>СберСпасибо</span>
                </div>
                <span className='sber-spasibo-description'>
                  Войдите по Сбер ID и получайте бонусы при оплате любой картой
                </span>
              </div>
              <button
                className='sber-spasibo-close'
                onClick={() => setShowSberSpasibo(false)}
                aria-label='Закрыть'
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className='order-section clickable' onClick={() => {
          const newAddress = prompt('Введите адрес доставки:', address);
          if (newAddress) setAddress(newAddress);
        }}>
          <div className='order-section-content'>
            <span className='order-section-label'>{address}</span>
            <span className='order-section-arrow'>›</span>
          </div>
        </div>

        <div className='order-section clickable' onClick={() => {
          const method = paymentMethod === 'card' ? 'cash' : 'card';
          setPaymentMethod(method);
          onShowNotification(`Способ оплаты: ${method === 'card' ? 'Карта' : 'Наличные'}`, 'info');
        }}>
          <div className='order-section-content'>
            <span className='order-section-label'>Способ оплаты</span>
            <span className='order-section-value'>{paymentMethod === 'card' ? 'Карта' : 'Наличные'}</span>
            <span className='order-section-arrow'>›</span>
          </div>
        </div>
      </div>

      <div className='order-footer-modern'>
        <div className='order-total-modern'>
          <span className='order-total-label'>Итого</span>
          <span className='order-total-amount-modern'><PriceDisplay price={totalAmount} size="lg" /></span>
        </div>
        <form onSubmit={handleSubmit} className="order-form-full-width">
          <button
            type='submit'
            className='continue-btn-modern'
            disabled={isSubmitting || cart.length === 0}
          >
            {isSubmitting ? 'Оформляем...' : 'Продолжить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
