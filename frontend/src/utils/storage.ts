export class StorageService {
  private static PREFIX = 'delivery_app_';
  private static CART_KEY = 'cart';

  static getCart(): any[] {
    try {
      const data = localStorage.getItem(`${this.PREFIX}${this.CART_KEY}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Ошибка чтения корзины из localStorage:', error);
      return [];
    }
  }

  static saveCart(cart: any[]): void {
    try {
      localStorage.setItem(
        `${this.PREFIX}${this.CART_KEY}`,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error('Ошибка сохранения корзины в localStorage:', error);
    }
  }

  static clearCart(): void {
    try {
      localStorage.removeItem(`${this.PREFIX}${this.CART_KEY}`);
    } catch (error) {
      console.error('Ошибка очистки корзины в localStorage:', error);
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
