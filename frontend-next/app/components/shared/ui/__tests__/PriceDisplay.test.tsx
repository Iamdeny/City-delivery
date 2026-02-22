/**
 * Тесты для компонента PriceDisplay
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceDisplay } from '../PriceDisplay';

describe('PriceDisplay', () => {
  it('отображает цену без скидки', () => {
    render(<PriceDisplay price={100} />);
    expect(screen.getByText(/100 ₽/)).toBeInTheDocument();
  });

  it('отображает цену со скидкой', () => {
    render(<PriceDisplay price={100} discount={10} />);
    expect(screen.getByText(/100 ₽/)).toBeInTheDocument(); // Старая цена
    expect(screen.getByText(/90 ₽/)).toBeInTheDocument(); // Новая цена
  });

  it('скрывает валюту при showCurrency=false', () => {
    render(<PriceDisplay price={100} showCurrency={false} />);
    const element = screen.getByText(/100/);
    expect(element).toBeInTheDocument();
    expect(element.textContent).not.toContain('₽');
  });

  it('применяет размеры', () => {
    const { container } = render(<PriceDisplay price={100} size="lg" />);
    const element = container.querySelector('.text-xl'); // size="lg" соответствует text-xl
    expect(element).toBeInTheDocument();
  });
});
