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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

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
    setLocationError(null);

    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      // Используем сохраненные координаты, если они есть
      if (coordinates) {
        latitude = coordinates.lat;
        longitude = coordinates.lng;
        logger.log('📍 Используем сохраненные координаты:', { latitude, longitude });
      } else if (navigator.geolocation) {
        setIsGettingLocation(true);
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            // Увеличиваем таймаут и улучшаем опции
            navigator.geolocation.getCurrentPosition(
              resolve,
              (error) => {
                // Обрабатываем разные типы ошибок
                let errorMessage = 'Не удалось получить геолокацию';
                
                switch (error.code) {
                  case error.PERMISSION_DENIED:
                    errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
                    break;
                  case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Геолокация недоступна. Проверьте настройки устройства.';
                    break;
                  case error.TIMEOUT:
                    errorMessage = 'Превышено время ожидания геолокации. Попробуйте еще раз.';
                    break;
                  default:
                    errorMessage = `Ошибка геолокации: ${error.message || 'Неизвестная ошибка'}`;
                }
                
                reject(new Error(errorMessage));
              },
              {
                timeout: 15000, // Увеличиваем до 15 секунд
                maximumAge: 300000, // 5 минут - используем кэш
                enableHighAccuracy: true, // Высокая точность
              }
            );
          });
          
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          
          // Сохраняем координаты для повторного использования
          setCoordinates({ lat: latitude, lng: longitude });
          
          logger.log('📍 Геолокация получена:', { 
            latitude, 
            longitude,
            accuracy: position.coords.accuracy 
          });
        } catch (geoError: any) {
          const errorMessage = geoError?.message || 'Не удалось получить геолокацию';
          logger.warn('⚠️ Не удалось получить геолокацию:', geoError);
          setLocationError(errorMessage);
          // Не блокируем оформление заказа, просто показываем предупреждение
          onShowNotification(
            `${errorMessage}. Заказ будет оформлен без точных координат.`,
            'info'
          );
        } finally {
          setIsGettingLocation(false);
        }
      } else {
        logger.warn('⚠️ Геолокация не поддерживается браузером');
        setLocationError('Геолокация не поддерживается вашим браузером');
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
          if (newAddress) {
            setAddress(newAddress);
            // Сбрасываем координаты при изменении адреса
            setCoordinates(null);
            setLocationError(null);
          }
        }}>
          <div className='order-section-content'>
            <span className='order-section-label'>{address}</span>
            <span className='order-section-arrow'>›</span>
          </div>
        </div>

        {/* Кнопка получения геолокации */}
        {navigator.geolocation && (
          <div className='order-section clickable' onClick={async () => {
            setIsGettingLocation(true);
            setLocationError(null);
            
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  (error) => {
                    let errorMessage = 'Не удалось получить геолокацию';
                    
                    switch (error.code) {
                      case error.PERMISSION_DENIED:
                        errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
                        break;
                      case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Геолокация недоступна. Проверьте настройки устройства.';
                        break;
                      case error.TIMEOUT:
                        errorMessage = 'Превышено время ожидания. Попробуйте еще раз.';
                        break;
                      default:
                        errorMessage = `Ошибка: ${error.message || 'Неизвестная ошибка'}`;
                    }
                    
                    reject(new Error(errorMessage));
                  },
                  {
                    timeout: 15000,
                    maximumAge: 0, // Всегда получаем свежие данные
                    enableHighAccuracy: true,
                  }
                );
              });
              
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              
              setCoordinates({ lat, lng });
              onShowNotification(
                `📍 Геолокация получена! Точность: ${Math.round(position.coords.accuracy)}м`,
                'success'
              );
            } catch (error: any) {
              const errorMessage = error?.message || 'Не удалось получить геолокацию';
              setLocationError(errorMessage);
              onShowNotification(errorMessage, 'error');
            } finally {
              setIsGettingLocation(false);
            }
          }}>
            <div className='order-section-content'>
              <span className='order-section-label'>
                {isGettingLocation 
                  ? '📍 Получаем геолокацию...' 
                  : coordinates 
                    ? `📍 Геолокация: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                    : '📍 Получить мою геолокацию'
                }
              </span>
              {locationError && (
                <span className='order-section-error' style={{ fontSize: '12px', color: '#ff4444' }}>
                  {locationError}
                </span>
              )}
              {!isGettingLocation && <span className='order-section-arrow'>›</span>}
            </div>
          </div>
        )}

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
            disabled={isSubmitting || cart.length === 0 || isGettingLocation}
          >
            {isGettingLocation 
              ? '📍 Получаем геолокацию...' 
              : isSubmitting 
                ? 'Оформляем...' 
                : 'Продолжить'
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
