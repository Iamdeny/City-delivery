/**
 * Единая точка экспорта типов
 * Все типы должны импортироваться отсюда для соблюдения DRY принципа
 */
export type {
  Product,
  ProductFilters,
  ProductCategory,
  ProductsResponse,
} from './product';
export type { CartItem, CartState } from './cart';
