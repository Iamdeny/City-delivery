/**
 * Утилиты форматирования
 * Единая точка для изменения формата в будущем
 * Использует Intl.NumberFormat для консистентности
 */

/**
 * Форматирование цены в рубли
 * Использует Intl.NumberFormat для единообразного отображения
 * @param price - цена в рублях
 * @returns отформатированная строка (например, "1 234")
 */
const priceFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

/**
 * Форматирование цены с символом валюты
 * @param price - цена в рублях
 * @returns отформатированная строка с символом (например, "1 234 ₽")
 */
export function formatPriceWithCurrency(price: number): string {
  return `${formatPrice(price)} ₽`;
}

/**
 * Форматирование цены со скидкой
 * @param price - исходная цена
 * @param discount - процент скидки
 * @returns объект с исходной и финальной ценой
 */
export function formatPriceWithDiscount(price: number, discount: number) {
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
  return {
    original: formatPriceWithCurrency(price),
    final: formatPriceWithCurrency(Math.round(finalPrice)),
    hasDiscount: discount > 0,
  };
}
