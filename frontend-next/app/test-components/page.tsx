/**
 * Тестовая страница для проверки мигрированных компонентов
 * Client Component - нужен для передачи event handlers в QuantityControls
 */
'use client';

import { useState } from 'react';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';
import { QuantityControls } from '@/app/components/shared/ui/QuantityControls';

export default function TestComponentsPage() {
  // State для QuantityControls
  const [quantity1, setQuantity1] = useState(5);
  const [quantity2, setQuantity2] = useState(3);
  const [quantity3, setQuantity3] = useState(7);
  const [quantity4, setQuantity4] = useState(1);
  const [quantity5, setQuantity5] = useState(99);
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Тест мигрированных компонентов</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">PriceDisplay</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Обычная цена (sm):</p>
            <PriceDisplay price={1234} size="sm" />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Обычная цена (md):</p>
            <PriceDisplay price={5678} size="md" />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Обычная цена (lg):</p>
            <PriceDisplay price={9999} size="lg" />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Цена со скидкой 20%:</p>
            <PriceDisplay price={1000} discount={20} />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Цена со скидкой 50% (lg):</p>
            <PriceDisplay price={2000} discount={50} size="lg" />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Без валюты:</p>
            <PriceDisplay price={1234} showCurrency={false} />
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">QuantityControls</h2>
        
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Default variant (sm):</p>
            <QuantityControls
              quantity={quantity1}
              onIncrement={() => setQuantity1(q => q + 1)}
              onDecrement={() => setQuantity1(q => Math.max(1, q - 1))}
              size="sm"
            />
            <p className="text-xs text-gray-500 mt-1">Текущее значение: {quantity1}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Modern variant (md):</p>
            <QuantityControls
              quantity={quantity2}
              onIncrement={() => setQuantity2(q => q + 1)}
              onDecrement={() => setQuantity2(q => Math.max(1, q - 1))}
              variant="modern"
              size="md"
            />
            <p className="text-xs text-gray-500 mt-1">Текущее значение: {quantity2}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Premium variant (lg):</p>
            <QuantityControls
              quantity={quantity3}
              onIncrement={() => setQuantity3(q => q + 1)}
              onDecrement={() => setQuantity3(q => Math.max(1, q - 1))}
              variant="premium"
              size="lg"
            />
            <p className="text-xs text-gray-500 mt-1">Текущее значение: {quantity3}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Disabled (min reached):</p>
            <QuantityControls
              quantity={quantity4}
              onIncrement={() => setQuantity4(q => q + 1)}
              onDecrement={() => setQuantity4(q => Math.max(1, q - 1))}
              min={1}
            />
            <p className="text-xs text-gray-500 mt-1">Текущее значение: {quantity4}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Disabled (max reached):</p>
            <QuantityControls
              quantity={quantity5}
              onIncrement={() => setQuantity5(q => Math.min(99, q + 1))}
              onDecrement={() => setQuantity5(q => q - 1)}
              max={99}
            />
            <p className="text-xs text-gray-500 mt-1">Текущее значение: {quantity5}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
