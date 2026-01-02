export interface OrderData {
  phone: string;
  address: string;
  comment?: string;
  items: Array<{ productId: number; quantity: number }>;
}

export interface OrderResponse {
  success: boolean;
  orderNumber?: string;
  error?: string;
}

export const orderService = {
  async placeOrder(orderData: OrderData): Promise<OrderResponse> {
    try {
      console.log('📤 Отправляем заказ на сервер:', orderData);

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  },
};
