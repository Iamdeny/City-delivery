/**
 * Тесты для хука useCart
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CartProvider } from '@/app/contexts/CartContext';
import { useCart } from '../useCart';
import type { Product } from '@/types';

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Обертка для renderHook с CartProvider
const renderHookWithProvider = (hook: () => ReturnType<typeof useCart>) => {
  return renderHook(hook, {
    wrapper: ({ children }: { children: React.ReactNode }) => 
      React.createElement(CartProvider, null, children),
  });
};

describe('useCart', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('инициализируется пустой корзиной', () => {
    const { result } = renderHookWithProvider(() => useCart());
    
    expect(result.current.cart).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalAmount).toBe(0);
    expect(result.current.hasItems).toBe(false);
  });

  it('добавляет товар в корзину', () => {
    const { result } = renderHookWithProvider(() => useCart());
    const product: Product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      category: 'Test',
      inStock: true,
    };

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].id).toBe(1);
    expect(result.current.cart[0].quantity).toBe(1);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalAmount).toBe(100);
  });

  it('увеличивает количество при добавлении существующего товара', () => {
    const { result } = renderHookWithProvider(() => useCart());
    const product: Product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      category: 'Test',
      inStock: true,
    };

    act(() => {
      result.current.addToCart(product);
      result.current.addToCart(product);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalAmount).toBe(200);
  });

  it('удаляет товар из корзины', () => {
    const { result } = renderHookWithProvider(() => useCart());
    const product: Product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      category: 'Test',
      inStock: true,
    };

    act(() => {
      result.current.addToCart(product);
      result.current.removeFromCart(1);
    });

    expect(result.current.cart).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });

  it('обновляет количество товара', () => {
    const { result } = renderHookWithProvider(() => useCart());
    const product: Product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      category: 'Test',
      inStock: true,
    };

    act(() => {
      result.current.addToCart(product);
      result.current.updateQuantity(1, 5);
    });

    expect(result.current.cart[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
    expect(result.current.totalAmount).toBe(500);
  });

  it('очищает корзину', () => {
    const { result } = renderHookWithProvider(() => useCart());
    const product: Product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      category: 'Test',
      inStock: true,
    };

    act(() => {
      result.current.addToCart(product);
      result.current.clearCart();
    });

    expect(result.current.cart).toHaveLength(0);
    expect(result.current.hasItems).toBe(false);
  });
});
