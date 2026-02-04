/**
 * Утилиты для placeholder изображений
 * Приоритет: локальные картинки из /images/products/, затем SVG data URI
 */

const PRODUCT_IMAGES_BASE = '/images/products';

/** Маппинг категорий на файлы картинок (без расширения) */
const CATEGORY_TO_IMAGE: Record<string, string> = {
  // Фрукты
  фрукты: 'fruits',
  fruits: 'fruits',
  бананы: 'fruits',
  яблоки: 'fruits',
  // Молочные продукты
  'молочные продукты': 'dairy',
  молоко: 'dairy',
  молочные: 'dairy',
  dairy: 'dairy',
  сыр: 'dairy',
  // Хлеб и выпечка
  хлеб: 'bread',
  bread: 'bread',
  выпечка: 'bread',
  бакалея: 'bread',
  // Яйца
  яйца: 'eggs',
  eggs: 'eggs',
  // Бургеры и фастфуд
  бургеры: 'burger',
  бургер: 'burger',
  burger: 'burger',
  // Пицца, салат, суши — используем default (можно добавить pizza.png позже)
  пицца: 'default',
  pizza: 'default',
  салат: 'default',
  salad: 'default',
  суши: 'default',
  sushi: 'default',
  // Овощи и прочее
  овощи: 'default',
  vegetables: 'default',
  другие: 'default',
  прочее: 'default',
};

/**
 * Создать SVG placeholder с текстом (fallback)
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
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Доступные файлы картинок (без расширения) */
const AVAILABLE_IMAGES = new Set(['fruits', 'dairy', 'bread', 'eggs', 'burger', 'default']);

/**
 * Получить placeholder по категории
 * Возвращает путь к картинке /images/products/{slug}.png
 */
export function getPlaceholderByCategory(category: string): string {
  const categoryLower = (category || '').toLowerCase().trim();
  if (!categoryLower) return `${PRODUCT_IMAGES_BASE}/default.png`;
  // Сначала точное совпадение
  const exact = CATEGORY_TO_IMAGE[categoryLower];
  if (exact && AVAILABLE_IMAGES.has(exact)) {
    return `${PRODUCT_IMAGES_BASE}/${exact}.png`;
  }
  // Затем вхождение ключа (от длинных к коротким)
  const entries = Object.entries(CATEGORY_TO_IMAGE).sort((a, b) => b[0].length - a[0].length);
  for (const [key, slug] of entries) {
    if (categoryLower.includes(key) && AVAILABLE_IMAGES.has(slug)) {
      return `${PRODUCT_IMAGES_BASE}/${slug}.png`;
    }
  }
  return `${PRODUCT_IMAGES_BASE}/default.png`;
}

/** Legacy: для обратной совместимости (SVG плейсхолдеры) */
export const PLACEHOLDERS = {
  pizza: createPlaceholderImage(300, 200, '🍕 Пицца'),
  burger: createPlaceholderImage(300, 200, '🍔 Бургер'),
  salad: createPlaceholderImage(300, 200, '🥗 Салат'),
  sushi: createPlaceholderImage(300, 200, '🍣 Суши'),
  default: createPlaceholderImage(300, 200, '📦 Товар'),
} as const;
