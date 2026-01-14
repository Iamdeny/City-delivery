import React, { useState, useEffect } from 'react';
import './PriceFilter.css';

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
  currentMin: number;
  currentMax: number;
  onPriceChange: (min: number, max: number) => void;
}

export const PriceFilter: React.FC<PriceFilterProps> = ({
  minPrice,
  maxPrice,
  currentMin,
  currentMax,
  onPriceChange,
}) => {
  const [localMin, setLocalMin] = useState(currentMin);
  const [localMax, setLocalMax] = useState(currentMax);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalMin(currentMin);
    setLocalMax(currentMax);
  }, [currentMin, currentMax]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), localMax - 1);
    setLocalMin(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), localMin + 1);
    setLocalMax(value);
  };

  const handleSliderChange = (type: 'min' | 'max', value: number) => {
    if (type === 'min') {
      const newMin = Math.min(value, localMax - 1);
      setLocalMin(newMin);
    } else {
      const newMax = Math.max(value, localMin + 1);
      setLocalMax(newMax);
    }
  };

  const applyChanges = () => {
    onPriceChange(localMin, localMax);
  };

  const resetFilters = () => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
    onPriceChange(minPrice, maxPrice);
  };

  const percentageMin = ((localMin - minPrice) / (maxPrice - minPrice)) * 100;
  const percentageMax = ((localMax - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className='price-filter'>
      <div className='filter-header'>
        <h3 className='filter-title'>Цена, ₽</h3>
        <button
          onClick={resetFilters}
          className='filter-action-btn'
          aria-label='Сбросить фильтр цены'
        >
          Сброс
        </button>
      </div>

      <div className='price-inputs'>
        <div className='price-input-group'>
          <label htmlFor='minPrice' className='price-label'>
            От
          </label>
          <input
            id='minPrice'
            type='number'
            min={minPrice}
            max={localMax - 1}
            value={localMin}
            onChange={handleMinChange}
            onBlur={applyChanges}
            className='price-input'
            aria-label='Минимальная цена'
          />
        </div>

        <div className='price-input-group'>
          <label htmlFor='maxPrice' className='price-label'>
            До
          </label>
          <input
            id='maxPrice'
            type='number'
            min={localMin + 1}
            max={maxPrice}
            value={localMax}
            onChange={handleMaxChange}
            onBlur={applyChanges}
            className='price-input'
            aria-label='Максимальная цена'
          />
        </div>
      </div>

      <div className='price-slider-container'>
        <div className='price-slider-track'>
          <div
            className='price-slider-range'
            style={{
              '--slider-left': `${percentageMin}%`,
              '--slider-right': `${100 - percentageMax}%`,
            } as React.CSSProperties}
          />

          <input
            type='range'
            min={minPrice}
            max={maxPrice}
            value={localMin}
            onChange={(e) => handleSliderChange('min', Number(e.target.value))}
            onMouseUp={applyChanges}
            onTouchEnd={applyChanges}
            className='price-slider price-slider--min'
            aria-label='Регулировка минимальной цены'
          />

          <input
            type='range'
            min={minPrice}
            max={maxPrice}
            value={localMax}
            onChange={(e) => handleSliderChange('max', Number(e.target.value))}
            onMouseUp={applyChanges}
            onTouchEnd={applyChanges}
            className='price-slider price-slider--max'
            aria-label='Регулировка максимальной цены'
          />
        </div>

        <div className='price-limits'>
          <span>{minPrice} ₽</span>
          <span>{maxPrice} ₽</span>
        </div>
      </div>

      <div className='current-price-range'>
        Выбрано: {localMin} ₽ – {localMax} ₽
      </div>
    </div>
  );
};
