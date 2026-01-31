/**
 * Форма оформления заказа
 * Мигрировано из frontend/src/components/Order/OrderForm.tsx
 */
'use client';

import { useEffect, useState } from 'react';
import type { CartItem } from '@/types';
import { logger } from '@/lib/logger';
import { useCartOrderItems } from '@/app/hooks/useCartUtils';
import type { OrderResponse } from '@/app/services/orderService';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';

interface OrderFormProps {
  cart: CartItem[];
  onPlaceOrder: (orderData: {
    phone: string;
    address: string;
    comment?: string;
    items: Array<{ productId: number; quantity: number }>;
    latitude?: number;
    longitude?: number;
    darkStoreId?: number;
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
  // Используем централизованную утилиту для преобразования cart
  const orderItems = useCartOrderItems(cart);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState('+7 (999) 123-45-67');
  const [address, setAddress] = useState('ул. Ленина, д. 1, кв. 5');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showSberSpasibo, setShowSberSpasibo] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [geolocationSupported, setGeolocationSupported] = useState(false);

  // Важно для SSR: на сервере navigator отсутствует, поэтому определяем поддержку
  // геолокации только после mount, чтобы избежать hydration mismatch.
  useEffect(() => {
    setGeolocationSupported(Boolean(navigator?.geolocation));
  }, []);

  // Prefer address/coords chosen via "address → geocode" flow (more stable than browser geo)
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem('cd_address') || '';
      const lat = Number(localStorage.getItem('cd_geo_lat') || '');
      const lng = Number(localStorage.getItem('cd_geo_lng') || '');
      if (savedAddress) setAddress(savedAddress);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setCoordinates({ lat, lng });
      }
    } catch {
      // ignore
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
        setIsGettingLocation(true);
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
          // Dark Store First: coordinates are required to validate delivery radius.
          onShowNotification(`${errorMessage}. Разрешите геолокацию, чтобы оформить заказ.`, 'error');
          return;
        } finally {
          setIsGettingLocation(false);
        }
      } else {
        logger.warn('⚠️ Геолокация не поддерживается браузером');
        setLocationError('Геолокация не поддерживается вашим браузером');
        onShowNotification('Геолокация недоступна. Для оформления заказа нужны координаты доставки.', 'error');
        return;
      }

      if (latitude === undefined || longitude === undefined) {
        onShowNotification('Для оформления заказа нужны координаты доставки (разрешите геолокацию).', 'error');
        return;
      }

      const orderData = {
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim() || undefined,
        items: orderItems,
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
      // This should be rare now (we convert service errors into {success:false}).
      // Keep a useful message for the user instead of "connection error" for business cases.
      const msg = err instanceof Error ? err.message : 'Ошибка оформления заказа';
      logger.error('Ошибка оформления заказа:', err);
      onShowNotification(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-0 animate-[fadeIn_0.3s_ease] w-full box-border flex flex-col min-h-0">
      <div className="flex flex-col gap-0 p-0 mb-0 flex-1 min-h-0">
        <div className="p-2 px-3 border-b border-gray-200 transition-colors bg-white box-border">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[15px] text-gray-900 flex-1">Доставка</span>
            <span className="text-[15px] text-green-600 font-semibold mr-2">0 ₽</span>
          </div>
        </div>

        <div 
          className="p-2 px-3 border-b border-gray-200 transition-colors bg-white box-border cursor-pointer active:bg-gray-100" 
          onClick={() => onShowNotification('Функция промокодов скоро появится!', 'info')}
        >
          <div className="flex justify-between items-center gap-2">
            <span className="text-[15px] text-gray-900 flex-1">Промокод</span>
            <span className="text-xl text-gray-500 font-light flex-shrink-0 leading-none">›</span>
          </div>
        </div>

        {showSberSpasibo && (
          <div className="bg-gray-100 rounded-xl my-1.5 p-2.5 px-3 border-none">
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">S</span>
                  <span className="text-[15px] text-gray-900 flex-1">СберСпасибо</span>
                </div>
                <span className="text-xs text-gray-600 leading-snug mt-1">
                  Войдите по Сбер ID и получайте бонусы при оплате любой картой
                </span>
              </div>
              <button
                className="bg-none border-none w-6 h-6 flex items-center justify-center rounded-full text-gray-500 text-base cursor-pointer transition-all flex-shrink-0 p-0 hover:bg-black/5 hover:text-gray-900"
                onClick={() => setShowSberSpasibo(false)}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div 
          className="p-2 px-3 border-b border-gray-200 transition-colors bg-white box-border cursor-pointer active:bg-gray-100" 
          onClick={() => {
            const newAddress = prompt('Введите адрес доставки:', address);
            if (newAddress) {
              setAddress(newAddress);
              // Сбрасываем координаты при изменении адреса
              setCoordinates(null);
              setLocationError(null);
            }
          }}
        >
          <div className="flex justify-between items-center gap-2">
            <span className="text-[15px] text-gray-900 flex-1">{address}</span>
            <span className="text-xl text-gray-500 font-light flex-shrink-0 leading-none">›</span>
          </div>
        </div>

        {/* Кнопка получения геолокации */}
        {geolocationSupported && (
          <div 
            className="p-2 px-3 border-b border-gray-200 transition-colors bg-white box-border cursor-pointer active:bg-gray-100" 
            onClick={async () => {
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
                const accM = Number(position.coords.accuracy);
                const accLabel = Number.isFinite(accM)
                  ? accM >= 1000
                    ? `${(accM / 1000).toFixed(1)} км`
                    : `${Math.round(accM)} м`
                  : '—';

                // On desktop / without GPS the browser can return IP-based location with huge accuracy (hundreds of km).
                // Treat such readings as "low quality" and warn user instead of showing a success toast.
                if (Number.isFinite(accM) && accM > 5000) {
                  onShowNotification(
                    `📍 Геолокация получена, но точность низкая (≈ ${accLabel}). Включите точную геолокацию (GPS/Wi‑Fi) или выберите склад вручную.`,
                    'info'
                  );
                } else {
                  onShowNotification(`📍 Геолокация получена! Точность: ${accLabel}`, 'success');
                }
              } catch (error: any) {
                const errorMessage = error?.message || 'Не удалось получить геолокацию';
                setLocationError(errorMessage);
                onShowNotification(errorMessage, 'error');
              } finally {
                setIsGettingLocation(false);
              }
            }}
          >
            <div className="flex justify-between items-center gap-2">
              <div className="flex flex-col flex-1">
                <span className="text-[15px] text-gray-900">
                  {isGettingLocation 
                    ? '📍 Получаем геолокацию...' 
                    : coordinates 
                      ? `📍 Геолокация: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                      : '📍 Получить мою геолокацию'
                  }
                </span>
                {locationError && (
                  <span className="text-xs text-red-500">
                    {locationError}
                  </span>
                )}
              </div>
              {!isGettingLocation && <span className="text-xl text-gray-500 font-light flex-shrink-0 leading-none">›</span>}
            </div>
          </div>
        )}

        <div 
          className="p-2 px-3 border-b border-gray-200 transition-colors bg-white box-border cursor-pointer active:bg-gray-100" 
          onClick={() => {
            const method = paymentMethod === 'card' ? 'cash' : 'card';
            setPaymentMethod(method);
            onShowNotification(`Способ оплаты: ${method === 'card' ? 'Карта' : 'Наличные'}`, 'info');
          }}
        >
          <div className="flex justify-between items-center gap-2">
            <span className="text-[15px] text-gray-900 flex-1">Способ оплаты</span>
            <span className="text-[15px] text-gray-900 font-medium mr-2">{paymentMethod === 'card' ? 'Карта' : 'Наличные'}</span>
            <span className="text-xl text-gray-500 font-light flex-shrink-0 leading-none">›</span>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 py-3 px-4 pb-[calc(12px+var(--inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] mt-auto z-[1102] pointer-events-auto flex-shrink-0">
        <div className="flex justify-between items-center mb-2.5 p-0 gap-2">
          <span className="text-base text-gray-900 font-medium">Итого</span>
          <PriceDisplay price={totalAmount} size="lg" className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent" />
        </div>
        <form onSubmit={handleSubmit} className="w-full">
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white border-none rounded-2xl text-base font-bold cursor-pointer transition-all shadow-lg hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden z-[1103] pointer-events-auto touch-manipulation"
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
