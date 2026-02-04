/**
 * Страница оформления заказа
 * Фаза 7: Миграция страниц
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/app/hooks/useCart';
import { useNotifications } from '@/app/hooks/useNotifications';
import OrderForm from '@/app/components/order/OrderForm';
import Breadcrumbs from '@/app/components/navigation/Breadcrumbs';
import type { OrderResponse } from '@/app/services/orderService';
import { placeOrder } from '@/app/services/orderService';
import { authService } from '@/app/services/authService';

export default function OrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, totalAmount, totalItems, clearCart } = useCart();
  const { showNotification } = useNotifications();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isOpsAccount, setIsOpsAccount] = useState(false);

  useEffect(() => {
    // Guard: Ops roles should not use customer checkout
    let cancelled = false;
    (async () => {
      try {
        const u = await authService.getCurrentUser();
        if (cancelled) return;
        const role = u?.role ?? null;
        if (role && role !== 'customer') {
          setIsOpsAccount(true);
          showNotification('Этот аккаунт предназначен для Ops. Для заказа войдите как клиент (customer).', 'info');
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceOrder = async (orderData: {
    phone: string;
    address: string;
    comment?: string;
    items: Array<{ productId: number; quantity: number }>;
    latitude?: number;
    longitude?: number;
    darkStoreId?: number;
  }): Promise<OrderResponse> => {
    try {
      if (isOpsAccount) {
        throw new Error('Недостаточно прав для оформления заказа (нужна роль customer).');
      }
      const storeIdFromUrl = Number(searchParams?.get('dark_store_id') || 0);
      const storeId =
        Number.isFinite(storeIdFromUrl) && storeIdFromUrl > 0
          ? Math.floor(storeIdFromUrl)
          : Number(localStorage.getItem('cd_dark_store_id') || 0) || 0;

      const response = await placeOrder({
        ...orderData,
        ...(storeId > 0 ? { darkStoreId: storeId } : {}),
      });
      if (!response?.success) {
        return response;
      }
      setOrderPlaced(true);
      clearCart();
      showNotification('Заказ успешно создан!', 'success');
      const orderId = response.orderId ?? response.order?.id;
      if (orderId != null) {
        router.push(`/order/${orderId}`);
      }
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка создания заказа';
      // Let the form show a single error message; avoid throwing to prevent "connection error" fallbacks.
      return { success: false, error: message };
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Заказ оформлен!</h1>
          <p className="text-gray-600 mb-6">
            Ваш заказ успешно создан. Мы свяжемся с вами в ближайшее время.
          </p>
          <a
            href="/products"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Вернуться к покупкам
          </a>
        </div>
      </div>
    );
  }

  if (isOpsAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🛠️</div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Ops‑аккаунт</h1>
          <p className="text-gray-600 mb-6">
            Этот аккаунт предназначен для админ‑панели. Чтобы оформить заказ, войдите под клиентом (роль customer).
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white"
              onClick={() => router.push('/ops/orders')}
            >
              Перейти в Ops
            </button>
            <button
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-extrabold text-gray-900"
              onClick={() => router.push('/login?next=/products')}
            >
              Войти как клиент
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-2xl pb-28 sm:pb-8">
        <div className="hidden lg:block mb-4">
          <Breadcrumbs />
        </div>
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-6">Оформление заказа</h1>
        <OrderForm
          cart={cart}
          onPlaceOrder={handlePlaceOrder}
          onClearCart={clearCart}
          onShowNotification={showNotification}
          totalAmount={totalAmount}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
