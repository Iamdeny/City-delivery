export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  inStock?: boolean;
  description?: string; // Добавьте опциональное поле
}
// Проверьте, есть ли CartItem в этом файле
export interface CartItem extends Product {
  quantity: number;
}
