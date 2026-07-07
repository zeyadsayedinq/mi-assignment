import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface QuotaSnapshot {
  plan: string;
  limit: number;
  missionsUsed: number;
  remaining: number;
  bonus: number;
  unlimited: boolean;
  expiresAt: string | null;
}

interface QuotaContextValue {
  quota: QuotaSnapshot | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const QuotaContext = createContext<QuotaContextValue>({
  quota: null,
  loading: false,
  refresh: async () => {},
});

export function QuotaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) { setQuota(null); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/check-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, peek: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {
      // Fail soft — leave previous snapshot in place
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load on auth change
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <QuotaContext.Provider value={{ quota, loading, refresh }}>
      {children}
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  return useContext(QuotaContext);
}
