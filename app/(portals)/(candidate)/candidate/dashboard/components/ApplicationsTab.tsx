'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, CalendarClock, Check, CalendarX2, RefreshCw, Search, MapPin, ListFilter } from 'lucide-react';
import { useConfirm } from '@/components/portal/overlay';
import { Badge, Button, Card, EmptyState, PageHeader, Segmented, StatusBadge, buttonClasses } from '@/components/portal/ui';
import { CompanyLogo } from './DashboardHelpers';

export interface ApplicationsTabProps {
  applications: any[];
  handleUpdateInterview: (interviewId: number, status: string) => Promise<void>;
  /** Optional: lets empty states jump to another dashboard tab. */
  setActiveTab?: (tab: string) => void;
}

type Filter = 'all' | 'active' | 'interviews' | 'closed';

const CLOSED_STATUSES = ['HIRED', 'REJECTED', 'WITHDRAWN', 'CLOSED', 'DECLINED', 'CANCELLED'];

const norm = (s?: string | null) => String(s || '').toUpperCase();
const isClosed = (app: any) => CLOSED_STATUSES.includes(norm(app.status));
const hasInterviews = (app: any) => norm(app.status) === 'INTERVIEWING' || (Array.isArray(app.interviews) && app.interviews.length > 0);

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateTime = (iso?: string) => {
  if (!iso) return 'Time to be confirmed';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Time to be confirmed';
  return d.toLocaleString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

function ApplicationStatus({ status }: { status?: string }) {
  // "Hired" is the best possible outcome, so give it the success tone explicitly.
  if (norm(status) === 'HIRED') {
    return (
      <Badge tone="success" dot>
        Hired
      </Badge>
    );
  }
  return <StatusBadge status={status} />;
}

export default function ApplicationsTab({ applications = [], handleUpdateInterview, setActiveTab }: ApplicationsTabProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const confirmDialog = useConfirm();

  const counts = useMemo(
    () => ({
      all: applications.length,
      active: applications.filter((a) => !isClosed(a)).length,
      interviews: applications.filter(hasInterviews).length,
      closed: applications.filter(isClosed).length,
    }),
    [applications],
  );

  const visible = useMemo(() => {
    switch (filter) {
      case 'active':
        return applications.filter((a) => !isClosed(a));
      case 'interviews':
        return applications.filter(hasInterviews);
      case 'closed':
        return applications.filter(isClosed);
      default:
        return applications;
    }
  }, [applications, filter]);

  const respond = async (interviewId: number, status: string) => {
    if (status === 'Cancelled') {
      const ok = await confirmDialog({
        title: 'Decline this interview?',
        description: 'The employer will be told you cannot make it. If you would like a different time, ask to reschedule instead.',
        confirmLabel: 'Decline interview',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setBusy(`${interviewId}-${status}`);
    try {
      await handleUpdateInterview(interviewId, status);
    } finally {
      setBusy(null);
    }
  };

  const browseAction = setActiveTab ? (
    <Button variant="primary" icon={Search} onClick={() => setActiveTab('AllJobs')}>
      Browse jobs
    </Button>
  ) : (
    <Link href="/candidate/dashboard?tab=AllJobs" className={buttonClasses({ variant: 'primary' })}>
      <Search className="h-4 w-4" /> Browse jobs
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Track every role you have applied for and respond to interview invites."
        actions={
          applications.length > 0 ? (
            <Link href="/candidate/delete" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
              Withdraw an application
            </Link>
          ) : undefined
        }
      />

      {applications.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="When you apply for a role, you can follow its progress here. Find a role that suits you to get started."
            action={browseAction}
          />
        </Card>
      ) : (
        <>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'interviews', label: 'Interviews', count: counts.interviews },
              { value: 'closed', label: 'Closed', count: counts.closed },
            ]}
          />

          {visible.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon={ListFilter}
                title="Nothing here yet"
                description={
                  filter === 'interviews'
                    ? 'Interview invites from employers will show up here.'
                    : filter === 'closed'
                      ? 'Applications that have been finalised will show up here.'
                      : 'You have no active applications right now.'
                }
                action={
                  <Button variant="secondary" onClick={() => setFilter('all')}>
                    Show all applications
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {visible.map((app: any) => {
                  const job = app.job || {};
                  const interviews: any[] = Array.isArray(app.interviews) ? app.interviews : [];
                  return (
                    <li key={app.id} className="p-5 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <CompanyLogo companyName={job.company} logo={job.tenantLogo} />
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-brand-navy">{job.title || 'Untitled role'}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-500">
                              <span className="truncate">{job.company}</span>
                              {job.location && (
                                <>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-400" aria-hidden="true" />
                                    {job.location}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pl-[58px] sm:pl-0">
                          <span className="whitespace-nowrap text-xs text-slate-500">Applied {formatDate(app.applied_at)}</span>
                          <ApplicationStatus status={app.status} />
                        </div>
                      </div>

                      {interviews.length > 0 && (
                        <div className="mt-4 space-y-2 sm:pl-[58px]">
                          {interviews.map((iv: any) => {
                            const proposed = norm(iv.status) === 'PROPOSED';
                            return (
                              <div
                                key={iv.id}
                                className="flex flex-col gap-3 rounded-xl bg-slate-50/80 p-4 ring-1 ring-inset ring-slate-200/70 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex min-w-0 items-start gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-navy ring-1 ring-inset ring-slate-200">
                                    <CalendarClock className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium text-brand-navy">
                                        {proposed ? 'Interview invite' : 'Interview'} · {formatDateTime(iv.proposed_time)}
                                      </p>
                                      <StatusBadge status={iv.status} />
                                    </div>
                                    {iv.notes && <p className="mt-1 text-sm leading-relaxed text-slate-600">{iv.notes}</p>}
                                  </div>
                                </div>
                                {proposed && (
                                  <div className="flex flex-wrap gap-2 md:shrink-0">
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      icon={Check}
                                      loading={busy === `${iv.id}-Confirmed`}
                                      disabled={!!busy}
                                      onClick={() => respond(iv.id, 'Confirmed')}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      icon={RefreshCw}
                                      loading={busy === `${iv.id}-Rescheduled`}
                                      disabled={!!busy}
                                      onClick={() => respond(iv.id, 'Rescheduled')}
                                    >
                                      Reschedule
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      icon={CalendarX2}
                                      loading={busy === `${iv.id}-Cancelled`}
                                      disabled={!!busy}
                                      onClick={() => respond(iv.id, 'Cancelled')}
                                      className="hover:bg-rose-50 hover:text-rose-700"
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
