import { productsResponseSchema } from '../schemas/product.schema';
import type { Product } from '../shared/types';
import { logger } from '../utils/logger';

// Резервные данные из вашего кода
const backupProducts: Product[] = [
  {
    id: 1,
    name: 'Молоко 3.2%',
    price: 89,
    category: 'Молочные продукты',
    image: '🥛',
    inStock: true,
  },
  { id: 2, name: 'Хлеб Бородинский', price: 45, category: 'Хлеб', image: '🍞', inStock: true },
  { id: 3, name: 'Яйца 10 шт', price: 120, category: 'Яйца', image: '🥚', inStock: true },
];

export class ProductService {
  async fetchProducts(): Promise<Product[]> {
    try {
      logger.log('🔄 Загрузка товаров...');
      const response = await fetch('http://localhost:5000/api/products', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.log('📦 Получены данные:', data);

      // Валидация через Zod
      const result = productsResponseSchema.safeParse(data);

      if (result.success) {
        logger.log(`✅ Загружено ${result.data.length} товаров`);
        return result.data;
      } else {
        logger.warn('⚠️ Валидация не прошла:', result.error);

        // Если валидация не прошла, пробуем адаптировать
        return this.adaptData(data);
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки:', error);
      throw error;
    }
  }

  private adaptData(rawData: unknown): Product[] {
    if (Array.isArray(rawData)) {
      return rawData.map((item, index) => ({
        id: Number(item?.id || index + 1),
        name: String(item?.name || `Товар ${index + 1}`),
        price: Number(item?.price || 0),
        category: String(item?.category || 'Другое'),
        image: String(item?.image || '📦'),
        inStock: Boolean(item?.inStock ?? true),
        description: String(item?.description || ''), // Добавьте
      }));
    }

    // Если не массив, используем резервные данные
    logger.warn('⚠️ Неподдерживаемый формат, используем резервные данные');
    return backupProducts;
  }

  getBackupProducts(): Product[] {
    return backupProducts;
  }
}

export const productService = new ProductService();
