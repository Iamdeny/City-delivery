'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOpsSession } from '../_lib/opsSession';
import { Badge } from '@/components/ui/badge';

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

export function OpsHeader() {
  const { user, loading, error, logout } = useOpsSession();
  const role = user?.role ?? 'unknown';
  const canOps = role === 'admin' || role === 'manager';

  const [health, setHealth] = useState<{ lateCount: number | null; needsCourierCount: number | null }>({
    lateCount: null,
    needsCourierCount: null,
  });

  const loadHealth = async () => {
    if (!canOps) return;
    const res = await fetch('/api/bff/admin/orders?tab=active&limit=1&offset=0', { cache: 'no-store' });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) return;
    setHealth({
      lateCount: Number(data?.health?.lateCount ?? 0),
      needsCourierCount: Number(data?.health?.needsCourierCount ?? 0),
    });
  };

  useEffect(() => {
    if (!canOps) return;
    void loadHealth();
    const t = window.setInterval(() => void loadHealth(), 10000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canOps]);

  const kpis = useMemo(() => {
    if (!canOps) return null;
    const late = health.lateCount;
    const nc = health.needsCourierCount;
    return (
      <div className="flex items-center gap-2 mr-2">
        <Badge variant="danger" className="px-2 py-1 text-[11px] font-extrabold" title="Проблемные (late) прямо сейчас">
          late: {late === null ? '—' : late}
        </Badge>
        <Badge variant="purple" className="px-2 py-1 text-[11px] font-extrabold" title="Нужно назначить курьера (ready + courier_id is null)">
          courier: {nc === null ? '—' : nc}
        </Badge>
      </div>
    );
  }, [canOps, health.lateCount, health.needsCourierCount]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur pt-[var(--safe-top)]">
      <div className="px-3 sm:px-4 py-3 flex items-center justify-end gap-2">
        {kpis}
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
    </header>
  );
}

