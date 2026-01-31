/**
 * Тестовая страница для Фазы 5
 * Проверка LoginForm и OrderForm
 */
'use client';

import { useState } from 'react';
import type { CartItem } from '@/types';
import LoginForm from '@/app/components/auth/LoginForm';
import OrderForm from '@/app/components/order/OrderForm';
import { getPlaceholderByCategory } from '@/lib/placeholders';
import type { OrderResponse } from '@/app/services/orderService';

// Моковые данные для тестирования
const mockCart: CartItem[] = [
  {
    id: 1,
    name: 'Пицца Маргарита',
    price: 599,
    category: 'Пицца',
    image: getPlaceholderByCategory('Пицца'),
    inStock: true,
    quantity: 2,
  },
  {
    id: 2,
    name: 'Бургер Классик',
    price: 399,
    category: 'Бургеры',
    image: getPlaceholderByCategory('Бургеры'),
    inStock: true,
    quantity: 1,
  },
];

export default function TestPhase5Page() {
  const [showLogin, setShowLogin] = useState(false);
  const [showOrder, setShowOrder] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    addNotification('Вход выполнен успешно!', 'success');
  };

  const handlePlaceOrder = async (orderData: {
    phone: string;
    address: string;
    comment?: string;
    items: Array<{ productId: number; quantity: number }>;
    latitude?: number;
    longitude?: number;
  }): Promise<OrderResponse> => {
    // Имитация API вызова
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    addNotification('Заказ успешно создан!', 'success');
    
    return {
      success: true,
      orderId: Math.floor(Math.random() * 10000),
    };
  };

  const handleClearCart = () => {
    addNotification('Корзина очищена', 'info');
  };

  const handleShowNotification = (message: string, type: 'success' | 'error' | 'info') => {
    addNotification(message, type);
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  const totalAmount = mockCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = mockCart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тест Фазы 5: Формы</h1>

        {/* Кнопки управления */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-3 bg-[#EE386E] text-white rounded-xl font-semibold hover:bg-[#DB2777] transition-colors"
          >
            Открыть LoginForm
          </button>
          <button
            onClick={() => setShowOrder(!showOrder)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            {showOrder ? 'Скрыть' : 'Показать'} OrderForm
          </button>
        </div>

        {/* Уведомления */}
        <div className="fixed top-[calc(16px+var(--safe-top))] right-4 z-50 flex flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-white ${
                notification.type === 'success'
                  ? 'bg-green-500'
                  : notification.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>

        {/* Тест LoginForm */}
        {showLogin && (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onClose={() => setShowLogin(false)}
            initialMode="login"
          />
        )}

        {/* Тест OrderForm */}
        {showOrder && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">OrderForm</h2>
            <div className="max-w-md">
              <OrderForm
                cart={mockCart}
                onPlaceOrder={handlePlaceOrder}
                onClearCart={handleClearCart}
                onShowNotification={handleShowNotification}
                totalAmount={totalAmount}
                totalItems={totalItems}
              />
            </div>
          </div>
        )}

        {/* Информация о корзине */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Информация о корзине (для тестирования)</h2>
          <p className="text-gray-600 mb-2">
            Товаров в корзине: <strong>{mockCart.length}</strong>
          </p>
          <p className="text-gray-600 mb-2">
            Общее количество: <strong>{totalItems}</strong>
          </p>
          <p className="text-gray-600">
            Общая сумма: <strong>{totalAmount} ₽</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
