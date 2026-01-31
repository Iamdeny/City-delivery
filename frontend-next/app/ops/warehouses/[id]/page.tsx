import Link from 'next/link';
import { WarehouseEditClient } from './WarehouseEditClient';
import { WarehouseQuickActionsClient } from './WarehouseQuickActionsClient';
import { fetchBffJson } from '../../_lib/serverFetch';
import { Badge } from '@/components/ui/badge';

type DarkStore = {
  id: number;
  name: string;
  address: string;
  latitude: string | number | null;
  longitude: string | number | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  opening_time: string | null;
  closing_time: string | null;
  delivery_radius: number | null;
  delivery_fee: string | number | null;
  min_order_amount: string | number | null;
  created_at: string;
  products_count?: number;
  out_of_stock_count?: number;
  active_orders_count?: number;
  last_order_at?: string | null;
};

async function fetchDarkStore(id: string): Promise<DarkStore> {
  const data = await fetchBffJson<{ success: boolean; store: DarkStore }>(`/api/bff/dark-stores/${id}?withStats=true`);
  return data.store;
}

export default async function WarehouseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await fetchDarkStore(id);

  return (
    <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/ops/warehouses" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              ← Назад к складам
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              {store.name}
            </h1>
            <p className="mt-2 text-gray-600">{store.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <WarehouseEditClient store={store} />
            <WarehouseQuickActionsClient
              storeId={store.id}
              isActive={store.is_active}
              latitude={store.latitude}
              longitude={store.longitude}
            />
            <Badge variant={store.is_active ? 'success' : 'default'} className="px-3 py-1 text-sm">
              {store.is_active ? 'Активен' : 'Неактивен'}
            </Badge>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs font-semibold text-gray-500">Товары</div>
            <div className="mt-1 text-2xl font-extrabold text-gray-900">
              {store.products_count ?? '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs font-semibold text-gray-500">Out of stock</div>
            <div className="mt-1 text-2xl font-extrabold text-gray-900">
              {store.out_of_stock_count ?? '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs font-semibold text-gray-500">Активные заказы</div>
            <div className="mt-1 text-2xl font-extrabold text-gray-900">
              {store.active_orders_count ?? '—'}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm font-bold text-gray-900">Параметры</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="text-gray-600">
              Телефон: <span className="font-semibold text-gray-900">{store.phone ?? '—'}</span>
            </div>
            <div className="text-gray-600">
              Email: <span className="font-semibold text-gray-900">{store.email ?? '—'}</span>
            </div>
            <div className="text-gray-600">
              Часы: <span className="font-semibold text-gray-900">{store.opening_time ?? '—'}–{store.closing_time ?? '—'}</span>
            </div>
            <div className="text-gray-600">
              Радиус: <span className="font-semibold text-gray-900">{store.delivery_radius ? `${store.delivery_radius} м` : '—'}</span>
            </div>
            <div className="text-gray-600">
              Доставка: <span className="font-semibold text-gray-900">{store.delivery_fee !== null && store.delivery_fee !== undefined ? `${Number(store.delivery_fee).toLocaleString('ru-RU')} ₽` : '—'}</span>
            </div>
            <div className="text-gray-600">
              Мин. заказ: <span className="font-semibold text-gray-900">{store.min_order_amount !== null && store.min_order_amount !== undefined ? `${Number(store.min_order_amount).toLocaleString('ru-RU')} ₽` : '—'}</span>
            </div>
            <div className="text-gray-600">
              Координаты:{' '}
              <span className="font-semibold text-gray-900">
                {store.latitude !== null && store.longitude !== null ? `${store.latitude}, ${store.longitude}` : '—'}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/ops/warehouses/${store.id}/inventory`}
              className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white"
            >
              Остатки
            </Link>
            <Link
              href={`/ops/warehouses/${store.id}/orders`}
              className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-900 border border-gray-300"
            >
              Заказы
            </Link>
            <a
              href={`/api/bff/dark-stores/${store.id}?withStats=true`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700"
            >
              Открыть JSON API
            </a>
          </div>
        </div>
    </div>
  );
}

