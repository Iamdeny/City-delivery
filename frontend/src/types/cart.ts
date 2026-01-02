export interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  inStock?: boolean;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}
