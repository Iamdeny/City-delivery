/**
 * Тестовая страница для Фазы 6
 * Проверка CartModal
 */
'use client';

import { useState } from 'react';
import type { CartItem } from '@/types';
import CartModal from '@/app/components/cart/CartModal';
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
  {
    id: 3,
    name: 'Салат Цезарь',
    price: 299,
    category: 'Салаты',
    image: getPlaceholderByCategory('Салаты'),
    inStock: true,
    quantity: 3,
  },
];

export default function TestPhase6Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(mockCart);
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasItems = cart.length > 0;

  const handleUpdateQuantity = (id: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)).filter((item) => item.quantity > 0)
    );
    addNotification(`Количество товара обновлено`, 'info');
  };

  const handleRemoveItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    addNotification('Товар удален из корзины', 'info');
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
    setCart([]);
    addNotification('Корзина очищена', 'info');
  };

  const handleShowNotification = (message: string, type: 'success' | 'error' | 'info') => {
    addNotification(message, type);
  };

  const handleEditItem = (id: number) => {
    addNotification(`Редактирование товара #${id}`, 'info');
    // Здесь можно открыть модальное окно редактирования
  };

  const handleCheckout = () => {
    addNotification('Переход к оформлению заказа', 'info');
    // Здесь можно открыть форму оформления заказа или перейти на страницу checkout
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тест Фазы 6: Модальные окна</h1>

        {/* Кнопка открытия модального окна */}
        <div className="mb-8">
          <button
            onClick={() => setIsOpen(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Открыть CartModal
          </button>
        </div>

        {/* Уведомления */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
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

        {/* Информация о корзине */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Информация о корзине (для тестирования)</h2>
          <p className="text-gray-600 mb-2">
            Товаров в корзине: <strong>{cart.length}</strong>
          </p>
          <p className="text-gray-600 mb-2">
            Общее количество: <strong>{totalItems}</strong>
          </p>
          <p className="text-gray-600">
            Общая сумма: <strong>{totalAmount} ₽</strong>
          </p>
        </div>

        {/* CartModal */}
        <CartModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          cart={cart}
          totalAmount={totalAmount}
          totalItems={totalItems}
          hasItems={hasItems}
          loading={false}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onPlaceOrder={handlePlaceOrder}
          onClearCart={handleClearCart}
          onShowNotification={handleShowNotification}
          onGoToShopping={() => {
            setIsOpen(false);
            addNotification('Переход к покупкам', 'info');
          }}
          onCheckout={handleCheckout}
          onEditItem={handleEditItem}
        />
      </div>
    </div>
  );
}
