'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, MessageCircle } from 'lucide-react';
import { orderService, type OrderDetailDto } from '@/app/services/orderService';

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Ожидает подтверждения',
    preparing: 'Готовится',
    picking: 'Собирается',
    ready: 'Готов к выдаче',
    assigned_to_courier: 'Курьер назначен',
    picked_up: 'Курьер везёт ваш заказ',
    delivering: 'Курьер везёт ваш заказ',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };
  return labels[status] ?? status;
}

function isCourierDriving(status: string): boolean {
  return ['picked_up', 'delivering', 'assigned_to_courier'].includes(status);
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params?.id ?? '');
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Не указан номер заказа');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await orderService.getOrderById(orderId);
      if (cancelled) return;
      setLoading(false);
      if (res?.order) {
        setOrder(res.order);
      } else {
        setError('Заказ не найден');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const total = order?.items?.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 0), 0) ?? 0;
  const driving = order ? isCourierDriving(order.status) : false;

  if (loading) {
    return (
      <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20 flex items-center justify-center">
        <div className="text-[15px] text-[#5a5a5a]">Загрузка заказа...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20">
        <div className="max-w-xl mx-auto px-4 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[22px] font-extrabold text-[#1a1a1a]">Заказ №{orderId || '—'}</h1>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95"
              aria-label="Назад"
            >
              ←
            </button>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-[15px] text-[#5a5a5a] mb-4">{error ?? 'Заказ не найден'}</p>
            <button
              type="button"
              onClick={() => router.push('/profile/orders')}
              className="px-4 py-2 rounded-2xl bg-[#16a34a] text-white text-[15px] font-semibold active:scale-[0.98]"
            >
              К моим заказам
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20">
      <div className="max-w-xl mx-auto px-4 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[22px] font-extrabold text-[#1a1a1a]">
            Заказ №{order.id}
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95"
            aria-label="Назад"
          >
            ←
          </button>
        </div>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[13px] font-semibold text-[#16a34a]">
              15 мин
            </span>
          </div>
          <p className="text-[15px] font-semibold text-[#1a1a1a]">
            {statusLabel(order.status)}
          </p>
        </section>

        {driving && (
          <section className="bg-white rounded-[24px] overflow-hidden mb-4 shadow-sm">
            <div className="aspect-[4/3] bg-[#e8f5e9] flex items-center justify-center relative">
              <MapPin className="w-12 h-12 text-[#16a34a] opacity-60" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-2xl bg-white/95 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center text-sm font-semibold">
                    👤
                  </div>
                  <div>
                    <div className="text-[13px] font-extrabold text-[#1a1a1a]">Курьер</div>
                    <div className="text-[11px] text-[#5a5a5a]">В пути</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-3">
            Состав заказа
          </h2>
          <div className="flex items-center justify-between mb-3 pt-2 border-t border-gray-100">
            <span className="text-[15px] font-extrabold text-[#1a1a1a]">
              Итого
            </span>
            <span className="text-[15px] font-extrabold text-[#1a1a1a]">
              {total.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <ul className="space-y-2 text-[14px] text-[#1a1a1a]">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.quantity} × {item.product_name ?? 'Товар'}
                </span>
                <span className="font-semibold">
                  {((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString('ru-RU')} ₽
                </span>
              </li>
            ))}
          </ul>
        </section>

        <Link
          href="/profile/support"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white border-2 border-blue-600 text-[15px] font-semibold text-blue-600 active:scale-[0.98] shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
          Связаться с поддержкой
        </Link>
      </div>
    </div>
  );
}
