/**
 * Глобальная обработка ошибок
 * Перехватывает ошибки во всех дочерних компонентах
 */
'use client';

import { useEffect } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логирование ошибки для мониторинга
    logger.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Что-то пошло не так
        </h1>
        
        <p className="text-gray-600 mb-2">
          Произошла непредвиденная ошибка
        </p>
        
        {error.message && (
          <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-100 p-3 rounded-lg">
            {error.message}
          </p>
        )}
        
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6">
            Код ошибки: {error.digest}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
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
