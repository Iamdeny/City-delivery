/**
 * Страница 404 - Not Found
 * Показывается когда роут не найден
 */
import Link from 'next/link';
import { Home, Search, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Страница не найдена
        </h2>
        
        <p className="text-gray-600 mb-8">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            На главную
          </Link>
          
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors shadow-md hover:shadow-lg"
          >
            <ShoppingBag className="w-4 h-4" />
            Каталог товаров
          </Link>
        </div>
      </div>
    </div>
  );
}
