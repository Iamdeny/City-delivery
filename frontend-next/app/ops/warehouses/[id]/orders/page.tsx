import Link from 'next/link';
import { OrderRowActionsClient } from './OrderRowActionsClient';
import { fetchBffJson } from '../../../_lib/serverFetch';
import { StatusPill } from '../../../_ui/StatusPill';
import { OpsTableHotkeysClient } from '../../../_ui/OpsTableHotkeysClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type OrderSummary = {
  id: number;
  status: string;
  total: string | number;
  created_at: string;
  updated_at: string;
  client_id: number;
  phone: string;
  address: string;
  comment: string | null;
  dark_store_id: number;
  items_count: number;
  ordered_qty_total?: number;
  returned_qty_total?: number | null;
};

type OrdersResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  orders: OrderSummary[];
  byStatus: Record<string, number>;
};

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: 'Новый',
    preparing: 'Подготовка',
    picking: 'Сборка',
    ready: 'Готов',
    assigned_to_courier: 'Назначен курьеру',
    picked_up: 'Забран',
    delivering: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
    active: 'Активные',
  };
  return map[s] ?? s;
}

function returnBadge(o: OrderSummary) {
  const ordered = Number(o.ordered_qty_total ?? 0);
  const returned = o.returned_qty_total === null ? null : Number(o.returned_qty_total ?? 0);
  if (!ordered || ordered <= 0) return null;
  if (returned === null) return null; // backend hasn't migrated returns tables yet
  if (returned <= 0) return null;
  if (returned >= ordered) return { text: 'Возврат: полный', cls: 'bg-emerald-100 text-emerald-800' };
  return { text: `Возврат: ${returned}/${ordered}`, cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200' };
}

async function fetchOrders(storeId: string, opts: { status?: string; limit: number; offset: number }): Promise<OrdersResponse> {
  const params = new URLSearchParams({
    darkStoreId: storeId,
    limit: String(opts.limit),
    offset: String(opts.offset),
  });
  if (opts.status) params.set('status', opts.status);
  return await fetchBffJson<OrdersResponse>(`/api/bff/orders?${params.toString()}`);
}

export default async function WarehouseOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string; q?: string; offset?: string; limit?: string }>;
}) {
  const { id: storeId } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const status = sp?.status;
  const q = String(sp?.q ?? '').trim();
  const limit = Math.min(200, Math.max(10, Number(sp?.limit ?? 50) || 50));
  const offset = Math.max(0, Number(sp?.offset ?? 0) || 0);

  const data = await fetchOrders(storeId, { status, limit, offset: q ? 0 : offset });
  const statuses = Object.keys(data.byStatus || {}).sort((a, b) => (data.byStatus[b] ?? 0) - (data.byStatus[a] ?? 0));
  const safeOffset = q ? 0 : offset;
  const prevOffset = Math.max(0, safeOffset - limit);
  const nextOffset = safeOffset + limit;
  const hasPrev = safeOffset > 0;
  const hasNext = nextOffset < (data.total ?? 0);

  const qsBase = new URLSearchParams();
  if (status) qsBase.set('status', status);
  if (q) qsBase.set('q', q);
  qsBase.set('limit', String(limit));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/ops/warehouses/${storeId}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            ← Назад к складу
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Заказы склада #{storeId}</h1>
          <p className="mt-2 text-gray-600">Фильтр по статусам + список последних заказов.</p>
        </div>
        <a
          href={`/api/bff/orders?${(() => {
            const qs = new URLSearchParams({ darkStoreId: storeId, limit: String(limit), offset: String(safeOffset) });
            if (status) qs.set('status', status);
            if (q) qs.set('q', q);
            return qs.toString();
          })()}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Открыть JSON API
        </a>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <form method="get" action={`/ops/warehouses/${storeId}/orders`} className="flex flex-wrap items-end gap-3">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input type="hidden" name="limit" value={String(limit)} />
          <div className="flex-1 min-w-[220px]">
            <div className="text-xs font-semibold text-gray-600">Поиск</div>
            <input
              name="q"
              defaultValue={q}
              placeholder="id / телефон / адрес"
              data-ops-hotkey="search"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
            />
          </div>
          <button className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white">Найти</button>
          {q ? (
            <Link
              href={`/ops/warehouses/${storeId}/orders?${(() => {
                const qs = new URLSearchParams();
                if (status) qs.set('status', status);
                qs.set('limit', String(limit));
                return qs.toString();
              })()}`}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-extrabold text-gray-900"
            >
              Сбросить
            </Link>
          ) : null}
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/ops/warehouses/${storeId}/orders?${(() => {
            const qs = new URLSearchParams();
            if (q) qs.set('q', q);
            qs.set('limit', String(limit));
            return qs.toString();
          })()}`}
          className={`rounded-full px-3 py-1 text-sm font-bold border ${
            !status ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-300'
          }`}
        >
          Все ({data.total})
        </Link>
        <Link
          href={`/ops/warehouses/${storeId}/orders?${(() => {
            const qs = new URLSearchParams({ status: 'active', limit: String(limit) });
            if (q) qs.set('q', q);
            return qs.toString();
          })()}`}
          className={`rounded-full px-3 py-1 text-sm font-bold border ${
            status === 'active' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-300'
          }`}
        >
          Активные
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/ops/warehouses/${storeId}/orders?${(() => {
              const qs = new URLSearchParams({ status: s, limit: String(limit) });
              if (q) qs.set('q', q);
              return qs.toString();
            })()}`}
            className={`rounded-full px-3 py-1 text-sm font-bold border ${
              status === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            {statusLabel(s)} ({data.byStatus[s] ?? 0})
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="font-extrabold text-gray-900">Последние заказы</div>
          <div className="text-xs text-gray-500">
            limit: {data.limit} · offset: {data.offset} · всего: {data.total}
          </div>
        </div>

        <OpsTableHotkeysClient
          rowSelector='tr[data-ops-row="order"]'
          actionsSelector='[data-ops-actions-trigger="true"]'
        />

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Заказ</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.orders.map((o) => (
              <TableRow key={o.id} data-ops-row="order" data-ops-row-id={o.id}>
                <TableCell>
                  <div className="font-extrabold text-gray-900">#{o.id}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[360px]">{o.address}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <StatusPill status={o.status} />
                    {(() => {
                      const b = returnBadge(o);
                      if (!b) return null;
                      return (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold ${b.cls}`}>
                          {b.text}
                        </span>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-right font-extrabold text-gray-900">{Number(o.total).toLocaleString('ru-RU')} ₽</TableCell>
                <TableCell className="text-right font-semibold text-gray-900">{o.items_count}</TableCell>
                <TableCell className="text-gray-700">{new Date(o.created_at).toLocaleString('ru-RU')}</TableCell>
                <TableCell className="text-right align-top">
                  <OrderRowActionsClient orderId={o.id} currentStatus={o.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data.orders.length === 0 ? <div className="p-5 text-gray-600">Заказов по фильтру нет.</div> : null}

        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Показано <span className="font-extrabold text-gray-900">{data.orders.length}</span> · offset{' '}
            <span className="font-extrabold text-gray-900">{safeOffset}</span>
            {q ? (
              <>
                {' '}
                · поиск: <span className="font-extrabold text-gray-900">{q}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/ops/warehouses/${storeId}/orders?${(() => {
                const qs = new URLSearchParams(qsBase);
                qs.set('offset', String(prevOffset));
                return qs.toString();
              })()}`}
              className={`rounded-xl border px-4 py-2 text-sm font-extrabold ${
                hasPrev ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-400 pointer-events-none'
              }`}
            >
              ← Назад
            </Link>
            <Link
              href={`/ops/warehouses/${storeId}/orders?${(() => {
                const qs = new URLSearchParams(qsBase);
                qs.set('offset', String(nextOffset));
                return qs.toString();
              })()}`}
              className={`rounded-xl border px-4 py-2 text-sm font-extrabold ${
                hasNext ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-400 pointer-events-none'
              }`}
            >
              Вперёд →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

