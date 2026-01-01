import { productsResponseSchema } from '../schemas/product.schema';
import type { Product } from '../types/product';

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
  async fetchProducts(): Promise<Product[]> {
    try {
      console.log('🔄 Загрузка товаров...');
      const response = await fetch('http://localhost:5000/api/products', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Получены данные:', data);

      // Валидация через Zod
      const result = productsResponseSchema.safeParse(data);

      if (result.success) {
        console.log(`✅ Загружено ${result.data.length} товаров`);
        return result.data;
      } else {
        console.warn('⚠️ Валидация не прошла:', result.error);
        return this.adaptData(data);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
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
      }));
    }

    // Если сервер вернул обёрнутую структуру
    if (rawData && typeof rawData === 'object' && 'data' in rawData) {
      const data = (rawData as any).data;
      if (Array.isArray(data)) {
        return this.adaptData(data);
      }
    }

    console.warn('⚠️ Неподдерживаемый формат, используем резервные данные');
    return backupProducts;
  }

  getBackupProducts(): Product[] {
    return backupProducts;
  }
}

export const productService = new ProductService();
