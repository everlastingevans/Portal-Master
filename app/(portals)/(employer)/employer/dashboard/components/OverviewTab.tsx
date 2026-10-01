'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Briefcase,
  Users,
  Inbox,
  CalendarClock,
  Pencil,
  Lock,
  CreditCard,
  ArrowRight,
  FileText,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  StatCard,
  Badge,
  StatusBadge,
  MatchScore,
  Button,
  buttonClasses,
  IconButton,
  SearchInput,
  Segmented,
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td,
  Identity,
  EmptyState,
  cx,
} from '@/components/portal/ui';

interface OverviewTabProps {
  jobs: any[];
  applications: any[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredJobs: any[];
  handleStartEdit: (job: any) => void;
  setSelectedJobFilter: (id: any) => void;
  setActiveTab: (tab: string) => void;
  /** Optional: open an applicant's profile straight from the overview. */
  setSelectedApplicant?: (app: any) => void;
  /** Optional: used to hide candidate details for roles that are still locked. */
  isJobUnlocked?: (jobId: any) => boolean;
}

type JobFilter = 'all' | 'ACTIVE' | 'PENDING' | 'CLOSED';

const isAwaitingReview = (a: any) =>
  (!a.status || a.status === 'Pending') && (!a.interviews || a.interviews.length === 0);

function formatSalary(job: any) {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: any) => `R${Number(n).toLocaleString('en-ZA')}`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  if (job.salary_min) return `From ${fmt(job.salary_min)}`;
  return `Up to ${fmt(job.salary_max)}`;
}

function formatDateTime(value: any) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: any) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function JobStatus({ status }: { status?: string }) {
  if (status === 'PENDING') {
    return (
      <Badge tone="warning" dot>
        Awaiting payment
      </Badge>
    );
  }
  if (!status || status === 'ACTIVE') {
    return (
      <Badge tone="success" dot>
        Live
      </Badge>
    );
  }
  return <StatusBadge status={status} />;
}

export default function OverviewTab({
  jobs = [],
  applications = [],
  searchQuery,
  setSearchQuery,
  filteredJobs = [],
  handleStartEdit,
  setSelectedJobFilter,
  setActiveTab,
  setSelectedApplicant,
  isJobUnlocked,
}: OverviewTabProps) {
  const [jobFilter, setJobFilter] = useState<JobFilter>('all');

  const unlocked = (jobId: any) => {
    if (isJobUnlocked) return isJobUnlocked(jobId);
    const job = jobs.find((j: any) => String(j.id) === String(jobId));
    return job ? job.status === 'ACTIVE' : false;
  };

  const stats = useMemo(() => {
    const now = Date.now();
    const allInterviews = (applications || []).flatMap((a: any) =>
      (a.interviews || []).map((iv: any) => ({ ...iv, application: a }))
    );
    const upcoming = allInterviews
      .filter((iv: any) => new Date(iv.proposed_time).getTime() >= now && String(iv.status).toLowerCase() !== 'cancelled')
      .sort((a: any, b: any) => new Date(a.proposed_time).getTime() - new Date(b.proposed_time).getTime());
    return {
      live: jobs.filter((j: any) => j.status === 'ACTIVE').length,
      awaitingPayment: jobs.filter((j: any) => j.status === 'PENDING').length,
      applicants: (applications || []).length,
      awaitingReview: (applications || []).filter(isAwaitingReview).length,
      interviewsTotal: allInterviews.length,
      upcoming,
    };
  }, [jobs, applications]);

  const countsByJob = useMemo(() => {
    const map: Record<string, { total: number; fresh: number }> = {};
    (applications || []).forEach((a: any) => {
      const key = String(a.job_id);
      map[key] = map[key] || { total: 0, fresh: 0 };
      map[key].total += 1;
      if (isAwaitingReview(a)) map[key].fresh += 1;
    });
    return map;
  }, [applications]);

  const visibleJobs = filteredJobs.filter((j: any) => jobFilter === 'all' || (j.status || 'ACTIVE') === jobFilter);

  const latestApplicants = useMemo(
    () =>
      (applications || [])
        .filter((a: any) => unlocked(a.job_id))
        .sort((a: any, b: any) => new Date(b.applied_at || 0).getTime() - new Date(a.applied_at || 0).getTime())
        .slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applications, jobs, isJobUnlocked]
  );

  const openApplicants = (jobId: any) => {
    setSelectedJobFilter(jobId);
    setActiveTab('Applicants');
  };

  const openApplicant = (app: any) => {
    setSelectedJobFilter(app.job_id);
    setSelectedApplicant?.(app);
    setActiveTab('Applicants');
  };

  const postJobLink = (
    <Link href="/employer/new" className={buttonClasses({ variant: 'accent' })}>
      <Plus className="h-4 w-4" />
      Post a job
    </Link>
  );

  /* ---------------------------- First-time employer --------------------------- */
  if (jobs.length === 0) {
    const steps = [
      { icon: FileText, title: 'Describe the role', text: 'Add the title, must-have skills and salary range.' },
      { icon: CreditCard, title: 'Activate it', text: 'A once-off R1,999 per role. No subscriptions or placement fees.' },
      { icon: Sparkles, title: 'Review matched applicants', text: 'See each candidate’s match score, CV and interview recording.' },
    ];
    return (
      <div className="space-y-8">
        <PageHeader title="Hiring overview" description="Post your first role to start receiving matched applicants." />
        <Card className="overflow-hidden" padded={false}>
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="p-6 sm:p-10 lg:col-span-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-navy text-brand-lime">
                <Briefcase className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-brand-navy">Welcome to LaunchPath</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                Tell us who you&apos;re looking for and we&apos;ll match your role with candidates whose skills fit.
              </p>
              <div className="mt-6">
                <Link href="/employer/new" className={buttonClasses({ variant: 'accent', size: 'lg' })}>
                  <Plus className="h-4 w-4" />
                  Post your first job
                </Link>
              </div>
            </div>
            <ol className="space-y-5 border-t border-slate-100 bg-slate-50/60 p-6 sm:p-10 lg:col-span-2 lg:border-l lg:border-t-0">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-brand-navy ring-1 ring-slate-200">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-brand-navy">{step.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>
    );
  }

  /* --------------------------------- Default --------------------------------- */
  return (
    <div className="space-y-8">
      <PageHeader
        title="Hiring overview"
        description="Your open roles, new applicants and upcoming interviews at a glance."
        actions={postJobLink}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live roles"
          value={stats.live}
          icon={Briefcase}
          hint={
            stats.awaitingPayment > 0
              ? `${stats.awaitingPayment} awaiting payment`
              : `${jobs.length} ${jobs.length === 1 ? 'role' : 'roles'} in total`
          }
        />
        <StatCard
          label="Applicants"
          value={stats.applicants}
          icon={Users}
          hint={`Across ${jobs.length} ${jobs.length === 1 ? 'role' : 'roles'}`}
          onClick={() => setActiveTab('Applicants')}
        />
        <StatCard
          label="Awaiting review"
          value={stats.awaitingReview}
          icon={Inbox}
          tone={stats.awaitingReview > 0 ? 'attention' : 'default'}
          hint={stats.awaitingReview > 0 ? 'No decision or interview yet' : 'You’re all caught up'}
          onClick={() => setActiveTab('Applicants')}
        />
        <StatCard
          label="Upcoming interviews"
          value={stats.upcoming.length}
          icon={CalendarClock}
          hint={`${stats.interviewsTotal} scheduled in total`}
        />
      </div>

      {/* Job listings */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-brand-navy">Your roles</h2>
            <p className="mt-0.5 text-sm text-slate-500">Edit a listing or jump straight to its applicants.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Segmented<JobFilter>
              size="sm"
              value={jobFilter}
              onChange={setJobFilter}
              options={[
                { value: 'all', label: 'All', count: jobs.length },
                { value: 'ACTIVE', label: 'Live', count: stats.live },
                { value: 'PENDING', label: 'Awaiting payment', count: stats.awaitingPayment },
                { value: 'CLOSED', label: 'Closed', count: jobs.filter((j: any) => j.status === 'CLOSED').length },
              ]}
            />
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search roles or skills" className="w-full sm:w-64" />
          </div>
        </div>

        {visibleJobs.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={Briefcase}
              title="No roles match"
              description="Try a different search term or filter."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setJobFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <THead>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Applicants</Th>
                  <Th>Salary</Th>
                  <Th align="right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </THead>
                <TBody>
                  {visibleJobs.map((job: any) => {
                    const counts = countsByJob[String(job.id)] || { total: 0, fresh: 0 };
                    return (
                      <Tr key={job.id}>
                        <Td className="max-w-[320px]">
                          <p className="truncate font-medium text-brand-navy">{job.title}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {job.location || 'Remote'}
                            {job.years_experience && <span className="text-slate-400">· {job.years_experience} experience</span>}
                          </p>
                        </Td>
                        <Td>
                          <JobStatus status={job.status} />
                        </Td>
                        <Td>
                          <span className="font-medium tabular-nums text-brand-navy">{counts.total}</span>
                          {counts.fresh > 0 && <span className="ml-2 text-xs text-amber-700">{counts.fresh} new</span>}
                        </Td>
                        <Td className="whitespace-nowrap text-sm">{formatSalary(job) || <span className="text-slate-400">Not set</span>}</Td>
                        <Td align="right">
                          <div className="flex items-center justify-end gap-1.5">
                            {job.status === 'PENDING' && (
                              <Link href={`/employer/payment?jobId=${job.id}`} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                                <CreditCard className="h-3.5 w-3.5" />
                                Complete payment
                              </Link>
                            )}
                            <IconButton icon={Pencil} label={`Edit ${job.title}`} onClick={() => handleStartEdit(job)} />
                            <Button size="sm" icon={job.status === 'PENDING' ? Lock : undefined} onClick={() => openApplicants(job.id)}>
                              Applicants
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {visibleJobs.map((job: any) => {
                const counts = countsByJob[String(job.id)] || { total: 0, fresh: 0 };
                const salary = formatSalary(job);
                return (
                  <li key={job.id}>
                    <Card className="p-5" padded={false}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-brand-navy">{job.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {job.location || 'Remote'}
                            {salary && ` · ${salary}`}
                          </p>
                        </div>
                        <JobStatus status={job.status} />
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-medium tabular-nums text-brand-navy">{counts.total}</span>{' '}
                        {counts.total === 1 ? 'applicant' : 'applicants'}
                        {counts.fresh > 0 && <span className="text-amber-700"> · {counts.fresh} new</span>}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.status === 'PENDING' && (
                          <Link href={`/employer/payment?jobId=${job.id}`} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                            Complete payment
                          </Link>
                        )}
                        <Button size="sm" icon={Pencil} onClick={() => handleStartEdit(job)}>
                          Edit
                        </Button>
                        <Button size="sm" icon={job.status === 'PENDING' ? Lock : undefined} onClick={() => openApplicants(job.id)}>
                          Applicants
                        </Button>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Latest applicants"
            description="Most recent applications to your live roles."
            action={
              latestApplicants.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('Applicants')}>
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )
            }
          />
          {latestApplicants.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No applicants yet"
              description={
                stats.live > 0
                  ? 'New applications to your live roles will appear here.'
                  : 'Activate a role to start receiving applicants.'
              }
            />
          ) : (
            <ul className="-mx-2 divide-y divide-slate-100">
              {latestApplicants.map((app: any) => (
                <li key={app.id}>
                  <button
                    type="button"
                    onClick={() => openApplicant(app)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
                  >
                    <Identity name={app.candidate?.name} sub={app.job?.title} />
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden sm:inline">
                        <MatchScore score={app.matchContext?.match_score} />
                      </span>
                      <span className="text-xs tabular-nums text-slate-500">{formatDate(app.applied_at)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Upcoming interviews"
            description="Interviews you’ve proposed or confirmed."
            action={
              <Link href="/employer/update" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {stats.upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nothing scheduled"
              description="Open an applicant’s profile to propose an interview time."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.upcoming.slice(0, 5).map((iv: any) => (
                <li key={iv.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-200">
                      <span className="text-[10px] font-medium leading-none text-slate-500">
                        {new Date(iv.proposed_time).toLocaleDateString('en-ZA', { month: 'short' })}
                      </span>
                      <span className="mt-0.5 text-sm font-semibold leading-none text-brand-navy">{new Date(iv.proposed_time).getDate()}</span>
                    </span>
                    <div className="min-w-0">
                      <p className={cx('truncate text-sm font-medium text-brand-navy')}>{iv.application?.candidate?.name || 'Candidate'}</p>
                      <p className="truncate text-xs text-slate-500">
                        {formatDateTime(iv.proposed_time)}
                        {iv.application?.job?.title && ` · ${iv.application.job.title}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={iv.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
