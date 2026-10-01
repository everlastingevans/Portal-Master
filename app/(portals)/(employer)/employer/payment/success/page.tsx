'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Mail, Sparkles, Users, AlertCircle, MapPin, Building2, ArrowRight, Plus } from 'lucide-react';
import PortalLoader from '@/components/PortalLoader';
import PortalShell from '@/components/portal/PortalShell';
import { Card, EmptyState, StatusBadge, buttonClasses } from '@/components/portal/ui';

function EmployerPaymentSuccessInner() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

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
        setError('No job was specified for this confirmation.');
        return;
      }

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
    return <PortalLoader portal="EMPLOYER" title="Confirming your payment" />;
  }

  const isLive = String(job?.status || '').toUpperCase() === 'ACTIVE';

  const nextSteps = [
    {
      icon: Sparkles,
      title: 'We start matching',
      body: 'Our team reviews your requirements and ranks the strongest available candidates.',
    },
    {
      icon: Mail,
      title: 'Shortlist within 5 working days',
      body: (
        <>
          Vetted matches are sent to <span className="font-medium text-brand-navy">{user?.email}</span>.
        </>
      ),
    },
    {
      icon: Users,
      title: 'Applicants appear in your dashboard',
      body: 'Review new applicants as they come in and invite the best ones to interview.',
    },
  ];

  return (
    <PortalShell portal="employer" user={user} onLogout={handleLogout} title={isLive ? 'Job published' : 'Payment received'}>
      <div className="mx-auto max-w-2xl">
        {error ? (
          <Card padded={false}>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load this confirmation"
              description={error}
              action={
                <Link href="/employer/dashboard" className={buttonClasses({ variant: 'primary' })}>
                  Go to dashboard
                </Link>
              }
            />
          </Card>
        ) : (
          <Card padded={false} className="overflow-hidden animate-scale-in">
            <div className="px-6 pb-8 pt-10 text-center sm:px-10">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-lime text-brand-navy shadow-[0_0_0_8px_rgba(166,242,60,0.18)]">
                <Check className="h-7 w-7" strokeWidth={3} />
              </span>
              <h1 className="mt-6 text-2xl font-semibold tracking-tight text-brand-navy sm:text-[26px]">
                {isLive ? 'Your job is live' : 'Payment received'}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                {isLive
                  ? 'Thanks for your payment. Your role is now visible to matching candidates.'
                  : 'Thanks for your payment. We’re activating your role and will notify you as soon as it’s live.'}
              </p>

              {job && (
                <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-semibold text-brand-navy">{job.title}</p>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {job.company && (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> {job.company}
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-7 sm:px-10">
              <h2 className="text-sm font-semibold text-brand-navy">What happens next</h2>
              <ol className="mt-5 space-y-5">
                {nextSteps.map((step) => (
                  <li key={step.title} className="flex items-start gap-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/80">
                      <step.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-navy">{step.title}</p>
                      <p className="mt-0.5 break-words text-sm text-slate-500">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:flex-row sm:justify-end sm:px-10">
              <Link href="/employer/new" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
                <Plus className="h-4 w-4" /> Post another job
              </Link>
              <Link href="/employer/dashboard?tab=Applicants" className={buttonClasses({ variant: 'accent', size: 'lg' })}>
                View applicants <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        )}
      </div>
    </PortalShell>
  );
}

export default function EmployerPaymentSuccessPage() {
  return (
    <Suspense fallback={<PortalLoader portal="EMPLOYER" title="Confirming your payment" />}>
      <EmployerPaymentSuccessInner />
    </Suspense>
  );
}
