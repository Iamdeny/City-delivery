// backend/src/modules/orders/domain/Cart.test.js
    2 import { describe, it, expect } from 'vitest';
    3 import Cart from './Cart';
    4 import ProductValueObject from './ProductValueObject';
    5
    6 describe('Cart Domain Entity', () => {
    7   const product = new ProductValueObject(1, 'Test Product', 100, 10, 0, true, 'img.png', 1);
    8
    9   it('should add an item to the cart', () => {
   10     const cart = new Cart(1);
   11     cart.addItem(product, 2);
   12     expect(cart.items.length).toBe(1);
   13     expect(cart.items[0].quantity).toBe(2);
   14     expect(cart.total).toBe(200);
   15   });
   16
   17   it('should throw an error if trying to add more items than available in stock', () => {
   18     const cart = new Cart(1);
   19     // Пытаемся добавить 11, когда в наличии только 10
   20     expect(() => cart.addItem(product, 11)).toThrow('INSUFFICIENT_STOCK');
   21   });
   22
   23   it('should validate minimum order amount', () => {
   24     const cart = new Cart(1);
   25     cart.addItem(product, 1); // total = 100
   26     // Проверяем с минимальной суммой 300
   27     expect(() => cart.validateMinimumAmount(300)).toThrow('MIN_ORDER_AMOUNT');
   28   });
   29 });

  Integration-тесты