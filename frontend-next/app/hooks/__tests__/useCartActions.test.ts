/**
 * Тесты для хука useCartActions
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartActions } from '../useCartActions';
import type { Product } from '@/types';

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  price: 100,
  category: 'Test',
  inStock: true,
};

describe('useCartActions', () => {
  it('вызывает onAddToCart при handleAddToCart', () => {
    const onAddToCart = vi.fn();
    const { result } = renderHook(() =>
      useCartActions({
        onAddToCart,
        product: mockProduct,
        cartQuantity: 0,
      })
    );

    act(() => {
      result.current.handleAddToCart();
    });

    expect(onAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('вызывает onAddToCart при handleIncrement', () => {
    const onAddToCart = vi.fn();
    const { result } = renderHook(() =>
      useCartActions({
        onAddToCart,
        product: mockProduct,
        cartQuantity: 1,
      })
    );

    act(() => {
      result.current.handleIncrement();
    });

    expect(onAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('вызывает onRemoveFromCart при handleDecrement когда quantity > 0', () => {
    const onRemoveFromCart = vi.fn();
    const { result } = renderHook(() =>
      useCartActions({
        onRemoveFromCart,
        product: mockProduct,
        cartQuantity: 2,
      })
    );

    act(() => {
      result.current.handleDecrement();
    });

    expect(onRemoveFromCart).toHaveBeenCalledWith(mockProduct);
  });

  it('не вызывает onRemoveFromCart при handleDecrement когда quantity = 0', () => {
    const onRemoveFromCart = vi.fn();
    const { result } = renderHook(() =>
      useCartActions({
        onRemoveFromCart,
        product: mockProduct,
        cartQuantity: 0,
      })
    );

    act(() => {
      result.current.handleDecrement();
    });

    expect(onRemoveFromCart).not.toHaveBeenCalled();
  });
});
