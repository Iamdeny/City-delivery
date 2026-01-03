/**
 * Компонент для тестирования Error Boundary
 * Добавьте этот код в App.tsx временно для тестирования
 */

import React, { useState } from 'react';

// Компонент, который может генерировать ошибку
const TestComponent = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Тестовая ошибка для Error Boundary');
  }

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>✅ Компонент работает нормально</h3>
      <p>Error Boundary не активирован, так как ошибок нет.</p>
    </div>
  );
};

// Тестовый контейнер для Error Boundary
export const ErrorBoundaryTest = () => {
  const [shouldError, setShouldError] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h2>🧪 Тестирование Error Boundary</h2>
      
      <div style={{ margin: '20px 0' }}>
        <button
          onClick={() => setShouldError(false)}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Нормальный режим
        </button>
        
        <button
          onClick={() => setShouldError(true)}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Генерировать ошибку
        </button>
      </div>

      {/* ErrorBoundary уже добавлен в index.tsx, поэтому он перехватит эту ошибку */}
      <TestComponent shouldError={shouldError} />
    </div>
  );
};

/**
 * ИНСТРУКЦИЯ ПО ТЕСТИРОВАНИЮ:
 * 
 * 1. Добавьте в App.tsx:
 *    import { ErrorBoundaryTest } from './test-error-boundary';
 * 
 * 2. Добавьте компонент в начале render():
 *    <ErrorBoundaryTest />
 * 
 * 3. Откройте приложение в браузере
 * 
 * 4. Нажмите "Генерировать ошибку"
 * 
 * 5. Вы должны увидеть:
 *    - Приложение не упало полностью
 *    - Показывается fallback UI Error Boundary
 *    - Есть кнопка "Попробовать снова"
 *    - В console есть лог ошибки
 * 
 * 6. Нажмите "Попробовать снова" - компонент должен сброситься
 * 
 * 7. После тестирования удалите этот компонент из App.tsx
 */

