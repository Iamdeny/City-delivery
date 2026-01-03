import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { productService } from '../services/product.service';
import type { Product } from '../types/product';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Используем AbortController для отмены запросов
        const data = await productService.fetchProducts({
          signal: abortController.signal,
        });
        
        // Проверяем только cancelled, isMountedRef проверяем только при размонтировании
        if (!cancelled && !abortController.signal.aborted) {
          setProducts(data);
          setLoading(false);
        }
      } catch (err) {
        // Игнорируем ошибки отмены запроса
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        if (!cancelled && !abortController.signal.aborted) {
          const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
          setError(message);
          setProducts(productService.getBackupProducts());
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      abortController.abort();
    };
  }, []);

  const refetch = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // Отменяем предыдущий запрос, если он еще выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      setLoading(true);
      setError(null);
      const data = await productService.fetchProducts({
        signal: abortController.signal,
      });
      
      if (isMountedRef.current && !abortController.signal.aborted) {
        setProducts(data);
        setLoading(false);
      }
    } catch (err) {
      // Игнорируем ошибки отмены запроса
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (isMountedRef.current && !abortController.signal.aborted) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(message);
        setProducts(productService.getBackupProducts());
        setLoading(false);
      }
    }
  }, []);

  return useMemo(() => ({
    products,
    loading,
    error,
    refetch,
  }), [products, loading, error, refetch]);
}
