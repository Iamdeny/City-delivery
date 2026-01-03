/**
 * Общие типы для компонентов
 */

import type { Product } from './product';
import type { CartItem } from './cart';
import type { SortOption } from '../hooks/useProductFilters';

/**
 * Типы для обработчиков событий
 */
export type EventHandler<T = void> = (value: T) => void;

/**
 * Типы для состояний загрузки
 */
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

/**
 * Типы для фильтров
 */
export interface FilterState {
  searchQuery: string;
  selectedCategories: string[];
  priceRange: [number, number];
  sortOption: SortOption;
}

/**
 * Типы для статистики фильтров
 */
export interface FilterStats {
  total: number;
  filtered: number;
  hasActiveFilters: boolean;
}

/**
 * Типы для пропсов компонентов продуктов
 */
export interface ProductComponentProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isInCart?: boolean;
}

/**
 * Типы для пропсов компонентов корзины
 */
export interface CartComponentProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  totalAmount: number;
  totalItems: number;
}

