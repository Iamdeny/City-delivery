/**
 * Утилиты для работы с изображениями товаров
 * Единая точка для placeholder логики
 */

export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Qn9C+0LvRg9GH0LjRgtGMINC/0LXRgNC10L3QuNC1PC90ZXh0Pjwvc3ZnPg==';

const CATEGORY_COLORS: Record<string, string> = {
  'Молочные продукты': 'F0F8FF',
  Бакалея: 'E5E5E5',
  Колбасы: 'FFF0F5',
  'Кофе/Чай': 'F5F5DC',
  Напитки: 'E0F2F1',
} as const;

/**
 * Создает placeholder URL для категории
 */
export function createCategoryPlaceholder(category: string): string {
  const color = CATEGORY_COLORS[category] ?? 'E5E5E5';
  const text = encodeURIComponent(category.substring(0, 15));
  return `https://via.placeholder.com/400x300/${color}/666666?text=${text}`;
}

/**
 * Получает изображение товара с fallback на placeholder
 */
export function getProductImage(product: { image?: string; category: string }): string {
  return product.image ?? createCategoryPlaceholder(product.category);
}
