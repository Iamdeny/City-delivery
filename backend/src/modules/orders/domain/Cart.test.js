// backend/src/modules/orders/domain/Cart.test.js
import { describe, it, expect } from 'vitest';
import Cart from './Cart';
import ProductValueObject from './ProductValueObject';

describe('Cart Domain Entity', () => {
  const product = new ProductValueObject(
    1,
    'Test Product',
    100,
    10,
    0,
    true,
    'img.png',
    1
  );

  it('should add an item to the cart', () => {
    const cart = new Cart(1);
    cart.addItem(product, 2);
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.total).toBe(200);
  });

  it('should throw an error if trying to add more items than available in stock', () => {
    const cart = new Cart(1);
    expect(() => cart.addItem(product, 11)).toThrow('INSUFFICIENT_STOCK');
  });

  it('should validate minimum order amount', () => {
    const cart = new Cart(1);
    cart.addItem(product, 1);
    expect(() => cart.validateMinimumAmount(300)).toThrow('MIN_ORDER_AMOUNT');
  });
});
