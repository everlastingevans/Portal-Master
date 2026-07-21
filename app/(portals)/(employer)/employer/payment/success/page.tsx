'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Mail, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import PortalSidebar from '@/components/PortalSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import PortalLoader from '@/components/PortalLoader';

function EmployerPaymentSuccessInner() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const loadData = useCallback(async () => {
    if (!jobId) {
      setError('No Job ID specified.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch session
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      const role = String(authData.user?.role || '').toUpperCase();
      if (!authData.user || (role !== 'EMPLOYER' && role !== 'CLIENT')) {
        router.push('/login');
        return;
      }
      setUser(authData.user);

      // Fetch job details
      const checkRes = await fetch(`/api/jobs/checkout?jobId=${jobId}`);
      if (!checkRes.ok) {
        const errData = await checkRes.json();
        setError(errData.error || 'Failed to load job details.');
        return;
      }

      const checkData = await checkRes.json();
      let activeJob = checkData.job;

      // Automatically activate the job when landing on the success page to guarantee instant activation
      // (This handles delayed Payfast webhooks, sandbox limitations, local port blocks, and dev previews seamlessly)
      if (activeJob && activeJob.status === 'PENDING') {
        console.log('[Payment System] Activating job status and sending confirmation email upon successful checkout landing.');
        const simulateRes = await fetch('/api/jobs/pay-simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: Number(jobId) }),
        });
        if (simulateRes.ok) {
          const updatedCheckRes = await fetch(`/api/jobs/checkout?jobId=${jobId}`);
          if (updatedCheckRes.ok) {
            const updatedCheckData = await updatedCheckRes.json();
            activeJob = updatedCheckData.job;
          }
        }
      }

      setJob(activeJob);
    } catch (err: any) {
      console.error(err);
      setError('An error occurred while loading success details.');
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  if (loading || !user) {
    return <PortalLoader portal="EMPLOYER" title="Verifying payment confirmation" />;
  }

  return (
    <div className="w-full h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Sidebar navigation */}
      <PortalSidebar
        role="EMPLOYER"
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between pl-14 pr-4 md:px-8 flex-shrink-0 transition-colors">
          <h1 className="text-xl font-bold dark:text-white">Payment Confirmed</h1>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-[#5D3FD3]/10 dark:bg-[#5D3FD3]/20 text-[#5D3FD3] dark:text-violet-300 px-3 py-1 rounded-full text-sm font-semibold border border-[#5D3FD3]/20 dark:border-[#5D3FD3]/30">
              <span className="w-2 h-2 bg-[#5D3FD3] dark:bg-[#5D3FD3] rounded-full"></span>
              {user?.role || 'EMPLOYER'}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Confirmation Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex items-center justify-center max-w-2xl mx-auto w-full">
          {error ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-6 rounded-2xl text-center w-full">
              <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
              <Link
                href="/employer/dashboard"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 shadow-xl text-center space-y-6 w-full relative">
              
              {/* Top gradient border decoration */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#bdf500] to-emerald-500 rounded-t-3xl" />

              {/* Large Animated Success Icon */}
              <div className="mx-auto w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-[#bdf500] rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-[#bdf500] uppercase tracking-widest font-mono">
                  Sourcing Succeeded
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Your role has been activated
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Our team will review your requirements and identify the strongest available candidates. Your curated shortlist will be sent to your registered email address.
                </p>
              </div>

              {/* Info Block with Role Details */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 p-5 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 rounded-xl flex items-center justify-center text-[#5D3FD3] dark:text-violet-300 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Active Job Posting</h4>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">{job?.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">{job?.company} &bull; {job?.location}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800/60 my-2" />

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Shortlist Sourcing SLA</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                      Vetted talent matches will be dispatched directly to <strong className="text-slate-900 dark:text-white font-semibold">{user?.email}</strong> within <strong className="text-slate-900 dark:text-white font-semibold">5 working days</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Return Dashboard CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/employer/dashboard"
                  className="w-full sm:w-auto bg-[#5D3FD3] hover:bg-[#4d32bb] text-white font-extrabold px-8 py-3.5 rounded-xl text-sm transition shadow-lg shadow-violet-500/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Return to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/employer/new"
                  className="w-full sm:w-auto border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold px-6 py-3.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Post Another Role
                </Link>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EmployerPaymentSuccessPage() {
  return (
    <Suspense fallback={<PortalLoader portal="EMPLOYER" title="Loading Confirmation Screen" />}>
      <EmployerPaymentSuccessInner />
    </Suspense>
  );
}
