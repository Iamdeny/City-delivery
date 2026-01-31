'use client';

import Link from 'next/link';
import { useOpsSession } from './_lib/opsSession';

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

export function OpsTopBarClient() {
  const { user, loading, error, logout } = useOpsSession();

  const role = user?.role ?? 'unknown';
  const canOps = role === 'admin' || role === 'manager';

  return (
    <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/ops/warehouses" className="text-sm font-extrabold text-gray-900 hover:text-gray-700">
            Склады
          </Link>
          <Link href="/ops/orders" className="text-sm font-extrabold text-gray-900 hover:text-gray-700">
            Живая очередь
          </Link>
          <Link href="/ops/users" className="text-sm font-extrabold text-gray-900 hover:text-gray-700">
            Пользователи
          </Link>
          <Link href="/ops/audit" className="text-sm font-extrabold text-gray-900 hover:text-gray-700">
            Аудит
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${rolePill(role)}`}>
            {loading ? '…' : role}
          </span>
          <span className="text-xs font-semibold text-gray-600">
            {loading ? 'проверка…' : error ? error : user ? user.email : '—'}
          </span>
          <button
            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-extrabold text-gray-900 disabled:opacity-50"
            disabled={loading || !user}
            onClick={() => void logout()}
            title="Выйти"
          >
            Выйти
          </button>
        </div>
      </div>

      {!loading && user && !canOps ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Доступ к Ops ограничен. Нужна роль <span className="font-extrabold">admin/manager</span>.
          </div>
        </div>
      ) : null}
    </div>
  );
}

