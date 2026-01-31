'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import CartModal from '@/app/components/cart/CartModal';
import { useCart } from '@/app/hooks/useCart';
import { useNotifications } from '@/app/hooks/useNotifications';
import { placeOrder, type OrderData, type OrderResponse } from '@/app/services/orderService';

export interface CartModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToShoppingHref?: string;
  onCheckoutHref?: string;
}

export default function CartModalContainer({
  isOpen,
  onClose,
  onGoToShoppingHref = '/products',
  onCheckoutHref = '/order',
}: CartModalContainerProps) {
  const router = useRouter();
  const { cart, totalAmount, totalItems, hasItems, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = useCallback(async (orderData: OrderData): Promise<OrderResponse> => {
    try {
      setLoading(true);
      const response = await placeOrder(orderData);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка создания заказа';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGoToShopping = useCallback(() => {
    onClose();
    router.push(onGoToShoppingHref);
  }, [onClose, onGoToShoppingHref, router]);

  const handleCheckout = useCallback(() => {
    onClose();
    router.push(onCheckoutHref);
  }, [onCheckoutHref, onClose, router]);

  return (
    <CartModal
      isOpen={isOpen}
      onClose={onClose}
      cart={cart}
      totalAmount={totalAmount}
      totalItems={totalItems}
      hasItems={hasItems}
      loading={loading}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeFromCart}
      onPlaceOrder={handlePlaceOrder}
      onClearCart={clearCart}
      onShowNotification={showNotification}
      onGoToShopping={handleGoToShopping}
      onCheckout={handleCheckout}
    />
  );
}

