'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOpsSession } from '../_lib/opsSession';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

type UserRow = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

type UsersResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  users: UserRow[];
};

const ROLE_OPTIONS = ['customer', 'courier', 'picker', 'manager', 'admin'] as const;

async function fetchUsers(params: { q?: string; role?: string; isActive?: string }) {
  const qs = new URLSearchParams({ limit: '200', offset: '0' });
  if (params.q) qs.set('q', params.q);
  if (params.role) qs.set('role', params.role);
  if (params.isActive) qs.set('isActive', params.isActive);

  const res = await fetch(`/api/bff/admin/users?${qs.toString()}`, {
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as UsersResponse;
}

async function patchUser(userId: number, patch: { role?: string; is_active?: boolean }) {
  const res = await fetch(`/api/bff/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as { success: boolean; user: UserRow };
}

function formatError(e: unknown) {
  const anyErr = e as { httpStatus?: number; data?: any };
  if (anyErr?.httpStatus === 401) return 'Не авторизован (нужно войти под admin/manager).';
  if (anyErr?.httpStatus === 403) return 'Доступ запрещён (нужна роль admin/manager).';
  const msg = anyErr?.data?.error || anyErr?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  const details = anyErr?.data?.details;
  if (details && typeof details === 'object') {
    const fieldErrors = (details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    const firstField = fieldErrors && Object.values(fieldErrors)[0]?.[0];
    if (firstField) return firstField;
  }
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Не удалось загрузить пользователей';
}

function formatPatchError(e: unknown) {
  const anyErr = e as { httpStatus?: number; data?: any };
  if (anyErr?.httpStatus === 401) return 'Не авторизован.';
  if (anyErr?.httpStatus === 403) return 'Недостаточно прав (нужен admin).';
  const code = anyErr?.data?.error;
  if (code === 'CANNOT_DEMOTE_SELF') return 'Нельзя понизить собственную роль (защита от lock-out).';
  if (code === 'CANNOT_DEACTIVATE_SELF') return 'Нельзя деактивировать самого себя (защита от lock-out).';
  if (code === 'ROLE_INVALID') return 'Невалидная роль.';
  if (code === 'EMPTY_PATCH') return 'Нет изменений для сохранения.';
  if (code === 'USER_NOT_FOUND') return 'Пользователь не найден.';
  const msg = anyErr?.data?.message || anyErr?.data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Не удалось сохранить изменения';
}

function rolePill(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-indigo-100 text-indigo-800';
    case 'manager':
      return 'bg-purple-100 text-purple-800';
    case 'picker':
      return 'bg-amber-100 text-amber-900';
    case 'courier':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function UsersTableClient() {
  const { user } = useOpsSession();
  const meRole = user?.role ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [rowSaving, setRowSaving] = useState<Record<number, boolean>>({});
  const [rowError, setRowError] = useState<Record<number, string | null>>({});
  const [draftRole, setDraftRole] = useState<Record<number, string>>({});
  const [draftActive, setDraftActive] = useState<Record<number, boolean>>({});

  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState<string>(''); // '', 'true', 'false'

  const canAccess = useMemo(() => meRole === 'admin' || meRole === 'manager', [meRole]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers({ q: q.trim() || undefined, role: role || undefined, isActive: isActive || undefined });
      if (!res?.success) {
        throw { httpStatus: 400, data: res };
      }
      setData({
        ...res,
        users: Array.isArray(res.users) ? res.users : [],
        total: typeof res.total === 'number' ? res.total : (res.users?.length ?? 0),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : formatError(e);
      setError(msg);
      toast.error('Не удалось загрузить пользователей', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // initialize drafts from loaded data
    const users = data?.users ?? [];
    if (!users.length) return;
    setDraftRole((prev) => {
      const next = { ...prev };
      for (const u of users) {
        if (next[u.id] === undefined) next[u.id] = u.role;
      }
      return next;
    });
    setDraftActive((prev) => {
      const next = { ...prev };
      for (const u of users) {
        if (next[u.id] === undefined) next[u.id] = u.is_active;
      }
      return next;
    });
  }, [data]);

  const canEdit = meRole === 'admin';

  const saveRow = async (u: UserRow) => {
    const toastId = `ops-user-${u.id}-save`;
    setRowSaving((s) => ({ ...s, [u.id]: true }));
    setRowError((e) => ({ ...e, [u.id]: null }));
    toast.loading('Сохраняю…', { id: toastId });
    try {
      const nextRole = draftRole[u.id] ?? u.role;
      const nextActive = draftActive[u.id] ?? u.is_active;
      const patch: { role?: string; is_active?: boolean } = {};
      if (nextRole !== u.role) patch.role = nextRole;
      if (nextActive !== u.is_active) patch.is_active = nextActive;

      await patchUser(u.id, patch);

      await load();
      toast.success('Пользователь обновлён', { id: toastId, description: `${u.email}` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : formatPatchError(e);
      setRowError((r) => ({ ...r, [u.id]: msg }));
      toast.error('Не удалось сохранить', { id: toastId, description: msg });
    } finally {
      setRowSaving((s) => ({ ...s, [u.id]: false }));
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="font-extrabold text-gray-900">Список пользователей</div>
        <div className="text-xs font-semibold text-gray-600">
          Текущая роль: <span className="text-gray-900">{meRole ?? '—'}</span>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-600">Поиск</div>
          <Input
            className="h-9 text-sm"
            placeholder="email или имя"
            value={q}
            data-ops-hotkey="search"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-600">Роль</div>
          <select
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Все</option>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
            <option value="picker">picker</option>
            <option value="courier">courier</option>
            <option value="customer">customer</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-600">Активность</div>
          <select
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
          >
            <option value="">Все</option>
            <option value="true">Активные</option>
            <option value="false">Неактивные</option>
          </select>
        </div>

        <div className="flex-1" />

        <button
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
          disabled={loading || !canAccess}
          onClick={() => void load()}
          title={!canAccess ? 'Нужна роль admin/manager' : 'Обновить'}
        >
          {loading ? 'Загрузка…' : 'Обновить'}
        </button>
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
            <TableHead>Пользователь</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Активен</TableHead>
            <TableHead>Создан</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.users ?? []).map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="font-extrabold text-gray-900">{u.email}</div>
                <div className="text-xs text-gray-500">
                  #{u.id} · {u.name}
                  {u.phone ? ` · ${u.phone}` : ''}
                </div>
              </TableCell>
              <TableCell>
                {canEdit ? (
                  <select
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900"
                    value={draftRole[u.id] ?? u.role}
                    onChange={(e) => setDraftRole((r) => ({ ...r, [u.id]: e.target.value }))}
                    disabled={rowSaving[u.id]}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${rolePill(u.role)}`}>{u.role}</span>
                )}
              </TableCell>
              <TableCell>
                {canEdit ? (
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={draftActive[u.id] ?? u.is_active}
                      onChange={(e) => setDraftActive((a) => ({ ...a, [u.id]: e.target.checked }))}
                      disabled={rowSaving[u.id]}
                    />
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${
                        draftActive[u.id] ?? u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {draftActive[u.id] ?? u.is_active ? 'Да' : 'Нет'}
                    </span>
                  </label>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${
                      u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {u.is_active ? 'Да' : 'Нет'}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-gray-700">{new Date(u.created_at).toLocaleString('ru-RU')}</TableCell>
              <TableCell className="text-right align-top">
                {canEdit ? (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                      disabled={rowSaving[u.id]}
                      onClick={() => void saveRow(u)}
                      title="Сохранить изменения (admin)"
                    >
                      {rowSaving[u.id] ? 'Сохранение…' : 'Сохранить'}
                    </button>
                    {rowError[u.id] ? (
                      <div className="text-xs font-semibold text-red-600 max-w-[260px] text-right">{rowError[u.id]}</div>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-gray-400">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {(data?.users ?? []).length === 0 && canAccess ? (
            <TableRow>
              <TableCell className="text-sm text-gray-600" colSpan={5}>
                Нет пользователей по фильтрам.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Всего: <span className="font-extrabold text-gray-900">{data?.total ?? '—'}</span>
        </div>
        <div className="text-gray-600">
          Показано: <span className="font-extrabold text-gray-900">{(data?.users ?? []).length}</span>
        </div>
      </div>
    </div>
  );
}
