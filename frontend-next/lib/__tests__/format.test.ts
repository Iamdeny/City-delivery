/**
 * Тесты для утилит форматирования
 */
import { describe, it, expect } from 'vitest';
import { formatPriceWithCurrency, formatPriceWithDiscount } from '../format';

describe('formatPriceWithCurrency', () => {
  it('форматирует цену с валютой', () => {
    expect(formatPriceWithCurrency(100)).toBe('100 ₽');
    // Intl.NumberFormat использует неразрывный пробел (U+00A0), заменяем на обычный для теста
    expect(formatPriceWithCurrency(1000).replace(/\u00A0/g, ' ')).toBe('1 000 ₽');
    expect(formatPriceWithCurrency(12345).replace(/\u00A0/g, ' ')).toBe('12 345 ₽');
  });

  it('обрабатывает нулевую цену', () => {
    expect(formatPriceWithCurrency(0)).toBe('0 ₽');
  });

  it('обрабатывает дробные значения (округляет)', () => {
    expect(formatPriceWithCurrency(99.99)).toBe('100 ₽');
    expect(formatPriceWithCurrency(100.5)).toBe('101 ₽');
  });
});

describe('formatPriceWithDiscount', () => {
  it('форматирует цену без скидки', () => {
    const result = formatPriceWithDiscount(100, 0);
    expect(result.hasDiscount).toBe(false);
    expect(result.final).toBe('100 ₽');
    expect(result.original).toBe('100 ₽');
  });

  it('форматирует цену со скидкой', () => {
    const result = formatPriceWithDiscount(100, 10);
    expect(result.hasDiscount).toBe(true);
    expect(result.original).toBe('100 ₽');
    expect(result.final).toBe('90 ₽');
  });

  it('обрабатывает скидку 50%', () => {
    const result = formatPriceWithDiscount(200, 50);
    expect(result.hasDiscount).toBe(true);
    expect(result.original).toBe('200 ₽');
    expect(result.final).toBe('100 ₽');
  });

  it('игнорирует невалидную скидку (>100%)', () => {
    const result = formatPriceWithDiscount(100, 150);
    // Проверяем, что скидка > 100% игнорируется
    expect(result.hasDiscount).toBe(false);
    expect(result.final).toBe('100 ₽');
    expect(result.original).toBe('100 ₽');
  });

  it('игнорирует отрицательную скидку', () => {
    const result = formatPriceWithDiscount(100, -10);
    expect(result.hasDiscount).toBe(false);
    expect(result.final).toBe('100 ₽');
  });
});
