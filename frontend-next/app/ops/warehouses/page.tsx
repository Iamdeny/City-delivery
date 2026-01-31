import Link from 'next/link';
import { WarehousesActionsClient } from './WarehousesActionsClient';
import { fetchBffJson } from '../_lib/serverFetch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  // optional stats
  products_count?: number;
  out_of_stock_count?: number;
  active_orders_count?: number;
  last_order_at?: string | null;
};

function parseBool(value: unknown) {
  if (value === true || value === false) return value;
  if (value === undefined || value === null) return false;
  const s = String(value).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
}

async function fetchDarkStores(includeInactive: boolean): Promise<DarkStore[]> {
  const qs = new URLSearchParams();
  qs.set('withStats', 'true');
  if (includeInactive) qs.set('includeInactive', 'true');
  const data = await fetchBffJson<{ success: boolean; stores: DarkStore[] }>(`/api/bff/dark-stores?${qs.toString()}`);
  return data.stores ?? [];
}

export default async function WarehousesPage({
  searchParams,
}: {
  searchParams?: Promise<{ activeOnly?: string; q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const activeOnly = parseBool(sp.activeOnly);
  const includeInactive = !activeOnly;
  const q = (sp.q || '').trim();

  let stores: DarkStore[] = [];
  let error: string | null = null;

  try {
    stores = await fetchDarkStores(includeInactive);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }

  const filtered = q
    ? stores.filter((s) => {
        const hay = `${s.name} ${s.address}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
    : stores;

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Склады</h1>
            <p className="mt-2 text-sm text-gray-600">Операционный список dark-stores: статусы, товары, активные заказы.</p>
          </div>
          <div className="flex items-center gap-4">
            <WarehousesActionsClient />
            <form action="/ops/warehouses" method="get" className="hidden md:flex items-center gap-2">
              {activeOnly ? <input type="hidden" name="activeOnly" value="true" /> : null}
              <Input
                name="q"
                defaultValue={q}
                placeholder="Поиск: название / адрес"
                className="w-[260px]"
                data-ops-hotkey="search"
              />
              <Button size="sm" className="h-10">Найти</Button>
            </form>
            <div className="flex rounded-xl overflow-hidden border border-gray-300 bg-white">
              <Link
                href={q ? `/ops/warehouses?q=${encodeURIComponent(q)}` : '/ops/warehouses'}
                className={`px-3 py-2 text-xs font-extrabold ${
                  !activeOnly ? 'bg-gray-900 text-white' : 'text-gray-900 hover:bg-gray-50'
                }`}
                title="Показывать активные и неактивные"
              >
                Все
              </Link>
              <Link
                href={q ? `/ops/warehouses?activeOnly=true&q=${encodeURIComponent(q)}` : '/ops/warehouses?activeOnly=true'}
                className={`px-3 py-2 text-xs font-extrabold ${
                  activeOnly ? 'bg-gray-900 text-white' : 'text-gray-900 hover:bg-gray-50'
                }`}
                title="Показывать только активные"
              >
                Только активные
              </Link>
            </div>
            <a
              href={`/api/bff/dark-stores?withStats=true${includeInactive ? '&includeInactive=true' : ''}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Открыть JSON API
            </a>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="font-bold">Не удалось загрузить склады</div>
            <div className="text-sm mt-1">{error}</div>
            <div className="text-sm mt-2 text-red-700/90">
              Проверь `NEXT_PUBLIC_API_URL` и что backend запущен.
            </div>
          </div>
        ) : null}

        {!error ? (
          <div className="mt-6 text-sm text-gray-600">
            Показано: <span className="font-extrabold text-gray-900">{filtered.length}</span> из{' '}
            <span className="font-extrabold text-gray-900">{stores.length}</span>
            {q ? (
              <>
                {' '}
                · поиск: <span className="font-extrabold text-gray-900">{q}</span>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/ops/warehouses/${s.id}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-extrabold text-gray-900 truncate">
                    {s.name}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {s.address}
                  </div>
                </div>
                <Badge variant={s.is_active ? 'success' : 'default'}>
                  {s.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-500">Товары</div>
                  <div className="mt-1 text-xl font-extrabold text-gray-900">
                    {s.products_count ?? '—'}
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-500">Out of stock</div>
                  <div className="mt-1 text-xl font-extrabold text-gray-900">
                    {s.out_of_stock_count ?? '—'}
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-500">Активные заказы</div>
                  <div className="mt-1 text-xl font-extrabold text-gray-900">
                    {s.active_orders_count ?? '—'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  Радиус доставки:{' '}
                  <span className="font-semibold text-gray-900">
                    {s.delivery_radius ? `${s.delivery_radius} м` : '—'}
                  </span>
                </div>
                <div className="font-semibold text-indigo-600 group-hover:text-indigo-700">
                  Открыть →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!error && filtered.length === 0 ? (
          <div className="mt-10 text-gray-600">
            Складов не найдено.
          </div>
        ) : null}
    </div>
  );
}

