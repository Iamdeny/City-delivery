/**
 * Типы для заказов
 */

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'picking'
  | 'ready'
  | 'assigned_to_courier'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: number;
  clientId: number;
  phone: string;
  address: string;
  comment?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  darkStoreId?: number | null;
  pickerId?: number | null;
  courierId?: number | null;
}

export interface DeliveryInfo {
  distance?: string | null;
  estimatedTime?: string;
}

