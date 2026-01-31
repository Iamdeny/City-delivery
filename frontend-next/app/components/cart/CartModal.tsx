/**
 * Модальное окно корзины
 * Мигрировано из frontend/src/components/Cart/CartModal.tsx
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import CartItems from './CartItems';
import { CartFooter } from './CartFooter';
import { CartEmptyState } from './CartEmptyState';
import { CartDeliveryCard, type CartDeliveryStatus } from './CartDeliveryCard';
import { CartSkeleton } from '../skeleton/CartSkeleton';
import type { CartItem } from '@/types';
import type { OrderResponse } from '@/app/services/orderService';

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
  onGoToShopping?: () => void;
  onCheckout?: () => void;
  onEditItem?: (id: number) => void;
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
  onGoToShopping,
  onCheckout,
  onEditItem,
}) => {
  const [deliveryPickerOpen, setDeliveryPickerOpen] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<CartDeliveryStatus>({ ok: null, message: null });
  const [deliveryAddress, setDeliveryAddress] = useState('Выберите адрес');
  const [deliveryTime, setDeliveryTime] = useState('30 минут');
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Блокируем скролл body, пока открыт modal
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Сбрасываем скролл в начало при открытии корзины (как в Самокате)
  useEffect(() => {
    if (!isOpen) return;
    // Используем requestAnimationFrame для гарантии, что DOM обновлен
    requestAnimationFrame(() => {
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    });
  }, [isOpen]);

  const handleCheckoutClick = useCallback(() => {
    // If we know delivery is unavailable (outside any radius) — block and force re-pick.
    if (deliveryStatus.ok === false) {
      setDeliveryPickerOpen(true);
      onShowNotification(String(deliveryStatus.message || 'Доставка недоступна'), 'error');
      return;
    }

    // Dark Store First: require store selection + coordinates before proceeding.
    try {
      const sid = Number(localStorage.getItem('cd_dark_store_id') || 0);
      const lat = Number(localStorage.getItem('cd_geo_lat') || '');
      const lng = Number(localStorage.getItem('cd_geo_lng') || '');

      const hasStore = Number.isFinite(sid) && sid > 0;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      if (!hasStore || !hasCoords) {
        setDeliveryPickerOpen(true);
        onShowNotification('Перед оформлением укажите адрес и выберите склад.', 'info');
        return;
      }
    } catch {
      setDeliveryPickerOpen(true);
      onShowNotification('Перед оформлением укажите адрес и выберите склад.', 'info');
      return;
    }

    if (onCheckout) {
      onCheckout();
      return;
    }
    // Fallback: open order flow
    onShowNotification('Переход к оформлению заказа', 'info');
  }, [deliveryStatus.message, deliveryStatus.ok, onCheckout, onShowNotification]);

  // Получаем адрес и время доставки для заголовка
  useEffect(() => {
    try {
      const addr = localStorage.getItem('cd_address') || 'Выберите адрес';
      setDeliveryAddress(addr);
      // TODO: Получить реальное время доставки из API
      setDeliveryTime('30 минут');
    } catch {
      // ignore
    }
  }, []);

  // Обновляем время доставки при изменении статуса
  useEffect(() => {
    if (deliveryStatus.ok === true) {
      // TODO: Получить реальное время доставки из API
      setDeliveryTime('30 минут');
    }
  }, [deliveryStatus.ok]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#404040] z-[1100] flex items-center justify-end"
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white w-full sm:w-[95%] md:w-[90%] lg:w-[85%] max-w-[500px] h-full flex flex-col overflow-hidden relative z-[1101] rounded-l-[18px]"
            onClick={(e) => e.stopPropagation()}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.x > 120 || info.velocity.x > 900) onClose();
            }}
          >
            {/* Header в стиле Самоката */}
            <div className="px-4 pt-[calc(var(--safe-top)+12px)] pb-3 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Закрыть корзину"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-gray-800 truncate">{deliveryAddress}</div>
                  <div className="text-sm font-medium text-gray-600 mt-0.5">Доставка {deliveryTime}</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div 
              ref={contentScrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-0 -webkit-overflow-scrolling-touch flex flex-col min-h-0"
            >
              {!hasItems ? (
                <CartEmptyState onGoToShopping={onGoToShopping} />
              ) : loading && cart.length === 0 ? (
                <CartSkeleton />
              ) : (
                <>
                  {/* Упрощенная секция доставки (скрыта, так как адрес уже в заголовке) */}
                  <CartDeliveryCard
                    pickerOpen={deliveryPickerOpen}
                    onPickerOpenChange={setDeliveryPickerOpen}
                    onDeliveryStatusChange={setDeliveryStatus}
                    hideWhenOk={true}
                  />
                  <CartItems
                    items={cart}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                    onEditItem={onEditItem}
                    totalAmount={totalAmount}
                    totalItems={totalItems}
                  />
                  
                  {/* Секции промокодов и бонусов в стиле Самоката */}
                  <div className="px-4 py-3 space-y-3 border-t border-gray-100">
                    {/* Скидка или промокод */}
                    <button
                      type="button"
                      className="w-full flex items-start justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-[0.99] transition-all text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium text-gray-800">Скидка или промокод</div>
                        <div className="mt-0.5 text-[13px] font-normal text-gray-500">Нужно будет войти в профиль</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    </button>
                    
                    {/* СберСпасибо (опционально) */}
                    <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-xl flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-extrabold">С</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium text-green-900">СберСпасибо</div>
                          <div className="mt-0.5 text-[13px] font-normal text-green-800">
                            Войдите по Сбер ID, чтобы получать и списывать бонусы
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center active:scale-95 flex-shrink-0 ml-2"
                        aria-label="Закрыть"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer в стиле Самоката */}
            {hasItems && !loading && (
              <CartFooter
                totalAmount={totalAmount}
                onCheckout={handleCheckoutClick}
                disabled={false}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartModal;
