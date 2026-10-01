'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck, Mail, Check, AlertCircle, MapPin, Building2, ArrowLeft } from 'lucide-react';
import PortalLoader, { Spinner } from '@/components/PortalLoader';
import PortalShell from '@/components/portal/PortalShell';
import { useToast } from '@/components/ToastNotification';
import { Badge, Button, Card, EmptyState, PageHeader, buttonClasses } from '@/components/portal/ui';

const INCLUDED = [
  'Our specialist team reviews your exact requirements.',
  'We source and vet matching candidates, including their communication skills.',
  'You receive a curated shortlist by email, and applicants in your dashboard.',
];

function EmployerPaymentInner() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [payfast, setPayfast] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const router = useRouter();
  const toast = useToast();

  const loadData = useCallback(async () => {
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

      if (!jobId) {
        setError('No job was specified for this payment.');
        return;
      }

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

  // Sandbox helper for activating a job without PayFast. Not rendered (its button was already commented out); kept for dev use.
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
        toast.error(`Simulated payment failed: ${errData.error}`);
      }
    } catch (err: any) {
      toast.error(`Simulated payment failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (loading || !user) {
    return <PortalLoader portal="EMPLOYER" title="Preparing secure checkout" />;
  }

  return (
    <PortalShell portal="employer" user={user} onLogout={handleLogout} title="Publish your job">
      {error ? (
        <Card className="mx-auto max-w-xl" padded={false}>
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load this checkout"
            description={error}
            action={
              <Link href="/employer/dashboard" className={buttonClasses({ variant: 'primary' })}>
                Go to dashboard
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="space-y-4">
            <Link href="/employer/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-navy">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
            <PageHeader
              title="Publish your job"
              description="One payment and your role goes live. We start matching candidates as soon as payment clears."
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
            {/* Role and what's included */}
            <div className="space-y-6 lg:col-span-3">
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">Job post</p>
                    <h2 className="mt-1 break-words text-lg font-semibold tracking-tight text-brand-navy">{job?.title}</h2>
                  </div>
                  <Badge tone="warning" dot>
                    Awaiting payment
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
                  {job?.company && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-slate-400" /> {job.company}
                    </span>
                  )}
                  {job?.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-400" /> {job.location}
                    </span>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-brand-navy">What&apos;s included</h3>
                  <ul className="mt-4 space-y-3">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-brand-lime">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card className="bg-slate-50/60">
                <h3 className="text-sm font-semibold text-brand-navy">Simple, flat pricing</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  LaunchPath charges a flat R1,999 once-off per role. There are no placement commissions and no subscription.
                </p>
              </Card>
            </div>

            {/* Order summary and payment */}
            <div className="lg:sticky lg:top-8 lg:col-span-2">
              <Card padded={false} className="overflow-hidden">
                <div className="p-6">
                  <h2 className="text-[15px] font-semibold text-brand-navy">Order summary</h2>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="min-w-0 text-slate-600">
                        Job post
                        <span className="block truncate text-xs text-slate-400">{job?.title}</span>
                      </dt>
                      <dd className="shrink-0 font-medium tabular-nums text-brand-navy">R1,999</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-600">Placement fees</dt>
                      <dd className="tabular-nums text-slate-500">R0</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-slate-100 pt-5">
                    <span className="text-sm font-medium text-brand-navy">Total due today</span>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums text-brand-navy">R1,999</span>
                  </div>
                  <p className="mt-1 text-right text-xs text-slate-500">Once-off per role</p>

                  <div className="mt-6 space-y-3">
                    {payfast ? (
                      <form action={payfast.url} method="POST" className="w-full" target="_blank" onSubmit={() => setRedirecting(true)}>
                        {Object.entries(payfast.data || {}).map(([key, value]) => (
                          <input key={key} type="hidden" name={key} value={value as string} />
                        ))}
                        <Button type="submit" variant="accent" size="lg" fullWidth icon={Lock}>
                          Pay R1,999
                        </Button>
                      </form>
                    ) : (
                      <div
                        role="status"
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-500"
                      >
                        <Spinner className="h-4 w-4" />
                        Connecting to secure payment…
                      </div>
                    )}

                    {redirecting && (
                      <p className="text-center text-xs text-slate-500" role="status">
                        PayFast opened in a new tab. Once you&apos;ve paid, you&apos;ll see a confirmation there.
                      </p>
                    )}

                    <Link href="/employer/dashboard" className={buttonClasses({ variant: 'secondary', fullWidth: true })}>
                      Pay later and save as draft
                    </Link>
                  </div>
                </div>

                <ul className="space-y-2.5 border-t border-slate-100 bg-slate-50/60 px-6 py-5 text-xs text-slate-500">
                  <li className="flex items-start gap-2.5">
                    <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" />
                    Secure payment by PayFast. We never see or store your card details.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" />
                    Your data is handled in line with POPIA.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Mail className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 break-words">
                      A receipt is emailed to <span className="font-medium text-slate-600">{user?.email}</span>.
                    </span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

export default function EmployerPaymentPage() {
  return (
    <Suspense fallback={<PortalLoader portal="EMPLOYER" title="Preparing secure checkout" />}>
      <EmployerPaymentInner />
    </Suspense>
  );
}
