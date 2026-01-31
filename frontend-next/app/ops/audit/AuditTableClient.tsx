'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOpsSession } from '../_lib/opsSession';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type AuditEvent = {
  id: string | number;
  created_at: string;
  actor_user_id: number | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip: string | null;
  user_agent: string | null;
  meta: any;
};

type AuditResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  events: AuditEvent[];
};

function fmtTime(ts: string) {
  try {
    return new Date(ts).toLocaleString('ru-RU');
  } catch {
    return ts;
  }
}

function compactJson(v: any) {
  try {
    const s = JSON.stringify(v ?? {}, null, 0);
    if (s.length > 220) return s.slice(0, 220) + '…';
    return s;
  } catch {
    return String(v);
  }
}

function formatErr(e: unknown) {
  const anyErr = e as { httpStatus?: number; data?: any };
  if (anyErr?.httpStatus === 401) return 'Не авторизован (нужен admin/manager).';
  if (anyErr?.httpStatus === 403) return 'Доступ запрещён (нужен admin/manager).';
  const msg = anyErr?.data?.error || anyErr?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Ошибка';
}

async function fetchAudit(params: { q?: string; action?: string; entityType?: string; actorId?: string; limit: number; offset: number }) {
  const qs = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  if (params.q) qs.set('q', params.q);
  if (params.action) qs.set('action', params.action);
  if (params.entityType) qs.set('entityType', params.entityType);
  if (params.actorId) qs.set('actorId', params.actorId);

  const res = await fetch(`/api/bff/admin/audit?${qs.toString()}`, { cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as AuditResponse;
}

export function AuditTableClient() {
  const { user } = useOpsSession();
  const role = user?.role ?? null;
  const can = role === 'admin' || role === 'manager';

  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('');

  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AuditResponse | null>(null);

  const params = useMemo(
    () => ({
      q: q.trim() || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      actorId: actorId.trim() || undefined,
      limit,
      offset,
    }),
    [q, action, entityType, actorId, limit, offset]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAudit(params);
      setData(res);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!can) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [can, params]);

  const total = data?.total ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="font-extrabold text-gray-900">События</div>
        <div className="text-xs font-semibold text-gray-600">
          {loading ? 'обновление…' : 'ready'} · всего: <span className="text-gray-900">{total || '—'}</span>
        </div>
      </div>

      {!can ? (
        <div className="p-5 text-sm text-gray-700">
          Нужна роль <span className="font-semibold">admin/manager</span>.
        </div>
      ) : null}

      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4">
          <div className="text-xs font-semibold text-gray-600">Поиск</div>
          <Input
            className="mt-1 h-9 w-full text-sm"
            placeholder="action/entity/actor/id"
            value={q}
            onChange={(e) => {
              setOffset(0);
              setQ(e.target.value);
            }}
            disabled={!can}
          />
        </div>
        <div className="md:col-span-3">
          <div className="text-xs font-semibold text-gray-600">Action</div>
          <Input
            className="mt-1 h-9 w-full text-sm"
            placeholder="order.status.change"
            value={action}
            onChange={(e) => {
              setOffset(0);
              setAction(e.target.value);
            }}
            disabled={!can}
          />
        </div>
        <div className="md:col-span-3">
          <div className="text-xs font-semibold text-gray-600">Entity type</div>
          <Input
            className="mt-1 h-9 w-full text-sm"
            placeholder="order / user / dark_store"
            value={entityType}
            onChange={(e) => {
              setOffset(0);
              setEntityType(e.target.value);
            }}
            disabled={!can}
          />
        </div>
        <div className="md:col-span-2">
          <div className="text-xs font-semibold text-gray-600">Actor id</div>
          <Input
            className="mt-1 h-9 w-full text-sm"
            placeholder="например 1"
            value={actorId}
            onChange={(e) => {
              setOffset(0);
              setActorId(e.target.value);
            }}
            disabled={!can}
            inputMode="numeric"
          />
        </div>
      </div>

      {error ? (
        <div className="p-5 text-red-700 bg-red-50 border-b border-red-200">
          <div className="font-extrabold">Ошибка</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Время</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Meta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.events ?? []).map((e) => (
            <TableRow key={String(e.id)}>
              <TableCell className="text-gray-700 whitespace-nowrap">
                <div className="font-semibold text-gray-900">{fmtTime(e.created_at)}</div>
                <div className="text-[11px] text-gray-500">#{e.id}</div>
              </TableCell>
              <TableCell className="text-gray-700 whitespace-nowrap">
                <div className="font-extrabold text-gray-900">
                  {e.actor_role || '—'} {e.actor_user_id ? `#${e.actor_user_id}` : ''}
                </div>
                <div className="text-[11px] text-gray-500">{e.ip || '—'}</div>
              </TableCell>
              <TableCell className="text-gray-700">
                <div className="font-extrabold text-gray-900">{e.action}</div>
              </TableCell>
              <TableCell className="text-gray-700 whitespace-nowrap">
                <div className="font-semibold text-gray-900">
                  {e.entity_type} {e.entity_id ? `#${e.entity_id}` : ''}
                </div>
              </TableCell>
              <TableCell className="text-gray-700">
                <code className="text-[11px] text-gray-700">{compactJson(e.meta)}</code>
              </TableCell>
            </TableRow>
          ))}
          {(data?.events ?? []).length === 0 && can ? (
            <TableRow>
              <TableCell className="text-sm text-gray-600" colSpan={5}>
                Нет событий по фильтрам.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          limit <span className="font-extrabold text-gray-900">{limit}</span> · offset{' '}
          <span className="font-extrabold text-gray-900">{offset}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`rounded-xl border px-4 py-2 text-sm font-extrabold ${
              hasPrev ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
            disabled={!hasPrev}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
          >
            ← Назад
          </button>
          <button
            className={`rounded-xl border px-4 py-2 text-sm font-extrabold ${
              hasNext ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
            disabled={!hasNext}
            onClick={() => setOffset((o) => o + limit)}
          >
            Вперёд →
          </button>
        </div>
      </div>
    </div>
  );
}

