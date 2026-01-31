'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useOpsSession } from '../_lib/opsSession';
import type { DarkStoreLite, LiveOrder, LiveOrdersResponse } from './types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '../_ui/StatusPill';
import { OpsSelectableListHotkeysClient } from '../_ui/OpsSelectableListHotkeysClient';
import { OrderRowActionsClient } from '../warehouses/[id]/orders/OrderRowActionsClient';

async function fetchStores(): Promise<DarkStoreLite[]> {
  const res = await fetch(`/api/bff/dark-stores?includeInactive=true`, { cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as any;
  const stores = (data?.stores ?? data?.data?.stores ?? []) as any[];
  return stores.map((s) => ({ id: Number(s.id), name: String(s.name), is_active: Boolean(s.is_active) }));
}

async function fetchLiveOrders(params: Record<string, string>): Promise<LiveOrdersResponse> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`/api/bff/admin/orders?${qs.toString()}`, {
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as LiveOrdersResponse;
}

async function fetchOrderDetails(orderId: number) {
  const res = await fetch(`/api/bff/orders/${orderId}`, {
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as any;
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: 'Новый',
    preparing: 'Подготовка',
    picking: 'Сборка',
    ready: 'Готов (ждёт курьера)',
    assigned_to_courier: 'Курьер назначен',
    picked_up: 'Забран',
    delivering: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };
  return map[s] ?? s;
}

function returnBadge(o: LiveOrder) {
  const ordered = Number(o.ordered_qty_total ?? 0);
  const returned = o.returned_qty_total === null ? null : Number(o.returned_qty_total);
  if (!ordered || ordered <= 0) return null;
  if (returned === null) return null; // backend hasn't migrated returns tables yet
  if (returned <= 0) return null;
  if (returned >= ordered) {
    return { text: 'Возврат: полный', cls: 'bg-emerald-100 text-emerald-800' };
  }
  return { text: `Возврат: ${returned}/${ordered}`, cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200' };
}

function formatErr(e: unknown) {
  const anyErr = e as { httpStatus?: number; data?: any };
  if (anyErr?.httpStatus === 401) return 'Не авторизован (нужно войти под admin/manager).';
  if (anyErr?.httpStatus === 403) return 'Доступ запрещён (нужна роль admin/manager).';
  const msg = anyErr?.data?.message || anyErr?.data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Ошибка';
}

export function OrdersLiveDashboardClient() {
  const { user } = useOpsSession();
  const role = user?.role ?? null;
  const can = role === 'admin' || role === 'manager';

  const [stores, setStores] = useState<DarkStoreLite[]>([]);
  const [storeId, setStoreId] = useState<string>(''); // '' => all

  const [tab, setTab] = useState<'new' | 'active' | 'completed' | 'all'>('active');
  const [needsCourier, setNeedsCourier] = useState(false);
  const [problematic, setProblematic] = useState(false);
  const [q, setQ] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LiveOrdersResponse | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);

  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    void fetchStores().then(setStores).catch(() => setStores([]));
  }, []);

  const params = useMemo(() => {
    const p: Record<string, string> = {
      tab,
      limit: '100',
      offset: '0',
    };
    if (storeId) p.darkStoreId = storeId;
    if (needsCourier) p.needsCourier = 'true';
    if (problematic) p.problematic = 'true';
    if (q.trim()) p.q = q.trim();
    return p;
  }, [tab, storeId, needsCourier, problematic, q]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLiveOrders(params);
      setData(res);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id: number) => {
    setSelectedId(id);
    setDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const d = await fetchOrderDetails(id);
      setDetails(d);
    } catch (e) {
      if (e instanceof Error) setDetailsError(e.message);
      else setDetailsError(formatErr(e));
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (!can) return;
    void load();
    // polling
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => void load(), 5000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [can, params]);

  const orders = data?.orders ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-extrabold text-gray-900">Очередь</div>
          <div className="text-xs font-semibold text-gray-600">
            {loading ? 'обновление…' : 'live'}
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-2 items-center">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="new">Новые</TabsTrigger>
              <TabsTrigger value="active">Активные</TabsTrigger>
              <TabsTrigger value="completed">Завершённые</TabsTrigger>
              <TabsTrigger value="all">Все</TabsTrigger>
            </TabsList>
          </Tabs>

          <select
            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            title="Самокат-стиль: выбрать даркстор"
          >
            <option value="">Все склады</option>
            {stores.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}{s.is_active ? '' : ' (inactive)'}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-800 select-none">
            <input type="checkbox" checked={needsCourier} onChange={(e) => setNeedsCourier(e.target.checked)} />
            Нужно назначить курьера
            <Badge variant="purple" className="ml-1 px-2 py-0.5 text-[11px]">
              {data?.health?.needsCourierCount ?? '—'}
            </Badge>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-800 select-none">
            <input type="checkbox" checked={problematic} onChange={(e) => setProblematic(e.target.checked)} />
            Проблемные (late)
            <Badge variant="danger" className="ml-1 px-2 py-0.5 text-[11px]">
              {data?.health?.lateCount ?? '—'}
            </Badge>
          </label>

          <Input
            className="flex-1 min-w-[140px] h-9 text-xs"
            placeholder="Поиск: #id / телефон / адрес"
            value={q}
            data-ops-hotkey="search"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-800 text-sm">
            <div className="font-extrabold">Ошибка</div>
            <div className="mt-1">{error}</div>
          </div>
        ) : null}

        {!can ? (
          <div className="p-4 text-sm text-gray-700">
            Нужна роль <span className="font-semibold">admin/manager</span>.
          </div>
        ) : null}

        <OpsSelectableListHotkeysClient itemSelector='button[data-ops-live-order="true"]' />

        <div className="max-h-[70vh] overflow-auto">
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => void loadDetails(o.id)}
              data-ops-live-order="true"
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                selectedId === o.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-extrabold text-gray-900">#{o.id}</div>
                  <div className="text-xs text-gray-600 truncate max-w-[300px]">{o.address}</div>
                  <div className="mt-1 text-[11px] text-gray-500 truncate max-w-[300px]">
                    {o.dark_store_name ? `Склад: ${o.dark_store_name}` : `Склад: #${o.dark_store_id ?? '—'}`}
                  </div>
                  {(() => {
                    const b = returnBadge(o);
                    if (!b) return null;
                    return (
                      <div className="mt-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold ${b.cls}`}>{b.text}</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill status={o.status} isLate={o.is_late} />
                  <div className="text-xs font-extrabold text-gray-900">
                    {Number(o.total).toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-[11px] font-semibold text-gray-600">items: {o.items_count}</div>
                </div>
              </div>
            </button>
          ))}

          {orders.length === 0 && can ? (
            <div className="p-4 text-sm text-gray-600">Нет заказов по фильтрам.</div>
          ) : null}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-600 flex items-center justify-between">
          <div>
            Всего: <span className="font-extrabold text-gray-900">{data?.total ?? '—'}</span>
          </div>
          <div className="text-gray-500">
            polling: 5s
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-extrabold text-gray-900">Детали</div>
          {selectedId ? (
            <a
              href={`/api/bff/orders/${selectedId}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              JSON
            </a>
          ) : null}
        </div>

        {!selectedId ? (
          <div className="p-4 text-sm text-gray-600">Выбери заказ слева.</div>
        ) : detailsLoading ? (
          <div className="p-4 text-sm text-gray-600">Загрузка…</div>
        ) : detailsError ? (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">{detailsError}</div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-gray-900">#{selectedId}</div>
                <div className="text-sm text-gray-600">{details?.order?.address ?? '—'}</div>
                <div className="text-xs text-gray-500 mt-1">{details?.order?.phone ?? '—'}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-xs text-gray-500">Сумма</div>
                  <div className="text-lg font-extrabold text-gray-900">
                    {Number(details?.order?.total ?? 0).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <OrderRowActionsClient
                  orderId={Number(selectedId)}
                  currentStatus={String(details?.order?.status ?? 'pending')}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
              <div className="text-xs font-semibold text-gray-600">Статус</div>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill status={String(details?.order?.status ?? '—')} />
                <div className="text-xs font-semibold text-gray-600">{statusLabel(details?.order?.status ?? '—')}</div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-xs font-semibold text-gray-600">Позиции</div>
              <div className="mt-2 space-y-2">
                {(details?.order?.items ?? []).map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{it.product_name ?? `prod#${it.product_id}`}</div>
                      <div className="text-xs text-gray-500">#{it.product_id}</div>
                    </div>
                    <div className="text-right text-sm font-extrabold text-gray-900">
                      x{it.quantity}
                    </div>
                  </div>
                ))}
                {(details?.order?.items ?? []).length === 0 ? (
                  <div className="text-sm text-gray-600">Нет позиций.</div>
                ) : null}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Здесь — быстрые ops‑действия. “Assign courier” добавим следующим шагом.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

