'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { OpsSessionProviderInternal, type OpsSession, type OpsUser } from './_lib/opsSession';

async function fetchMe(): Promise<OpsUser | null> {
  const res = await fetch('/api/auth/me', { cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) return null;
  return (data?.user ?? null) as OpsUser | null;
}

export function OpsSessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<OpsUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await fetchMe();
      setUser(me);
      if (!me) setError('Не авторизован');
    } catch (e) {
      setUser(null);
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login?next=/ops/warehouses';
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: OpsSession = useMemo(
    () => ({ loading, user, error, refresh, logout }),
    [loading, user, error, refresh, logout]
  );

  return <OpsSessionProviderInternal value={value}>{children}</OpsSessionProviderInternal>;
}

