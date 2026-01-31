'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOpsSession } from '../../../_lib/opsSession';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Role = 'customer' | 'courier' | 'picker' | 'admin' | 'manager' | 'unknown';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Новый',
  preparing: 'Подготовка',
  picking: 'Сборка',
  ready: 'Готов',
  assigned_to_courier: 'Назначен курьеру',
  picked_up: 'Забран',
  delivering: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const ALL_STATUSES = Object.keys(STATUS_LABEL);

const NEXT_BY_STATUS: Record<string, string | null> = {
  pending: 'preparing',
  preparing: 'picking',
  picking: 'ready',
  ready: 'assigned_to_courier',
  assigned_to_courier: 'picked_up',
  picked_up: 'delivering',
  delivering: 'delivered',
  delivered: null,
  cancelled: null,
};

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

type CourierUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
};

function labelStatus(s: string) {
  return STATUS_LABEL[s] ?? s;
}

async function patchStatus(orderId: number, status: string, opts?: { force?: boolean }) {
  const qs = opts?.force ? '?force=1' : '';
  const res = await fetch(`/api/bff/orders/${orderId}/status${qs}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as any;
}

async function fetchCouriers() {
  const qs = new URLSearchParams({ limit: '200', offset: '0', role: 'courier', isActive: 'true' });
  const res = await fetch(`/api/bff/admin/users?${qs.toString()}`, { cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return (data?.users ?? []) as CourierUser[];
}

async function assignCourier(orderId: number, courierId: number | null) {
  const res = await fetch(`/api/bff/admin/orders/${orderId}/assign-courier`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courierId }),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as any;
}

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

async function postReturn(orderId: number, body: { reason?: string; items?: Array<{ productId: number; quantity: number }> }) {
  const res = await fetch(`/api/bff/orders/${orderId}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as any;
}

function formatBackendError(err: unknown): string {
  const anyErr = err as { httpStatus?: number; data?: any };
  const data = anyErr?.data || {};
  const code = data?.error || data?.code;

  if (code === 'INVALID_TRANSITION') {
    const allowed: string[] = Array.isArray(data?.allowed) ? data.allowed : [];
    const allowedHuman = allowed.length ? allowed.map(labelStatus).join(', ') : '—';
    return `Нельзя перейти из "${labelStatus(data?.from)}" в "${labelStatus(data?.to)}". Разрешено: ${allowedHuman}.`;
  }
  if (code === 'ROLE_STATUS_NOT_ALLOWED') return `Роль "${data?.role}" не может установить статус "${labelStatus(data?.to)}".`;
  if (code === 'ROLE_NOT_ALLOWED') return 'Недостаточно прав для смены статуса.';
  if (code === 'ORDER_ALREADY_TERMINAL') return `Заказ уже в финальном статусе "${labelStatus(data?.from)}".`;
  if (code === 'ORDER_NOT_FOUND') return 'Заказ не найден.';
  if (code === 'UNKNOWN_STATUS') return `Неизвестный статус: "${String(data?.to ?? '')}".`;
  if (anyErr?.httpStatus === 401) return 'Не авторизован (токен отсутствует/истёк).';
  if (anyErr?.httpStatus === 403) return 'Недостаточно прав.';

  const msg = data?.message || data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Ошибка';
}

function formatReturnErr(e: unknown) {
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

function formatAssignCourierErr(e: unknown) {
  const anyErr = e as { httpStatus?: number; data?: any };
  if (anyErr?.httpStatus === 401) return 'Не авторизован.';
  if (anyErr?.httpStatus === 403) return 'Недостаточно прав (нужен admin/manager).';
  const code = anyErr?.data?.error;
  if (code === 'ORDER_NOT_FOUND') return 'Заказ не найден.';
  if (code === 'ORDER_ALREADY_TERMINAL') return 'Нельзя назначать курьера для финального заказа.';
  if (code === 'COURIER_NOT_FOUND') return 'Курьер не найден.';
  if (code === 'USER_NOT_COURIER') return 'Выбранный пользователь не является курьером.';
  if (code === 'COURIER_INACTIVE') return 'Курьер неактивен.';
  if (code === 'COURIER_ID_INVALID') return 'Некорректный courierId.';
  const msg = anyErr?.data?.message || anyErr?.data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Не удалось назначить курьера';
}

export function OrderRowActionsClient({ orderId, currentStatus }: { orderId: number; currentStatus: string }) {
  const router = useRouter();
  const { user } = useOpsSession();
  const role = (user?.role ?? 'unknown') as Role;

  const isPrivileged = role === 'admin' || role === 'manager';

  const eligibleForReturn =
    currentStatus === 'picked_up' || currentStatus === 'delivering' || currentStatus === 'delivered' || currentStatus === 'cancelled';

  const eligibleForCourierAssign = currentStatus === 'ready' || currentStatus === 'assigned_to_courier';

  const next = useMemo(() => NEXT_BY_STATUS[currentStatus] ?? null, [currentStatus]);

  const primaryNext = useMemo(() => {
    const isTerminal = currentStatus === 'delivered' || currentStatus === 'cancelled';
    if (isTerminal) return null;
    if (!next) return null;
    if (role === 'picker') {
      const allowed = new Set(['preparing', 'picking', 'ready']);
      return allowed.has(next) ? next : null;
    }
    if (role === 'courier') {
      const allowed = new Set(['picked_up', 'delivering', 'delivered']);
      return allowed.has(next) ? next : null;
    }
    if (isPrivileged) return next;
    return null;
  }, [currentStatus, isPrivileged, next, role]);

  const [menuOpen, setMenuOpen] = useState(false);

  // Status dialog (admin/manager)
  const [statusOpen, setStatusOpen] = useState(false);
  const [adminTarget, setAdminTarget] = useState(currentStatus);
  const [force, setForce] = useState(false);

  // Return dialog (admin/manager, eligible statuses)
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('ops_return');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const [summary, setSummary] = useState<ReturnSummaryItem[] | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({});

  // Courier assignment (admin/manager)
  const [courierOpen, setCourierOpen] = useState(false);
  const [couriersLoading, setCouriersLoading] = useState(false);
  const [couriersError, setCouriersError] = useState<string | null>(null);
  const [couriers, setCouriers] = useState<CourierUser[]>([]);
  const [courierQ, setCourierQ] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState<string>(''); // '' => unassign

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAdminTarget(currentStatus);
  }, [currentStatus]);

  const openStatusDialog = () => {
    setMenuOpen(false);
    setStatusOpen(true);
  };

  const openStatusDialogWithTarget = (target: string) => {
    setMenuOpen(false);
    setAdminTarget(target);
    setStatusOpen(true);
  };

  const openReturnDialog = async () => {
    setMenuOpen(false);
    setReturnError(null);
    setReturnOpen(true);
    if (items && summary) return;

    setReturnLoading(true);
    try {
      const [o, s] = await Promise.all([fetchOrder(orderId), fetchReturnSummary(orderId)]);
      const orderItems: OrderItem[] = Array.isArray(o?.order?.items) ? o.order.items : [];
      const sumItems: ReturnSummaryItem[] = Array.isArray(s?.items) ? s.items : [];

      const byProduct = new Map(sumItems.map((x) => [Number(x.productId), x]));
      const init: Record<number, number> = {};
      for (const it of orderItems) {
        const pid = Number(it.product_id);
        const qty = Number(it.quantity);
        if (Number.isFinite(pid) && pid > 0 && Number.isFinite(qty) && qty > 0) {
          init[pid] = 0;
          if (!byProduct.has(pid)) {
            byProduct.set(pid, { productId: pid, orderedQty: qty, returnedQty: 0, remainingQty: qty });
          }
        }
      }

      setItems(orderItems);
      setSummary(Array.from(byProduct.values()));
      setSelected(init);
    } catch (e) {
      setReturnError(formatReturnErr(e));
    } finally {
      setReturnLoading(false);
    }
  };

  const openCourierDialog = async () => {
    setMenuOpen(false);
    setCourierOpen(true);
    setCouriersError(null);
    if (couriers.length) return;
    setCouriersLoading(true);
    try {
      const list = await fetchCouriers();
      setCouriers(Array.isArray(list) ? list : []);
    } catch (e) {
      setCouriersError(formatAssignCourierErr(e));
      setCouriers([]);
    } finally {
      setCouriersLoading(false);
    }
  };

  const doAssignCourier = async () => {
    const toastId = `ops-order-${orderId}-courier`;
    toast.loading('Назначаю курьера…', { id: toastId });
    setBusy(true);
    try {
      const cid = selectedCourierId ? Number(selectedCourierId) : null;
      await assignCourier(orderId, cid !== null && Number.isFinite(cid) ? cid : null);
      setCourierOpen(false);
      router.refresh();
      toast.success('Курьер обновлён', {
        id: toastId,
        description: cid ? `#${orderId}: courier#${cid}` : `#${orderId}: снят`,
      });
    } catch (e) {
      toast.error('Не удалось обновить курьера', { id: toastId, description: formatAssignCourierErr(e) });
    } finally {
      setBusy(false);
    }
  };

  const run = async (status: string, opts?: { force?: boolean }) => {
    setBusy(true);
    const toastId = `ops-order-${orderId}-status`;
    toast.loading('Обновляю статус…', { id: toastId });
    try {
      const result = await patchStatus(orderId, status, opts);
      setStatusOpen(false);
      router.refresh();
      const from = result?.from ? labelStatus(String(result.from)) : labelStatus(currentStatus);
      const to = result?.to ? labelStatus(String(result.to)) : labelStatus(status);
      toast.success('Статус обновлён', { id: toastId, description: `#${orderId}: ${from} → ${to}` });
    } catch (e) {
      toast.error('Не удалось обновить статус', { id: toastId, description: formatBackendError(e) });
    } finally {
      setBusy(false);
    }
  };

  const selectedItems = Object.entries(selected)
    .map(([productId, quantity]) => ({ productId: Number(productId), quantity: Number(quantity) }))
    .filter((x) => Number.isFinite(x.productId) && x.productId > 0 && Number.isFinite(x.quantity) && x.quantity > 0);

  const doFullReturn = async () => {
    setReturnLoading(true);
    setReturnError(null);
    const toastId = `ops-order-${orderId}-return`;
    toast.loading('Оформляю возврат…', { id: toastId });
    try {
      await postReturn(orderId, { reason: returnReason });
      router.refresh();
      setReturnOpen(false);
      toast.success('Возврат оформлен', { id: toastId, description: `#${orderId}: полный возврат` });
    } catch (e) {
      const msg = formatReturnErr(e);
      setReturnError(msg);
      toast.error('Не удалось оформить возврат', { id: toastId, description: msg });
    } finally {
      setReturnLoading(false);
    }
  };

  const doPartialReturn = async () => {
    setReturnLoading(true);
    setReturnError(null);
    const toastId = `ops-order-${orderId}-return`;
    try {
      if (!selectedItems.length) {
        const msg = 'Выбери хотя бы один товар и количество.';
        setReturnError(msg);
        toast.error('Не удалось оформить возврат', { id: toastId, description: msg });
        return;
      }
      toast.loading('Оформляю возврат…', { id: toastId });
      await postReturn(orderId, { reason: returnReason, items: selectedItems });
      // refresh summary after partial return
      try {
        const s = await fetchReturnSummary(orderId);
        setSummary(Array.isArray(s?.items) ? s.items : []);
        setSelected((prev) => Object.fromEntries(Object.keys(prev).map((k) => [Number(k), 0])));
      } catch {
        // ignore
      }
      router.refresh();
      toast.success('Возврат оформлен', { id: toastId, description: `#${orderId}: частичный (${selectedItems.length} поз.)` });
    } catch (e) {
      const msg = formatReturnErr(e);
      setReturnError(msg);
      toast.error('Не удалось оформить возврат', { id: toastId, description: msg });
    } finally {
      setReturnLoading(false);
    }
  };

  const canOpenMenu = Boolean(user) && (role === 'picker' || role === 'courier' || isPrivileged);

  const filteredCouriers = useMemo(() => {
    const q = courierQ.trim().toLowerCase();
    if (!q) return couriers;
    return couriers.filter((c) => {
      const hay = `${c.id} ${c.email} ${c.name} ${c.phone ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [courierQ, couriers]);

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" disabled={!canOpenMenu || busy} data-ops-actions-trigger="true">
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!primaryNext || busy} onSelect={() => (primaryNext ? void run(primaryNext) : undefined)}>
            Далее: {primaryNext ? labelStatus(primaryNext) : '—'}
          </DropdownMenuItem>

          {isPrivileged ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={busy || !eligibleForCourierAssign} onSelect={() => void openCourierDialog()}>
                Назначить курьера…
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onSelect={openStatusDialog}>
                Установить статус…
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onSelect={() => openStatusDialogWithTarget('cancelled')}>
                Отменить…
              </DropdownMenuItem>
            </>
          ) : null}

          {isPrivileged && eligibleForReturn ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={returnLoading || busy} onSelect={() => void openReturnDialog()}>
                Возврат…
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Статус заказа #{orderId}</DialogTitle>
            <DialogDescription>Admin/manager: установить конкретный статус (для override можно включить force).</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold text-gray-600">Статус</div>
              <select
                className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm font-extrabold text-gray-900"
                value={adminTarget}
                onChange={(e) => setAdminTarget(e.target.value)}
                disabled={busy}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labelStatus(s)}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 select-none">
              <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} disabled={busy} />
              Force
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setStatusOpen(false)} disabled={busy}>
              Закрыть
            </Button>
            <Button
              onClick={() => void run(adminTarget, { force })}
              disabled={busy || !adminTarget || adminTarget === currentStatus}
              title={adminTarget === currentStatus ? 'Уже в этом статусе' : undefined}
            >
              Применить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={courierOpen} onOpenChange={setCourierOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Назначить курьера · заказ #{orderId}</DialogTitle>
            <DialogDescription>Назначение влияет на live‑очередь и фильтр “needs courier”.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold text-gray-600">Поиск по курьерам</div>
              <Input
                value={courierQ}
                onChange={(e) => setCourierQ(e.target.value)}
                placeholder="id / email / имя / телефон"
                disabled={couriersLoading || busy}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold text-gray-600">Курьер</div>
              <select
                className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm font-extrabold text-gray-900"
                value={selectedCourierId}
                onChange={(e) => setSelectedCourierId(e.target.value)}
                disabled={couriersLoading || busy}
              >
                <option value="">— Снять назначение —</option>
                {filteredCouriers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    #{c.id} · {(c.name || c.email) + (c.phone ? ` · ${c.phone}` : '')}
                  </option>
                ))}
              </select>
            </div>

            {couriersError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 text-sm">{couriersError}</div>
            ) : null}

            {couriersLoading ? <div className="text-sm text-gray-600">Загрузка списка курьеров…</div> : null}

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setCourierOpen(false)} disabled={busy}>
                Закрыть
              </Button>
              <Button onClick={() => void doAssignCourier()} disabled={busy || couriersLoading}>
                Применить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Возврат · заказ #{orderId}</DialogTitle>
            <DialogDescription>Идемпотентно: полный или частичный возврат на склад.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold text-gray-600">Причина</div>
              <Input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} disabled={returnLoading} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => void doFullReturn()} disabled={returnLoading}>
                Полный возврат
              </Button>
            </div>
          </div>

          {returnError ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 text-sm">{returnError}</div> : null}

          {returnLoading && !items ? <div className="mt-3 text-sm text-gray-600">Загрузка…</div> : null}

          {items && summary ? (
            <div className="mt-4 rounded-2xl border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Товар</TableHead>
                    <TableHead className="text-right">В заказе</TableHead>
                    <TableHead className="text-right">Возвращено</TableHead>
                    <TableHead className="text-right">Осталось</TableHead>
                    <TableHead className="text-right">Вернуть</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const pid = Number(it.product_id);
                    const orderedQty = Number(it.quantity);
                    const s = summary.find((x) => Number(x.productId) === pid);
                    const returnedQty = s ? Number(s.returnedQty) : 0;
                    const remainingQty = s ? Number(s.remainingQty) : Math.max(0, orderedQty - returnedQty);
                    const cur = selected[pid] ?? 0;
                    const maxQty = Math.max(0, remainingQty);
                    return (
                      <TableRow key={pid}>
                        <TableCell>
                          <div className="font-semibold text-gray-900">{it.product_name || `product#${pid}`}</div>
                          <div className="text-xs text-gray-500">#{pid}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-900">{orderedQty}</TableCell>
                        <TableCell className="text-right font-semibold text-gray-900">{returnedQty}</TableCell>
                        <TableCell className="text-right font-extrabold text-gray-900">{remainingQty}</TableCell>
                        <TableCell className="text-right">
                          <input
                            type="number"
                            min={0}
                            max={maxQty}
                            className="h-9 w-24 rounded-lg border border-gray-300 bg-white px-3 text-sm text-right"
                            value={cur}
                            disabled={returnLoading}
                            onChange={(e) => {
                              const v = Math.max(0, Math.min(maxQty, Math.floor(Number(e.target.value || 0))));
                              setSelected((s2) => ({ ...s2, [pid]: v }));
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-gray-600">
              Выбрано позиций: <span className="text-gray-900">{selectedItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setReturnOpen(false)} disabled={returnLoading}>
                Закрыть
              </Button>
              <Button onClick={() => void doPartialReturn()} disabled={returnLoading || selectedItems.length === 0}>
                Оформить частичный
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

