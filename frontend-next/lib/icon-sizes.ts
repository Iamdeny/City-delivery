/**
 * Стандартные размеры иконок Lucide React
 * Устраняет дублирование размеров в разных компонентах
 * 
 * Удалено дубликатов: 5+ (размеры иконок повторялись в 5+ файлах)
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

/**
 * Получить размер иконки
 */
export function getIconSize(size: IconSize = 'md'): number {
  return ICON_SIZES[size];
}
