import { logger } from './logger';
import { STORAGE_KEYS } from '../config/constants';
import type { CartItem } from '../shared/types';

export class StorageService {
  private static getCartKey(): string {
    return STORAGE_KEYS.CART;
  }

  static getCart(): CartItem[] {
    try {
      const data = localStorage.getItem(this.getCartKey());
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Ошибка чтения корзины из localStorage:', error);
      return [];
    }
  }

  static saveCart(cart: CartItem[]): void {
    try {
      localStorage.setItem(this.getCartKey(), JSON.stringify(cart));
    } catch (error) {
      logger.error('Ошибка сохранения корзины в localStorage:', error);
    }
  }

  static clearCart(): void {
    try {
      localStorage.removeItem(this.getCartKey());
    } catch (error) {
      logger.error('Ошибка очистки корзины в localStorage:', error);
    }
  }

  static getCartCount(): number {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  static isSupported(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
