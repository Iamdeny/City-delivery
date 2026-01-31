/**
 * Обработка ошибок для страницы продуктов
 */
'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Products page error:', error);
  }, [error]);

  const isBackendError = error.message?.includes('Backend') || 
                        error.message?.includes('503') ||
                        error.message?.includes('недоступен');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-orange-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ошибка загрузки товаров
        </h2>
        
        {isBackendError ? (
          <>
            <p className="text-gray-600 mb-4">
              Сервер временно недоступен. Пожалуйста, попробуйте позже.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Если проблема сохраняется, проверьте подключение к интернету или свяжитесь с поддержкой.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              {error.message || 'Произошла ошибка при загрузке товаров'}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 mb-6">
                Код ошибки: {error.digest}
              </p>
            )}
          </>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
