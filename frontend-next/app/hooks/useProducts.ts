/**
 * Хук для загрузки продуктов
 * Мигрировано из frontend/src/hooks/useProducts.ts
 */
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Product } from '@/types';
import { logger } from '@/lib/logger';
import { getPlaceholderByCategory } from '@/lib/placeholders';

// Резервные продукты для случая, когда бэкенд недоступен
const getBackupProducts = (): Product[] => [
  {
    id: 1,
    name: 'Молоко 3.2%',
    price: 89,
    category: 'Молочные продукты',
    image: getPlaceholderByCategory('Молочные продукты'),
    inStock: true,
  },
  {
    id: 2,
    name: 'Хлеб Бородинский',
    price: 45,
    category: 'Хлеб',
    image: getPlaceholderByCategory('Хлеб'),
    inStock: true,
  },
  {
    id: 3,
    name: 'Яйца 10 шт',
    price: 120,
    category: 'Яйца',
    image: getPlaceholderByCategory('Яйца'),
    inStock: true,
  },
  {
    id: 4,
    name: 'Пицца Маргарита',
    price: 450,
    category: 'Пицца',
    image: getPlaceholderByCategory('Пицца'),
    inStock: true,
  },
  {
    id: 5,
    name: 'Бургер Классический',
    price: 320,
    category: 'Бургеры',
    image: getPlaceholderByCategory('Бургеры'),
    inStock: true,
  },
];

// Функция для нормализации изображений продуктов
const normalizeProductImage = (product: any, category: string): string | undefined => {
  if (!product.image) return undefined;
  
  // Если image - это эмодзи или невалидный URL, возвращаем undefined
  // чтобы использовался placeholder по категории
  if (product.image.startsWith('http') || product.image.startsWith('data:') || product.image.startsWith('/')) {
    return product.image;
  }
  
  // Проверяем, является ли это эмодзи (короткая строка без пробелов)
  if (product.image.length <= 4 && !product.image.includes(' ') && !product.image.includes('/')) {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    if (emojiRegex.test(product.image)) {
      return undefined; // Эмодзи - используем placeholder
    }
  }
  
  // Если это не URL и не эмодзи, но и не пустая строка - возвращаем как есть
  // (может быть относительный путь или что-то еще)
  return product.image;
};

// Используем API Route вместо прямого запроса к backend
const fetchProducts = async (options?: { signal?: AbortSignal }): Promise<Product[]> => {
  // Создаем AbortController для таймаута + поддерживаем внешний abort
  const controller = new AbortController();
  if (options?.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд
  
  try {
    const response = await fetch('/api/products', {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Пытаемся получить детали ошибки из ответа
      let errorData: { error?: string; code?: string } = {};
      try {
        errorData = await response.json();
      } catch {
        // Если не удалось распарсить JSON, используем статус
      }
      
      // Если это 503 с кодом BACKEND_UNAVAILABLE, выбрасываем понятную ошибку
      if (response.status === 503 && errorData.code === 'BACKEND_UNAVAILABLE') {
        throw new Error('Backend недоступен');
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Обработка разных форматов ответа
    let rawProducts: any[] = [];
    
    // Формат 1: { success: true, products: [...] }
    if (data.success && Array.isArray(data.products)) {
      rawProducts = data.products;
    }
    // Формат 2: { products: [...] } (без success)
    else if (Array.isArray(data.products)) {
      rawProducts = data.products;
    }
    // Формат 3: Прямой массив [...]
    else if (Array.isArray(data)) {
      rawProducts = data;
    }
    
    // Если не удалось извлечь продукты, логируем и выбрасываем ошибку
    if (rawProducts.length === 0) {
      logger.warn('⚠️ Неожиданный формат ответа:', {
        hasSuccess: 'success' in data,
        hasProducts: 'products' in data,
        isArray: Array.isArray(data),
        dataKeys: Object.keys(data),
        dataType: typeof data,
      });
      
      throw new Error('Неожиданный формат ответа');
    }
    
    // Нормализуем изображения и устанавливаем inStock по умолчанию
    const normalizedProducts = rawProducts.map((product: any) => ({
      ...product,
      image: normalizeProductImage(product, product.category || 'Прочее'),
      inStock: product.inStock !== undefined ? Boolean(product.inStock) : true,
    }));
    
    return normalizedProducts;
  } catch (error) {
    clearTimeout(timeoutId);
    // Проверяем тип ошибки
    if (error instanceof Error) {
      // Если это ошибка подключения или таймаут, используем резервные данные
      if (
        error.name === 'TypeError' ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('network') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.name === 'TimeoutError' ||
        error.name === 'AbortError' ||
        error.message.includes('503') ||
        error.message.includes('Backend недоступен')
      ) {
        logger.warn('⚠️ Бэкенд недоступен, используем резервные данные');
        return getBackupProducts();
      }
      
      // Если это ошибка формата ответа, также используем резервные данные
      if (error.message.includes('Неожиданный формат ответа')) {
        logger.warn('⚠️ Неожиданный формат ответа от backend, используем резервные данные');
        return getBackupProducts();
      }
    }
    
    // Логируем только неожиданные ошибки
    logger.error('Ошибка загрузки продуктов:', error);
    throw error;
  }
};

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

    // Откладываем загрузку продуктов, чтобы не блокировать LCP
    const loadProducts = async () => {
      // Используем requestIdleCallback для неблокирующей загрузки
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          if (cancelled) return;
          startLoading();
        }, { timeout: 200 });
      } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(() => {
          if (cancelled) return;
          startLoading();
        }, 50);
      }
    };

    const startLoading = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchProducts({ signal: abortController.signal });
        
        if (!cancelled && !abortController.signal.aborted) {
          setProducts(data);
          setLoading(false);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        if (!cancelled && !abortController.signal.aborted) {
          const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
          
          // Если это ошибка подключения, используем резервные данные
          if (
            err instanceof Error &&
            (err.message.includes('Failed to fetch') ||
             err.message.includes('network') ||
             err.message.includes('ERR_CONNECTION_REFUSED') ||
             err.name === 'TimeoutError')
          ) {
            logger.warn('⚠️ Бэкенд недоступен, используем резервные данные');
            setProducts(getBackupProducts());
            setError('Бэкенд недоступен. Показаны демо-данные.');
          } else {
            setError(message);
            // Пробуем использовать резервные данные даже при других ошибках
            setProducts(getBackupProducts());
          }
          
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
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts({ signal: abortController.signal });
      
      if (isMountedRef.current && !abortController.signal.aborted) {
        setProducts(data);
        setLoading(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (isMountedRef.current && !abortController.signal.aborted) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        
        // Если это ошибка подключения или 503, используем резервные данные
        if (
          err instanceof Error &&
          (err.message.includes('Failed to fetch') ||
           err.message.includes('network') ||
           err.message.includes('ERR_CONNECTION_REFUSED') ||
           err.message.includes('503') ||
           err.message.includes('Backend недоступен') ||
           err.name === 'TimeoutError')
        ) {
          logger.warn('⚠️ Бэкенд недоступен, используем резервные данные');
          setProducts(getBackupProducts());
          setError('Бэкенд недоступен. Показаны демо-данные.');
        } else {
          // Для других ошибок тоже используем резервные данные, но логируем как ошибку
          logger.error('Ошибка загрузки продуктов:', err);
          setError(message);
          setProducts(getBackupProducts());
        }
        
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
