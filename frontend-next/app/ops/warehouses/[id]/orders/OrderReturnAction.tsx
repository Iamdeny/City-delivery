'use client';

import { useState } from 'react';
import { useOpsSession } from '../../../_lib/opsSession';

type OrderItem = {
  product_id: number;
  product_name?: string;
  product_image?: string | null;
  quantity: number;
  price?: string | number;
};

type ReturnSummaryItem = {
  productId: number;
  orderedQty: number;
  returnedQty: number;
  remainingQty: number;
};

async function fetchOrder(orderId: number) {
  const res = await fetch(`/api/bff/orders/${orderId}`, { cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as { order?: { id: number; status: string; items?: OrderItem[] } };
}

async function fetchReturnSummary(orderId: number) {
  const res = await fetch(`/api/bff/orders/${orderId}/return-summary`, { cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as { items?: ReturnSummaryItem[] };
}

async function postReturn(
  orderId: number,
  body: { reason?: string; items?: Array<{ productId: number; quantity: number }> }
) {
  const res = await fetch(`/api/bff/orders/${orderId}/return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as any;
}

function formatErr(e: unknown) {
  const anyErr = e as { httpStatus?: number; data?: any };
  if (anyErr?.httpStatus === 401) return 'Не авторизован.';
  if (anyErr?.httpStatus === 403) return 'Недостаточно прав (нужен admin/manager).';
  const code = anyErr?.data?.error;
  if (code === 'ALREADY_FULLY_RETURNED') return 'По этому заказу уже всё возвращено (остаток 0).';
  if (code === 'ITEM_QTY_EXCEEDS_REMAINING') return 'Количество к возврату больше, чем осталось.';
  if (code === 'ORDER_NOT_FOUND') return 'Заказ не найден.';
  const msg = anyErr?.data?.message || anyErr?.data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Не удалось оформить возврат';
}

export function OrderReturnAction({ orderId, status }: { orderId: number; status: string }) {
  const { user } = useOpsSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [showPartial, setShowPartial] = useState(false);
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const [summary, setSummary] = useState<ReturnSummaryItem[] | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({}); // product_id -> qty
  const [reason, setReason] = useState('ops_return');

  const role = user?.role ?? null;
  const can = role === 'admin' || role === 'manager';
  const eligible = status === 'picked_up' || status === 'delivering' || status === 'delivered' || status === 'cancelled';

  const selectedItems = Object.entries(selected)
    .map(([productId, quantity]) => ({ productId: Number(productId), quantity: Number(quantity) }))
    .filter((x) => Number.isFinite(x.productId) && x.productId > 0 && Number.isFinite(x.quantity) && x.quantity > 0);

  if (!can || !eligible) return null;

  const runFull = async () => {
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      if (!confirm(`Оформить возврат по заказу #${orderId}? Это увеличит stock_quantity.`)) {
        return;
      }
      await postReturn(orderId, { reason });
      setOk(true);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  const openPartial = async () => {
    setError(null);
    setOk(false);
    setShowPartial(true);

    if (items && summary) return;

    setLoading(true);
    try {
      let data: any;
      let sum: any;
      data = await fetchOrder(orderId);
      sum = await fetchReturnSummary(orderId);

      const orderItems: OrderItem[] = Array.isArray(data?.order?.items) ? data.order.items : [];
      setItems(orderItems);
      const sumItems: ReturnSummaryItem[] = Array.isArray(sum?.items) ? sum.items : [];
      setSummary(sumItems);
      const byProduct = new Map(sumItems.map((x) => [x.productId, x]));
      const init: Record<number, number> = {};
      for (const it of orderItems) {
        const pid = Number(it.product_id);
        const qty = Number(it.quantity);
        if (Number.isFinite(pid) && pid > 0 && Number.isFinite(qty) && qty > 0) {
          // clamp initial to 0, but keep key
          init[pid] = 0;
          // If summary missing (no returns yet), synthesize
          if (!byProduct.has(pid)) {
            byProduct.set(pid, { productId: pid, orderedQty: qty, returnedQty: 0, remainingQty: qty });
          }
        }
      }
      setSelected(init);
      setSummary(Array.from(byProduct.values()));
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  const runPartial = async () => {
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      if (selectedItems.length === 0) {
        throw new Error('Выбери хотя бы один товар и количество.');
      }
      if (!confirm(`Оформить частичный возврат по заказу #${orderId}?`)) {
        return;
      }
      await postReturn(orderId, { reason, items: selectedItems });
      setOk(true);
      // Refresh summary after successful partial return
      try {
        const sum = await fetchReturnSummary(orderId);
        const sumItems: ReturnSummaryItem[] = Array.isArray(sum?.items) ? sum.items : [];
        setSummary(sumItems);
        // reset selections to 0
        setSelected((prev) => {
          const next: Record<number, number> = {};
          for (const k of Object.keys(prev)) next[Number(k)] = 0;
          return next;
        });
      } catch {
        // ignore summary refresh errors
      }
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-900 disabled:opacity-50"
          disabled={loading}
          onClick={() => void openPartial()}
          title="Частичный возврат (выбор позиций)"
        >
          Частичный возврат
        </button>
        <button
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-900 disabled:opacity-50"
          disabled={loading}
          onClick={() => void runFull()}
          title="Полный возврат товара на склад (идемпотентно)"
        >
          {loading ? 'Оформляем…' : ok ? 'Возврат оформлен' : 'Полный возврат'}
        </button>
      </div>
      {error ? <div className="text-xs font-semibold text-red-600 max-w-[260px] text-right">{error}</div> : null}

      {showPartial ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="font-extrabold text-gray-900">Частичный возврат · заказ #{orderId}</div>
              <button
                className="text-sm font-bold text-gray-600 hover:text-gray-900"
                onClick={() => setShowPartial(false)}
                disabled={loading}
              >
                Закрыть
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1">
                <div className="text-xs font-semibold text-gray-600">Причина (для теста)</div>
                <input
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                />
              </div>

              {items === null || summary === null ? (
                <div className="text-sm text-gray-600">{loading ? 'Загрузка состава заказа…' : 'Нет данных'}</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-gray-600">В заказе нет позиций.</div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold">Товар</th>
                        <th className="text-right px-4 py-3 font-bold">В заказе</th>
                        <th className="text-right px-4 py-3 font-bold">Возвращено</th>
                        <th className="text-right px-4 py-3 font-bold">Осталось</th>
                        <th className="text-right px-4 py-3 font-bold">Вернуть</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((it) => {
                        const pid = Number(it.product_id);
                        const orderedQty = Number(it.quantity);
                        const s = summary.find((x) => x.productId === pid);
                        const returnedQty = s ? Number(s.returnedQty) : 0;
                        const remainingQty = s ? Number(s.remainingQty) : Math.max(0, orderedQty - returnedQty);
                        const maxQty = remainingQty;
                        const cur = selected[pid] ?? 0;
                        return (
                          <tr key={`${pid}`}>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900">{it.product_name || `product#${pid}`}</div>
                              <div className="text-xs text-gray-500">#{pid}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{orderedQty}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{returnedQty}</td>
                            <td className="px-4 py-3 text-right font-extrabold text-gray-900">{remainingQty}</td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min={0}
                                max={maxQty}
                                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-right"
                                value={cur}
                                disabled={loading}
                                onChange={(e) => {
                                  const v = Math.max(0, Math.min(maxQty, Math.floor(Number(e.target.value || 0))));
                                  setSelected((s) => ({ ...s, [pid]: v }));
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-gray-600">
                  Выбрано позиций: <span className="text-gray-900">{selectedItems.length}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-extrabold text-gray-900 disabled:opacity-50"
                    onClick={() => setShowPartial(false)}
                    disabled={loading}
                  >
                    Отмена
                  </button>
                  <button
                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                    onClick={() => void runPartial()}
                    disabled={loading || selectedItems.length === 0}
                  >
                    {loading ? 'Оформляем…' : 'Оформить возврат'}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

