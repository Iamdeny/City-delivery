'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOpsSession } from '../../_lib/opsSession';
import { toast } from 'sonner';

async function patchStore(id: number, patch: any) {
  const res = await fetch(`/api/bff/admin/dark-stores/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as any;
}

function formatErr(e: unknown) {
  const anyErr = e as { httpStatus?: number; data?: any };
  const msg = anyErr?.data?.message || anyErr?.data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Ошибка';
}

export function WarehouseQuickActionsClient({
  storeId,
  isActive,
  latitude,
  longitude,
}: {
  storeId: number;
  isActive: boolean;
  latitude: string | number | null;
  longitude: string | number | null;
}) {
  const router = useRouter();
  const { user } = useOpsSession();
  const role = user?.role ?? null;
  const can = role === 'admin' || role === 'manager';

  const [loading, setLoading] = useState(false);

  if (!can) return null;

  const hasCoords = latitude !== null && longitude !== null;
  const mapHref = hasCoords ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;

  const toggle = async () => {
    setLoading(true);
    const toastId = `ops-store-${storeId}-toggle`;
    toast.loading('Обновляю склад…', { id: toastId });
    try {
      const next = !isActive;
      await patchStore(storeId, { is_active: next });
      router.refresh();
      toast.success('Склад обновлён', {
        id: toastId,
        description: `#${storeId}: ${next ? 'активирован' : 'деактивирован'}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : formatErr(e);
      toast.error('Не удалось обновить склад', { id: toastId, description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {mapHref ? (
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-900 border border-gray-300"
            title="Открыть координаты на карте"
          >
            Открыть на карте
          </a>
        ) : null}
        <button
          className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
          disabled={loading}
          onClick={() => void toggle()}
          title="Быстро переключить активность"
        >
          {loading ? '…' : isActive ? 'Деактивировать' : 'Активировать'}
        </button>
      </div>
    </div>
  );
}

