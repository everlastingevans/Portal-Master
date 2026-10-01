'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type OverrideResult = { success: boolean; data?: any; error?: string };

interface AdminContextType {
  data: any;
  /** True only until the first successful load; never flips back on refresh. */
  loading: boolean;
  /** True while a background refresh is in flight. */
  refreshing: boolean;
  lastSyncedAt: Date | null;
  user: any;
  /** Refreshes data in the background without unmounting the UI. */
  fetchDashboardData: () => Promise<void>;
  /** Runs a superadmin override action and refreshes data on success. */
  runOverride: (action: string, payload?: any) => Promise<OverrideResult>;
  handleLogout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const sessionRes = await fetch('/api/auth/me');
      if (!sessionRes.ok) {
        router.push('/login');
        return;
      }
      const sessionData = await sessionRes.json();
      const role = String(sessionData.user?.role || '').toUpperCase();
      if (!sessionData.user || role !== 'SUPERADMIN') {
        router.push('/login');
        return;
      }
      const res = await fetch('/api/superadmin/dashboard');
      if (res.ok) {
        const json = await res.json();
        // Prefer the real session identity over the API's placeholder user
        setData({ ...json, user: { ...json.user, ...sessionData.user } });
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const runOverride = useCallback(
    async (action: string, payload?: any): Promise<OverrideResult> => {
      try {
        const res = await fetch('/api/superadmin/overrides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Server error occurred');
        fetchDashboardData();
        return { success: true, data: result };
      } catch (err: any) {
        return { success: false, error: err.message || 'Something went wrong. Please try again.' };
      }
    },
    [fetchDashboardData],
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  return (
    <AdminContext.Provider
      value={{ data, loading, refreshing, lastSyncedAt, user: data?.user, fetchDashboardData, runOverride, handleLogout }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
