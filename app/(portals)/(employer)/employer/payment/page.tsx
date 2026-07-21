'use client';

import { useState, useEffect, useCallback, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, ShieldCheck, Mail, Users, CheckCircle, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import PortalSidebar from '@/components/PortalSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import PortalLoader from '@/components/PortalLoader';

function EmployerPaymentInner() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [payfast, setPayfast] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

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

      // Fetch checkout data (job + payfast configuration)
      const checkRes = await fetch(`/api/jobs/checkout?jobId=${jobId}`);
      if (!checkRes.ok) {
        const errData = await checkRes.json();
        setError(errData.error || 'Failed to load job details.');
        return;
      }

      const checkData = await checkRes.json();
      if (checkData.job?.status === 'ACTIVE') {
        // Already paid, redirect to success
        router.push(`/employer/payment/success?jobId=${jobId}`);
        return;
      }

      setJob(checkData.job);
      setPayfast(checkData.payfast);
    } catch (err: any) {
      console.error(err);
      setError('An error occurred while loading job checkout details.');
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

  const handleSimulatedPayment = async () => {
    if (!jobId || simulating) return;

    setSimulating(true);
    try {
      const res = await fetch('/api/jobs/pay-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: Number(jobId) }),
      });

      if (res.ok) {
        // Route to the confirmation screen
        router.push(`/employer/payment/success?jobId=${jobId}`);
      } else {
        const errData = await res.json();
        alert('Simulation failed: ' + errData.error);
      }
    } catch (err: any) {
      alert('An error occurred during simulation: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  if (loading || !user) {
    return <PortalLoader portal="EMPLOYER" title="Preparing payment gateway" />;
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
          <h1 className="text-xl font-bold dark:text-white">Activate Job Sourcing</h1>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-[#5D3FD3]/10 dark:bg-[#5D3FD3]/20 text-[#5D3FD3] dark:text-violet-300 px-3 py-1 rounded-full text-sm font-semibold border border-[#5D3FD3]/20 dark:border-[#5D3FD3]/30">
              <span className="w-2 h-2 bg-[#5D3FD3] dark:bg-[#5D3FD3] rounded-full animate-pulse"></span>
              {user?.role || 'EMPLOYER'}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Payment Main Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
          {error ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-6 rounded-2xl text-center">
              <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
              <Link
                href="/employer/dashboard"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Job Details & Sourcing Overview */}
              <div className="md:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                    Awaiting Activation
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {job?.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {job?.company} &bull; {job?.location}
                  </p>
                  
                  <div className="h-px bg-slate-150 dark:bg-slate-800 my-4" />
                  
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 font-mono">
                    Matching Deliverable
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="w-4 h-4 bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">✓</span>
                      <span>Our specialist team reviews your exact requirements.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="w-4 h-4 bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">✓</span>
                      <span>We source, vet, and check communication skills of matching junior talent.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="w-4 h-4 bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">✓</span>
                      <span>You receive a curated, high-fidelity candidate shortlist directly via email.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 p-5 rounded-2xl flex gap-3.5">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                    ℹ
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider font-mono">Flat Sourcing Rate</h5>
                    <p className="text-xs text-amber-700/90 dark:text-amber-500/90 leading-relaxed mt-1">
                      LaunchPath charges a simple, flat-rate of R20 once-off per role posted. We do not charge success/placement commissions, nor subscription commitments.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout Block */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-[#031535] text-white rounded-3xl p-6 border border-[#bdf500]/20 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#bdf500]/40" />

                  <h3 className="text-lg font-black text-white">Your role is ready for matching</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Pay R20 to activate the role and receive a curated shortlist of vetted candidates matched to your requirements.
                  </p>

                  <div className="h-px bg-slate-800 my-4" />

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Billing Amount</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#bdf500]">R20</span>
                      <span className="text-xs text-slate-300 font-semibold">once-off per role</span>
                    </div>
                  </div>

                  {/* Activation CTA */}
                  <div className="mt-6 space-y-3">
                    {payfast ? (
                      <form action={payfast.url} method="POST" className="w-full" target="_blank">
                        {Object.entries(payfast.data || {}).map(([key, value]) => (
                          <input key={key} type="hidden" name={key} value={value as string} />
                        ))}
                        <button
                          type="submit"
                          className="w-full bg-[#bdf500] hover:bg-[#aee000] text-slate-950 font-black py-3.5 px-4 rounded-xl text-center text-sm transition-all duration-300 hover:scale-[1.01] shadow-md shadow-[#bdf500]/5 flex items-center justify-center gap-2 cursor-pointer border-none"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay and Activate Role</span>
                        </button>
                      </form>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold py-3.5 px-4 rounded-xl text-center text-sm flex items-center justify-center gap-2"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing Gateway...</span>
                      </button>
                    )}
                    
                    <Link
                      href="/employer/dashboard"
                      className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl text-center block text-xs transition cursor-pointer animate-none"
                    >
                      Pay Later (Save Draft)
                    </Link>

                    {/* Payfast Sandbox WAF Warning */}
                    {/* <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1.5 text-left">
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Facing a 403 CloudFront Block?</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        Payfast&apos;s sandbox firewall (<code className="bg-black/30 px-1 py-0.5 rounded text-amber-400">sandbox.payfast.co.za</code>) blocks external request referrers using cloud domains (like Google Cloud&apos;s <code className="bg-black/30 px-1 py-0.5 rounded text-amber-400">*.run.app</code>).
                      </p>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        To easily bypass this external firewall limit, use the <span className="text-purple-400">Simulate Successful Payment</span> tool below.
                      </p>
                    </div> */}
                  </div>
                </div>

                {/* Developer / AI Studio sandbox helper */}
                {/* <div className="bg-slate-900/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200">
                      AI Studio Sandbox Helper
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Since live outbound bank callbacks might be restricted by local firewalls or private port mappings, use this simulator button to instantly activate the role and trigger your automated matching confirmation email.
                  </p>
                  
                  <button
                    onClick={handleSimulatedPayment}
                    disabled={simulating}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-500/10"
                  >
                    {simulating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Simulate Successful Payment</span>
                  </button>
                </div> */}
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EmployerPaymentPage() {
  return (
    <Suspense fallback={<PortalLoader portal="EMPLOYER" title="Loading Sourcing Gateway" />}>
      <EmployerPaymentInner />
    </Suspense>
  );
}
