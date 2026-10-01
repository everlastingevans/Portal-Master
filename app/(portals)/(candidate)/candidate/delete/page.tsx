'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, CalendarDays, MapPin, ShieldCheck, Trash2, Download } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import PortalLoader from '@/components/PortalLoader';
import { useToast } from '@/components/ToastNotification';
import { useConfirm } from '@/components/portal/overlay';
import { Button, Card, CardHeader, EmptyState, PageHeader, StatusBadge, buttonClasses } from '@/components/portal/ui';

export default function CandidateDeletePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const router = useRouter();

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const sessionRes = await fetch('/api/auth/me');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        const role = String(sessionData.user?.role || '').toUpperCase();
        if (!sessionData.user || role !== 'CANDIDATE') {
          router.push('/login');
          return;
        }
        setUser(sessionData.user);

        // Load applications list
        const dashRes = await fetch('/api/candidate/dashboard');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setApplications(dashData.applications || []);
        }
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
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  if (loading || !user) {
    return <PortalLoader portal="CANDIDATE" title="Loading your applications" />;
  }

  return (
    <PortalShell portal="candidate" user={user} onLogout={handleLogout} title="Withdraw applications">
      <WithdrawContent applications={applications} reload={() => loadData(true)} />
    </PortalShell>
  );
}

/** Rendered inside PortalShell so it can use the shell's ConfirmProvider. */
function WithdrawContent({ applications, reload }: { applications: any[]; reload: () => void }) {
  const confirm = useConfirm();
  const { success, error, info } = useToast();
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const handleWithdrawApplication = async (jobId: number, title: string) => {
    const ok = await confirm({
      title: 'Withdraw this application?',
      description: `Your application for ${title} will be withdrawn and the employer will no longer consider it.`,
      confirmLabel: 'Withdraw',
      tone: 'danger',
    });
    if (!ok) return;

    setWithdrawingId(jobId);
    try {
      const res = await fetch('/api/candidate/apply', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        success('Application withdrawn.');
        reload(); // reload
      } else {
        error('We couldn’t withdraw that application. Please try again.');
      }
    } catch (e) {
      error('Something went wrong while withdrawing your application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete your account?',
      description:
        'This permanently deletes your LaunchPath account, CV and application history. It can’t be undone. Our support team will confirm by email before anything is erased.',
      confirmLabel: 'Request deletion',
      tone: 'danger',
    });
    if (ok) info('Deletion request sent. Our support team will confirm by email.');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Withdraw applications"
        description="Changed your mind about a role? You can withdraw your application here at any time."
      />

      <Card padded={false}>
        <div className="px-6 pt-6">
          <CardHeader
            title="Your applications"
            description={applications.length > 0 ? `${applications.length} application${applications.length === 1 ? '' : 's'}` : undefined}
          />
        </div>
        {applications.length > 0 ? (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {applications.map((app) => (
              <li key={app.id} className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/80">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-navy">{app.job?.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{app.job?.company}</span>
                      {app.job?.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {app.job.location}
                        </span>
                      )}
                      {app.applied_at && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> Applied{' '}
                          {new Date(app.applied_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <StatusBadge status={app.status} />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    loading={withdrawingId === app.job_id}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => handleWithdrawApplication(app.job_id, app.job?.title)}
                  >
                    Withdraw
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-t border-slate-100">
            <EmptyState
              icon={Briefcase}
              title="No active applications"
              description="When you apply for a role, it will show up here."
              action={
                <Link href="/candidate/dashboard?tab=Jobs" className={buttonClasses({ variant: 'primary' })}>
                  Find jobs for you
                </Link>
              }
            />
          </div>
        )}
      </Card>

      {/* POPIA */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/80">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-brand-navy">Your data and privacy</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Under the Protection of Personal Information Act (POPIA), you can ask for a copy of your data or ask us to delete your account and
              everything linked to it.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" icon={Download} onClick={() => success('Export requested. We’ll email you a copy of your data shortly.')}>
            Request my data
          </Button>
          <Button variant="ghost" icon={Trash2} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={handleDeleteAccount}>
            Delete my account
          </Button>
        </div>
      </Card>
    </div>
  );
}
