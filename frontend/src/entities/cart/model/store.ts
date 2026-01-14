/**
 * Cart Entity - Zustand Store
 * Глобальное состояние корзины с optimistic updates
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from './schema';
import type { Product } from '../../product/model/types';

interface CartStore {
  // State
  items: CartItem[];
  recentlyRemoved: CartItem[]; // Недавно удаленные товары для EmptyState
  
  // Computed
  totalAmount: number;
  totalItems: number;
  hasItems: boolean;
  
  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  incrementQuantity: (productId: number) => void;
  decrementQuantity: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: number) => number;
  isInCart: (productId: number) => boolean;
}

/**
 * Вычисление итоговой суммы
 */
function calculateTotalAmount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Вычисление общего количества товаров
 */
function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Создание элемента корзины из продукта
 */
function createCartItem(product: Product, quantity: number = 1): CartItem {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    image: product.image || '',
    inStock: product.inStock, // Уже гарантированно boolean после transform
    quantity,
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      recentlyRemoved: [],
      
      // Computed values
      get totalAmount() {
        return calculateTotalAmount(get().items);
      },
      
      get totalItems() {
        return calculateTotalItems(get().items);
      },
      
      get hasItems() {
        return get().items.length > 0;
      },
      
      // Actions
      addItem: (product: Product) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          
          if (existingItem) {
            // Увеличиваем количество (optimistic update)
            const updatedItems = state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
            return { items: updatedItems };
          }
          
          // Добавляем новый товар (optimistic update)
          const newItem = createCartItem(product, 1);
          return { items: [...state.items, newItem] };
        });
      },
      
      removeItem: (productId: number) => {
        set((state) => {
          const removedItem = state.items.find((item) => item.id === productId);
          const updatedItems = state.items.filter((item) => item.id !== productId);
          
          // Сохраняем удаленный товар в recentlyRemoved (максимум 6 товаров)
          const updatedRecentlyRemoved = removedItem
            ? [removedItem, ...state.recentlyRemoved.filter(item => item.id !== productId)].slice(0, 6)
            : state.recentlyRemoved;
          
          return {
            items: updatedItems,
            recentlyRemoved: updatedRecentlyRemoved,
          };
        });
      },
      
      incrementQuantity: (productId: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId && item.quantity < 99
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }));
      },
      
      decrementQuantity: (productId: number) => {
        set((state) => {
          const item = state.items.find((i) => i.id === productId);
          
          if (!item) return state;
          
          if (item.quantity <= 1) {
            // Удаляем товар если количество = 0 и сохраняем в recentlyRemoved
            const updatedItems = state.items.filter((i) => i.id !== productId);
            const updatedRecentlyRemoved = [
              item,
              ...state.recentlyRemoved.filter(i => i.id !== productId)
            ].slice(0, 6);
            
            return {
              items: updatedItems,
              recentlyRemoved: updatedRecentlyRemoved,
            };
          }
          
          // Уменьшаем количество
          return {
            items: state.items.map((i) =>
              i.id === productId
                ? { ...i, quantity: i.quantity - 1 }
                : i
            ),
          };
        });
      },
      
      updateQuantity: (productId: number, quantity: number) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        
        if (quantity > 99) {
          quantity = 99;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => {
        const currentItems = get().items;
        // Сохраняем удаленные товары для EmptyState
        set({ 
          items: [],
          recentlyRemoved: currentItems.length > 0 ? currentItems : get().recentlyRemoved
        });
      },
      
      getItemQuantity: (productId: number) => {
        const item = get().items.find((i) => i.id === productId);
        return item?.quantity ?? 0;
      },
      
      isInCart: (productId: number) => {
        return get().items.some((item) => item.id === productId);
      },
    }),
    {
      name: 'delivery-app-cart-storage',
      version: 2, // Увеличена версия для добавления recentlyRemoved
      partialize: (state) => ({
        items: state.items,
        recentlyRemoved: state.recentlyRemoved, // Сохраняем recentlyRemoved
      }),
    }
  )
);
