/**
 * PriceFilter - фильтр по цене
 * Мигрировано из frontend/src/components/Filter/PriceFilter.tsx
 */
'use client';

import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
  currentMin: number;
  currentMax: number;
  onPriceChange: (min: number, max: number) => void;
}

export function PriceFilter({
  minPrice,
  maxPrice,
  currentMin,
  currentMax,
  onPriceChange,
}: PriceFilterProps) {
  const [localMin, setLocalMin] = useState(currentMin);
  const [localMax, setLocalMax] = useState(currentMax);

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
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="m-0 text-base font-bold text-gray-800">Цена, ₽</h3>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
          aria-label="Сбросить фильтр цены"
        >
          <RotateCcw className="w-3 h-3" />
          Сброс
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor="minPrice" className="block text-xs text-gray-600 mb-1">
            От
          </label>
          <input
            id="minPrice"
            type="number"
            min={minPrice}
            max={localMax - 1}
            value={localMin}
            onChange={handleMinChange}
            onBlur={applyChanges}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-colors"
            aria-label="Минимальная цена"
          />
        </div>

        <div>
          <label htmlFor="maxPrice" className="block text-xs text-gray-600 mb-1">
            До
          </label>
          <input
            id="maxPrice"
            type="number"
            min={localMin + 1}
            max={maxPrice}
            value={localMax}
            onChange={handleMaxChange}
            onBlur={applyChanges}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-colors"
            aria-label="Максимальная цена"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="relative h-2 bg-gray-200 rounded-full my-5">
          {/* Активный диапазон */}
          <div
            className="absolute h-full bg-[#ff3363] rounded-full"
            style={{
              left: `${percentageMin}%`,
              width: `${percentageMax - percentageMin}%`,
            }}
          />

          {/* Слайдер для минимальной цены */}
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={localMin}
            onChange={(e) => handleSliderChange('min', Number(e.target.value))}
            onMouseUp={applyChanges}
            onTouchEnd={applyChanges}
            className="absolute top-1/2 left-0 w-full h-0 -translate-y-1/2 appearance-none bg-transparent pointer-events-none z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#ff3363] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#ff3363] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md"
            style={{ zIndex: localMin > localMax - (maxPrice - minPrice) * 0.1 ? 20 : 10 }}
            aria-label="Регулировка минимальной цены"
          />

          {/* Слайдер для максимальной цены */}
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={localMax}
            onChange={(e) => handleSliderChange('max', Number(e.target.value))}
            onMouseUp={applyChanges}
            onTouchEnd={applyChanges}
            className="absolute top-1/2 left-0 w-full h-0 -translate-y-1/2 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md"
            aria-label="Регулировка максимальной цены"
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>{minPrice} ₽</span>
          <span>{maxPrice} ₽</span>
        </div>
      </div>

      <div className="text-sm text-gray-700 font-medium">
        Выбрано: {localMin} ₽ – {localMax} ₽
      </div>
    </div>
  );
}
