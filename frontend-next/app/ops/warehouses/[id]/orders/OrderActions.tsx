'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOpsSession } from '../../../_lib/opsSession';

type Props = {
  orderId: number;
  currentStatus: string;
};

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

function labelStatus(s: string) {
  return STATUS_LABEL[s] ?? s;
}

async function patchStatus(orderId: number, status: string, opts?: { force?: boolean }) {
  const qs = opts?.force ? '?force=1' : '';
  const res = await fetch(`/api/bff/orders/${orderId}/status${qs}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { httpStatus: res.status, data };
  }
  return data as unknown;
}

function formatBackendError(err: unknown): string {
  // thrown object from patchStatus
  const anyErr = err as { httpStatus?: number; data?: any };
  const data = anyErr?.data || {};
  const code = data?.error || data?.code;

  if (code === 'INVALID_TRANSITION') {
    const allowed: string[] = Array.isArray(data?.allowed) ? data.allowed : [];
    const allowedHuman = allowed.length ? allowed.map(labelStatus).join(', ') : '—';
    return `Нельзя перейти из "${labelStatus(data?.from)}" в "${labelStatus(data?.to)}". Разрешено: ${allowedHuman}.`;
  }

  if (code === 'ROLE_STATUS_NOT_ALLOWED') {
    return `Роль "${data?.role}" не может установить статус "${labelStatus(data?.to)}".`;
  }

  if (code === 'ROLE_NOT_ALLOWED') {
    return 'Недостаточно прав для смены статуса.';
  }

  if (code === 'ORDER_ALREADY_TERMINAL') {
    return `Заказ уже в финальном статусе "${labelStatus(data?.from)}".`;
  }

  if (code === 'ORDER_NOT_FOUND') {
    return 'Заказ не найден.';
  }

  if (code === 'UNKNOWN_STATUS') {
    return `Неизвестный статус: "${String(data?.to ?? '')}".`;
  }

  if (anyErr?.httpStatus === 401) {
    return 'Не авторизован (токен отсутствует/истёк).';
  }

  if (anyErr?.httpStatus === 403) {
    return 'Недостаточно прав.';
  }

  // fallback
  const msg = data?.message || data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Ошибка обновления статуса';
}

function roleBadge(role: Role) {
  const map: Record<Role, { label: string; cls: string }> = {
    admin: { label: 'admin', cls: 'bg-indigo-100 text-indigo-800' },
    picker: { label: 'picker', cls: 'bg-amber-100 text-amber-900' },
    courier: { label: 'courier', cls: 'bg-blue-100 text-blue-800' },
    customer: { label: 'customer', cls: 'bg-gray-100 text-gray-700' },
    manager: { label: 'manager', cls: 'bg-purple-100 text-purple-800' },
    unknown: { label: 'unknown', cls: 'bg-gray-100 text-gray-700' },
  };
  return map[role] || map.unknown;
}

export function OrderActions({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useOpsSession();
  const role = (user?.role ?? 'unknown') as Role;
  const [adminTarget, setAdminTarget] = useState<string>(currentStatus);
  const [force, setForce] = useState(false);

  useEffect(() => {
    setAdminTarget(currentStatus);
  }, [currentStatus]);

  const next = useMemo(() => NEXT_BY_STATUS[currentStatus] ?? null, [currentStatus]);

  const actions = useMemo(() => {
    // role-specific primary actions
    const isTerminal = currentStatus === 'delivered' || currentStatus === 'cancelled';
    if (isTerminal) return { primary: [] as string[], canCancel: false, canForce: false, canAdminSelect: false };

    if (role === 'picker') {
      const allowed = new Set(['preparing', 'picking', 'ready']);
      const primary = next && allowed.has(next) ? [next] : [];
      return { primary, canCancel: false, canForce: false, canAdminSelect: false };
    }
    if (role === 'courier') {
      const allowed = new Set(['picked_up', 'delivering', 'delivered']);
      const primary = next && allowed.has(next) ? [next] : [];
      return { primary, canCancel: false, canForce: false, canAdminSelect: false };
    }
    if (role === 'admin' || role === 'manager') {
      const primary = next ? [next] : [];
      return { primary, canCancel: true, canForce: true, canAdminSelect: true };
    }

    return { primary: [], canCancel: false, canForce: false, canAdminSelect: false };
  }, [currentStatus, next, role]);

  const run = async (status: string, opts?: { force?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      await patchStatus(orderId, status, opts);

      router.refresh();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(formatBackendError(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const badge = roleBadge(role);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold ${badge.cls}`}>
            {badge.label}
          </span>
          <span className="text-[11px] font-semibold text-gray-500">#{orderId}</span>
        </div>

        {actions.canAdminSelect ? (
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-gray-900"
              value={adminTarget}
              disabled={loading}
              onChange={(e) => setAdminTarget(e.target.value)}
              title="Admin: установить конкретный статус"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelStatus(s)}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 select-none">
              <input
                type="checkbox"
                checked={force}
                disabled={loading}
                onChange={(e) => setForce(e.target.checked)}
              />
              Force
            </label>
            <button
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-50"
              disabled={loading || !adminTarget}
              onClick={() => run(adminTarget, { force })}
              title={force ? 'force=1 (override transitions)' : 'обычная смена статуса по правилам переходов'}
            >
              Применить
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          {actions.primary.map((s) => (
            <button
              key={s}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-50"
              disabled={loading}
              onClick={() => run(s)}
              title={`Перевести в: ${labelStatus(s)}`}
            >
              Далее → {labelStatus(s)}
            </button>
          ))}
          {actions.canCancel ? (
            <button
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-extrabold text-gray-900 disabled:opacity-50"
              disabled={loading}
              onClick={() => run('cancelled', { force })}
              title="Admin: отменить заказ"
            >
              Отменить
            </button>
          ) : null}
        </div>
      </div>
      {error ? <div className="text-xs font-semibold text-red-600">{error}</div> : null}
    </div>
  );
}

