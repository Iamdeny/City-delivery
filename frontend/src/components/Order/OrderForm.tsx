import React, { useState } from 'react';
import { CartItem } from '../../types/cart';
import './OrderForm.css';

interface OrderFormProps {
  cart: CartItem[];
  onPlaceOrder: (orderData: {
    phone: string;
    address: string;
    comment?: string;
    items: Array<{ productId: number; quantity: number }>;
  }) => Promise<{ success: boolean; orderNumber?: string; error?: string }>;
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
      const orderData = {
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim(),
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      console.log('📤 Отправляем заказ:', orderData);

      const result = await onPlaceOrder(orderData);

      if (result.success) {
        onShowNotification(`Заказ #${result.orderNumber} создан!`, 'success');
        onClearCart();
        // Сброс формы после успешного заказа
        setPhone('+7 (999) 123-45-67');
        setAddress('ул. Ленина, д. 1, кв. 5');
        setComment('');
      } else {
        onShowNotification(`Ошибка: ${result.error}`, 'error');
      }
    } catch (err) {
      console.error('Ошибка оформления заказа:', err);
      onShowNotification('Ошибка соединения с сервером', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='order-form'>
      <div className='order-form-header'>
        <h3>🚚 Оформление заказа</h3>
        <div className='order-summary'>
          <span>Товаров: {totalItems} шт</span>
          <span className='total-sum'>Сумма: {totalAmount} ₽</span>
        </div>
      </div>

      <div className='form-group'>
        <label htmlFor='phone' className='form-label'>
          📞 Телефон для связи *
        </label>
        <input
          id='phone'
          type='tel'
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder='+7 (999) 123-45-67'
          className='form-input'
          required
        />
      </div>

      <div className='form-group'>
        <label htmlFor='address' className='form-label'>
          🏠 Адрес доставки *
        </label>
        <input
          id='address'
          type='text'
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder='ул. Ленина, д. 1, кв. 5'
          className='form-input'
          required
        />
      </div>

      <div className='form-group'>
        <label htmlFor='comment' className='form-label'>
          💬 Комментарий к заказу (необязательно)
        </label>
        <textarea
          id='comment'
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Например: позвонить за 10 минут до доставки'
          className='form-textarea'
          rows={3}
        />
      </div>

      <div className='order-details'>
        <h4>Состав заказа:</h4>
        <div className='order-items'>
          {cart.map((item) => (
            <div key={item.id} className='order-item'>
              <span className='order-item-name'>{item.name}</span>
              <span className='order-item-quantity'>{item.quantity} шт</span>
              <span className='order-item-price'>
                {item.price * item.quantity} ₽
              </span>
            </div>
          ))}
        </div>
        <div className='order-total'>
          <span>Итого к оплате:</span>
          <span className='order-total-amount'>{totalAmount} ₽</span>
        </div>
      </div>

      <button
        type='submit'
        className='submit-order-btn'
        disabled={isSubmitting || cart.length === 0}
      >
        {isSubmitting ? 'Оформляем заказ...' : '🚚 Подтвердить заказ'}
      </button>

      <p className='delivery-info'>
        ⏱ Доставка за 15-30 минут в пределах города
      </p>

      <div className='order-note'>
        <small>
          * — обязательные для заполнения поля. После оформления заказа с вами
          свяжется оператор для подтверждения.
        </small>
      </div>
    </form>
  );
};

export default OrderForm;
