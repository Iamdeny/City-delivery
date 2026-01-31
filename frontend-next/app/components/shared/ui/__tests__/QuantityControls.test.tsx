/**
 * Тесты для компонента QuantityControls
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityControls } from '../QuantityControls';

describe('QuantityControls', () => {
  it('отображает текущее количество', () => {
    render(
      <QuantityControls
        quantity={5}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('вызывает onIncrement при нажатии на кнопку увеличения', async () => {
    const user = userEvent.setup();
    const onIncrement = vi.fn();
    
    render(
      <QuantityControls
        quantity={1}
        onIncrement={onIncrement}
        onDecrement={vi.fn()}
      />
    );

    const incrementButton = screen.getByLabelText('Увеличить количество');
    await user.click(incrementButton);
    
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it('вызывает onDecrement при нажатии на кнопку уменьшения', async () => {
    const user = userEvent.setup();
    const onDecrement = vi.fn();
    
    render(
      <QuantityControls
        quantity={2}
        onIncrement={vi.fn()}
        onDecrement={onDecrement}
      />
    );

    const decrementButton = screen.getByLabelText('Уменьшить количество');
    await user.click(decrementButton);
    
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('блокирует уменьшение при quantity <= min', () => {
    render(
      <QuantityControls
        quantity={1}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        min={1}
      />
    );

    const decrementButton = screen.getByLabelText('Уменьшить количество');
    expect(decrementButton).toBeDisabled();
  });

  it('блокирует увеличение при quantity >= max', () => {
    render(
      <QuantityControls
        quantity={99}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        max={99}
      />
    );

    const incrementButton = screen.getByLabelText('Увеличить количество');
    expect(incrementButton).toBeDisabled();
  });
});
