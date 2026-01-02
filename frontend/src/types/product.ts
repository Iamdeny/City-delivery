export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description?: string;
  inStock?: boolean;
  rating?: number;
}

// Проверьте, есть ли CartItem в этом файле
export interface CartItem extends Product {
  quantity: number;
}
