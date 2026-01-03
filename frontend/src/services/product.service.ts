import { productsResponseSchema } from '../schemas/product.schema';
import type { Product } from '../types/product';
import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/constants';

const backupProducts: Product[] = [
  {
    id: 1,
    name: 'Молоко 3.2%',
    price: 89,
    category: 'Молочные продукты',
    image: '🥛',
  },
  { id: 2, name: 'Хлеб Бородинский', price: 45, category: 'Хлеб', image: '🍞' },
  { id: 3, name: 'Яйца 10 шт', price: 120, category: 'Яйца', image: '🥚' },
];

export class ProductService {
  async fetchProducts(
    options: { retryCount?: number; signal?: AbortSignal } = {}
  ): Promise<Product[]> {
    const { retryCount = 0, signal } = options;
    
    try {
      logger.log('🔄 Загрузка товаров...');
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal,
      });

      if (!response.ok) {
        // Обработка ошибки 429 (Too Many Requests)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.min(1000 * Math.pow(2, retryCount), 10000);
          
          if (retryCount < 3 && !signal?.aborted) {
            logger.warn(`⚠️ Слишком много запросов. Повтор через ${waitTime / 1000} сек...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.fetchProducts({ retryCount: retryCount + 1, signal });
          }
          
          throw new Error('Слишком много запросов. Пожалуйста, подождите немного и попробуйте снова.');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.log('📦 Получены данные:', data);

      // Новый API возвращает { success: true, products: [...] }
      let rawProducts: unknown[] = [];
      
      if (data.success && Array.isArray(data.products)) {
        rawProducts = data.products;
      } else if (Array.isArray(data)) {
        // Fallback для старого формата
        rawProducts = data;
      } else {
        logger.warn('⚠️ Неожиданный формат ответа, пытаемся адаптировать');
        return this.adaptData(data);
      }

      // Нормализуем данные: конвертируем snake_case в camelCase
      const normalizedProducts = rawProducts.map((item: unknown) => {
        const product = item as {
          id: unknown;
          name: unknown;
          price: unknown;
          category: unknown;
          image?: unknown;
          in_stock?: unknown;
          inStock?: unknown;
          description?: unknown;
        };
        
        return {
          id: Number(product.id),
          name: String(product.name),
          price: Number(product.price),
          category: String(product.category),
          image: String(product.image || '📦'),
          inStock: Boolean(product.in_stock ?? product.inStock ?? true),
          description: product.description ? String(product.description) : undefined,
        };
      });

      // Валидация через Zod (опционально)
      const result = productsResponseSchema.safeParse(normalizedProducts);

      if (result.success) {
        logger.log(`✅ Загружено ${result.data.length} товаров`);
        return result.data;
      } else {
        logger.warn('⚠️ Валидация не прошла, используем нормализованные данные:', result.error);
        return normalizedProducts;
      }
    } catch (error) {
      // Игнорируем AbortError - это нормальная отмена запроса при размонтировании компонента
      if (error instanceof Error && error.name === 'AbortError') {
        // Не логируем AbortError - это ожидаемое поведение
        throw error;
      }
      
      logger.error('❌ Ошибка загрузки:', error);
      throw error;
    }
  }

  private adaptData(rawData: unknown): Product[] {
    if (Array.isArray(rawData)) {
      return rawData.map((item: unknown, index) => {
        const product = item as {
          id?: unknown;
          name?: unknown;
          price?: unknown;
          category?: unknown;
          image?: unknown;
          in_stock?: unknown;
          inStock?: unknown;
          description?: unknown;
        };
        
        return {
          id: Number(product?.id || index + 1),
          name: String(product?.name || `Товар ${index + 1}`),
          price: Number(product?.price || 0),
          category: String(product?.category || 'Другое'),
          image: String(product?.image || '📦'),
          inStock: Boolean(product?.in_stock ?? product?.inStock ?? true),
          description: product?.description ? String(product.description) : undefined,
        };
      });
    }

    // Если сервер вернул обёрнутую структуру
    if (rawData && typeof rawData === 'object' && 'data' in rawData) {
      const wrappedData = rawData as { data: unknown };
      if (Array.isArray(wrappedData.data)) {
        return this.adaptData(wrappedData.data);
      }
    }

    logger.warn('⚠️ Неподдерживаемый формат, используем резервные данные');
    return backupProducts;
  }

  getBackupProducts(): Product[] {
    return backupProducts;
  }
}

export const productService = new ProductService();
