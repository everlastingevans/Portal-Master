'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ShieldCheck, ListChecks, Plus, CreditCard, Archive, MapPin, Download, SearchX } from 'lucide-react';
import PortalLoader from '@/components/PortalLoader';
import PortalShell from '@/components/portal/PortalShell';
import { useConfirm } from '@/components/portal/overlay';
import { useToast } from '@/components/ToastNotification';
import {
  Badge,
  BadgeTone,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  PageHeader,
  Segmented,
  TBody,
  THead,
  Table,
  Td,
  Th,
  Tr,
  buttonClasses,
} from '@/components/portal/ui';

type Filter = 'all' | 'ACTIVE' | 'PENDING' | 'CLOSED';

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Live', tone: 'success' },
  PENDING: { label: 'Awaiting payment', tone: 'warning' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
};

const normalise = (status?: string) => String(status || 'ACTIVE').toUpperCase();

function JobStatus({ status }: { status?: string }) {
  const s = STATUS[normalise(status)] || { label: String(status), tone: 'neutral' as BadgeTone };
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

function ListingsView({ jobs, applications, reload }: { jobs: any[]; applications: any[]; reload: () => Promise<void> }) {
  const askConfirm = useConfirm();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  const applicantCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const app of applications) counts[app.job_id] = (counts[app.job_id] || 0) + 1;
    return counts;
  }, [applications]);

  const count = (s: Filter) => (s === 'all' ? jobs.length : jobs.filter((j) => normalise(j.status) === s).length);
  const visible = filter === 'all' ? jobs : jobs.filter((j) => normalise(j.status) === filter);

  const handleCloseJob = async (job: any) => {
    const ok = await askConfirm({
      title: 'Close this listing?',
      description: `“${job.title}” will be marked as closed and stop being matched to new candidates. Existing applicants stay in your dashboard.`,
      confirmLabel: 'Close listing',
      tone: 'danger',
    });
    if (!ok) return;

    setBusyId(job.id);
    try {
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, status: 'CLOSED' }),
      });
      if (res.ok) {
        toast.success(`“${job.title}” is now closed.`);
        await reload();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(`We couldn’t close this listing${errData.error ? `: ${errData.error}` : '.'}`);
      }
    } catch (e) {
      toast.error('Something went wrong while closing the listing.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteJob = async (id: number, title: string) => {
    const ok = await askConfirm({
      title: 'Delete this listing?',
      description: `This permanently deletes “${title}”. This can’t be undone.`,
      confirmLabel: 'Delete listing',
      tone: 'danger',
    });
    if (!ok) return;

    setBusyId(id);
    try {
      const res = await fetch('/api/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success(`“${title}” has been deleted.`);
        await reload();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(`We couldn’t delete this listing${errData.error ? `: ${errData.error}` : '.'}`);
      }
    } catch (e) {
      toast.error('Something went wrong while deleting the listing.');
    } finally {
      setBusyId(null);
    }
  };

  const requestExport = () => {
    toast.info('Data export requested. We’ll email you a secure download link.');
  };

  const requestErasure = async () => {
    const ok = await askConfirm({
      title: 'Request account erasure?',
      description:
        'We will anonymise your hiring history and delete your business account. Our support team will contact you to confirm before anything is removed. This is irreversible once completed.',
      confirmLabel: 'Request erasure',
      tone: 'danger',
    });
    if (ok) toast.success('Erasure request received. Our support team will contact you to finalise it.');
  };

  const actions = (job: any) => {
    const status = normalise(job.status);
    const busy = busyId === job.id;
    return (
      <div className="flex items-center justify-end gap-1.5">
        {status === 'PENDING' && (
          <Link href={`/employer/payment?jobId=${job.id}`} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
            <CreditCard className="h-3.5 w-3.5" /> Pay to publish
          </Link>
        )}
        {status !== 'CLOSED' && (
          <Button size="sm" variant="secondary" icon={Archive} onClick={() => handleCloseJob(job)} disabled={busy}>
            Close
          </Button>
        )}
        <IconButton icon={Trash2} label={`Delete ${job.title}`} tone="danger" onClick={() => handleDeleteJob(job.id, job.title)} disabled={busy} />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage listings"
        description="Close a role when you've filled it, or delete listings you no longer need."
        actions={
          jobs.length > 0 && (
            <Link href="/employer/new" className={buttonClasses({ variant: 'primary' })}>
              <Plus className="h-4 w-4" /> Post a job
            </Link>
          )
        }
      />

      {jobs.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={ListChecks}
            title="No listings yet"
            description="Post your first role and it will appear here, along with its applicants."
            action={
              <Link href="/employer/new" className={buttonClasses({ variant: 'accent' })}>
                <Plus className="h-4 w-4" /> Post a job
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: count('all') },
              { value: 'ACTIVE', label: 'Live', count: count('ACTIVE') },
              { value: 'PENDING', label: 'Awaiting payment', count: count('PENDING') },
              { value: 'CLOSED', label: 'Closed', count: count('CLOSED') },
            ]}
          />

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table
              empty={
                visible.length === 0 && <EmptyState icon={SearchX} title="Nothing here" description="No listings have this status." />
              }
            >
              <THead>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th align="right">Applicants</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {visible.map((job) => (
                  <Tr key={job.id}>
                    <Td className="max-w-[320px]">
                      <p className="truncate font-medium text-brand-navy">{job.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {[job.company, job.location].filter(Boolean).join(' · ')}
                      </p>
                    </Td>
                    <Td>
                      <JobStatus status={job.status} />
                    </Td>
                    <Td align="right" className="tabular-nums text-brand-navy">
                      {applicantCounts[job.id] || 0}
                    </Td>
                    <Td align="right">{actions(job)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>

          {/* Mobile list */}
          <div className="space-y-3 md:hidden">
            {visible.length === 0 ? (
              <Card padded={false}>
                <EmptyState icon={SearchX} title="Nothing here" description="No listings have this status." />
              </Card>
            ) : (
              visible.map((job) => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-brand-navy">{job.title}</p>
                      {job.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </p>
                      )}
                    </div>
                    <JobStatus status={job.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">
                      <span className="font-medium tabular-nums text-brand-navy">{applicantCounts[job.id] || 0}</span> applicants
                    </span>
                    {actions(job)}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Privacy and POPIA */}
      <Card>
        <CardHeader
          title="Your data and POPIA"
          description="Under South Africa’s Protection of Personal Information Act you can request a copy of your business data, or ask us to erase your account and anonymise your hiring history."
          action={
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 sm:flex">
              <ShieldCheck className="h-4 w-4" />
            </span>
          }
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" icon={Download} onClick={requestExport}>
            Request data export
          </Button>
          <Button variant="ghost" onClick={requestErasure} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            Request account erasure
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function EmployerDeletePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  const router = useRouter();

  const loadData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const role = String(data.user?.role || '').toUpperCase();
          if (!data.user || (role !== 'EMPLOYER' && role !== 'CLIENT')) {
            router.push('/login');
            return;
          }
          setUser(data.user);

          // Fetch employer posted jobs
          const dashRes = await fetch('/api/employer/dashboard');
          if (dashRes.ok) {
            const dashData = await dashRes.json();
            setJobs(dashData.jobs || []);
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
    },
    [router],
  );

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
    return <PortalLoader portal="EMPLOYER" title="Loading your listings" />;
  }

  return (
    <PortalShell portal="employer" user={user} onLogout={handleLogout} title="Manage listings">
      <ListingsView jobs={jobs} applications={applications} reload={() => loadData(true)} />
    </PortalShell>
  );
}
