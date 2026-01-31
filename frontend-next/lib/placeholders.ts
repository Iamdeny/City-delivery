/**
 * Утилиты для создания placeholder изображений
 * Использует data URI SVG вместо внешних сервисов
 */

/**
 * Создать SVG placeholder с текстом
 * Использует encodeURIComponent для безопасного создания data URI
 */
export function createPlaceholderImage(
  width: number = 300,
  height: number = 200,
  text: string = 'Image'
): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;

  // Используем encodeURIComponent для безопасного создания data URI
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Предустановленные placeholder'ы для категорий
 */
export const PLACEHOLDERS = {
  pizza: createPlaceholderImage(300, 200, '🍕 Пицца'),
  burger: createPlaceholderImage(300, 200, '🍔 Бургер'),
  salad: createPlaceholderImage(300, 200, '🥗 Салат'),
  sushi: createPlaceholderImage(300, 200, '🍣 Суши'),
  default: createPlaceholderImage(300, 200, '📦 Товар'),
} as const;

/**
 * Получить placeholder по категории
 */
export function getPlaceholderByCategory(category: string): string {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('пицца') || categoryLower.includes('pizza')) {
    return PLACEHOLDERS.pizza;
  }
  if (categoryLower.includes('бургер') || categoryLower.includes('burger')) {
    return PLACEHOLDERS.burger;
  }
  if (categoryLower.includes('салат') || categoryLower.includes('salad')) {
    return PLACEHOLDERS.salad;
  }
  if (categoryLower.includes('суши') || categoryLower.includes('sushi')) {
    return PLACEHOLDERS.sushi;
  }
  
  return PLACEHOLDERS.default;
}
