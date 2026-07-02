'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, Briefcase, RefreshCw } from 'lucide-react';
import CandidateDashboard from './CandidateDashboard';

export default function CandidateDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const router = useRouter();

  const loadingSteps = useMemo(() => [
    { text: 'Verifying credentials...', icon: ShieldCheck, color: 'text-emerald-500' },
    { text: 'Syncing talent profile...', icon: Sparkles, color: 'text-blue-500 animate-pulse' },
    { text: 'Analyzing active market vacancies...', icon: Briefcase, color: 'text-violet-550 dark:text-violet-400' },
    { text: 'Finalizing your matches...', icon: RefreshCw, color: 'text-blue-500 animate-spin' },
  ], []);

  // Dynamic status text update
  useEffect(() => {
    if (!loading && data) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading, data, loadingSteps.length]);

  const fetchDashboardData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const sessionRes = await fetch('/api/auth/me');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        const role = String(sessionData.user?.role || '').toUpperCase();
        if (!sessionData.user || role !== 'CANDIDATE') {
          router.push('/login');
          return;
        }
        const res = await fetch('/api/candidate/dashboard');
        if (res.ok) setData(await res.json());
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  if (loading || !data) {
    return (
      <div className="h-screen w-full bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 select-none transition-colors duration-500 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo.svg" 
            alt="Company Logo" 
            className="w-16 h-16 animate-pulse"
          />
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return <CandidateDashboard data={data} user={data.user} onRefresh={fetchDashboardData} onLogout={handleLogout} />;
}
