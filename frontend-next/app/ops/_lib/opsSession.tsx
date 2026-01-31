'use client';

import { createContext, useContext } from 'react';

export type OpsUser = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: 'customer' | 'courier' | 'picker' | 'manager' | 'admin';
};

export type OpsSession = {
  loading: boolean;
  user: OpsUser | null;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<OpsSession | null>(null);

export function OpsSessionProviderInternal({ value, children }: { value: OpsSession; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOpsSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOpsSession must be used within OpsSessionProvider');
  return v;
}

