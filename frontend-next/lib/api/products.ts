/**
 * Server-side API для продуктов
 * Используется в Server Components для SSR и ISR
 */

import { API_CONFIG } from '@/lib/constants';
import type { Product } from '@/types';
import { getPlaceholderByCategory } from '@/lib/placeholders';
import { logger } from '@/lib/logger';
import { withRetry } from './retry';

/**
 * Резервные продукты для случая, когда бэкенд недоступен
 */
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

/**
 * Функция для нормализации изображений продуктов
 */
function normalizeProductImage(product: any, category: string): string | undefined {
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
  return product.image;
}

/**
 * Нормализация массива продуктов
 */
function normalizeProducts(rawProducts: any[]): Product[] {
  return rawProducts.map((product: any) => ({
    ...product,
    image: normalizeProductImage(product, product.category || 'Прочее'),
    // Временно устанавливаем inStock: true для всех товаров
    // В продакшене заменить на: inStock: product.inStock !== undefined ? product.inStock : true,
    inStock: true,
  }));
}

/**
 * Server-side функция для получения продуктов
 * Используется в Server Components
 * 
 * @param options - Опции фильтрации
 * @returns Массив продуктов
 */
export async function getProducts(options?: {
  category?: string;
  search?: string;
  darkStoreId?: number;
}): Promise<Product[]> {
  try {
    // Формируем URL для backend API
    const backendUrl = new URL(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`);
    
    if (options?.category) {
      backendUrl.searchParams.set('category', options.category);
    }
    if (options?.search) {
      backendUrl.searchParams.set('search', options.search);
    }
    if (options?.darkStoreId) {
      backendUrl.searchParams.set('dark_store_id', options.darkStoreId.toString());
    }

    // Server-side fetch с ISR кэшированием и retry механизмом
    // revalidate: 60 - обновление каждые 60 секунд
    const response = await withRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд
        
        try {
          const res = await fetch(backendUrl.toString(), {
            next: { revalidate: 60 }, // ISR: Incremental Static Regeneration
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return res;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      {
        maxRetries: 2, // 2 попытки (всего 3 запроса)
        retryDelay: 500, // 500ms задержка между попытками
      }
    );

    if (!response.ok) {
      // Если это 503 (Service Unavailable), используем резервные данные
      if (response.status === 503) {
        logger.warn('⚠️ Backend недоступен (503), используем резервные данные');
        return getBackupProducts();
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
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
    
    // Если не удалось извлечь продукты, используем резервные данные
    if (rawProducts.length === 0) {
      logger.warn('⚠️ Неожиданный формат ответа, используем резервные данные');
      return getBackupProducts();
    }
    
    // Нормализуем продукты
    return normalizeProducts(rawProducts);
  } catch (error) {
    // Обработка ошибок подключения
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      const errorName = error.name.toLowerCase();
      
      // Если это ошибка подключения или таймаут, используем резервные данные
      if (
        errorName === 'timeouterror' ||
        errorName === 'aborterror' ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound')
      ) {
        logger.warn('⚠️ Backend недоступен, используем резервные данные');
        return getBackupProducts();
      }
    }
    
    // Для других ошибок логируем и выбрасываем
    logger.error('Ошибка загрузки продуктов:', error);
    throw error;
  }
}

/**
 * Получить один продукт по ID
 * 
 * @param id - ID продукта
 * @returns Продукт или null
 */
export async function getProduct(id: number): Promise<Product | null> {
  try {
    const products = await getProducts();
    return products.find(p => p.id === id) || null;
  } catch (error) {
    logger.error('Ошибка загрузки продукта:', error);
    return null;
  }
}

/**
 * Получить категории продуктов
 * 
 * @returns Массив уникальных категорий
 */
export async function getCategories(): Promise<string[]> {
  try {
    const products = await getProducts();
    const categories = Array.from(new Set(products.map(p => p.category)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return categories;
  } catch (error) {
    logger.error('Ошибка загрузки категорий:', error);
    return [];
  }
}
