/**
 * Footer компонент
 * Мигрировано из frontend/src/components/Footer/Footer.tsx
 */
'use client';

import { useConnectionStatus } from '@/app/hooks/useConnectionStatus';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';
import { useCart } from '@/app/hooks/useCart';
import { Phone, Clock, ShoppingCart, DollarSign, FileText, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Footer() {
  const { status, isOnline, checkConnection } = useConnectionStatus();
  const { totalItems, totalAmount } = useCart();

  const getStatusText = () => {
    if (status === 'checking') {
      return 'Проверка соединения...';
    }
    if (status === 'connected' && isOnline) {
      return 'Сервер подключен';
    }
    if (status === 'disconnected' || !isOnline) {
      return 'Нет соединения';
    }
    if (status === 'error') {
      return 'Ошибка подключения';
    }
    return 'Проверка соединения...';
  };

  const getStatusIcon = () => {
    if (status === 'checking') {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (status === 'connected' && isOnline) {
      return <CheckCircle2 className="w-4 h-4" />;
    }
    if (status === 'disconnected' || !isOnline) {
      return <AlertCircle className="w-4 h-4" />;
    }
    if (status === 'error') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return null;
  };

  const getStatusColor = () => {
    if (status === 'connected' && isOnline) {
      return 'border-green-500 text-green-600 hover:bg-green-50';
    }
    if (status === 'disconnected' || status === 'error') {
      return 'border-red-500 text-red-600 hover:bg-red-50';
    }
    if (status === 'checking') {
      return 'border-orange-500 text-orange-600 hover:bg-orange-50';
    }
    return 'border-gray-300 text-gray-700 hover:bg-gray-50';
  };

  return (
    <footer className="mt-10 py-6 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Copyright */}
        <p className="my-2 text-gray-600 text-sm">
          © {new Date().getFullYear()} Доставка продуктов. Ваш город.
        </p>

        {/* Contact Info */}
        <p className="flex items-center justify-center gap-2 flex-wrap text-gray-600 text-sm my-2">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
          Телефон: +7 (999) 123-45-67
          <span className="text-gray-300 mx-1">|</span>
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          Время работы: 8:00-22:00
        </p>

        {/* Connection Status */}
        <p className="flex items-center justify-center my-3">
          <button
            onClick={checkConnection}
            className={`flex items-center gap-2 bg-white border rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${getStatusColor()} disabled:cursor-not-allowed disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0`}
            disabled={status === 'checking'}
            aria-label="Проверить соединение"
          >
            {getStatusIcon()}
            {getStatusText()}
          </button>
        </p>

        {/* Stats */}
        <div className="flex justify-center items-center gap-5 mt-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            Товаров: {totalItems}
          </span>
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            Сумма: <PriceDisplay price={totalAmount} size="sm" />
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            Автосохранение
          </span>
        </div>
      </div>
    </footer>
  );
}
