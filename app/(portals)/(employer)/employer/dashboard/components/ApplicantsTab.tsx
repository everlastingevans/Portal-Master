'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Video,
  Sparkles,
  Lock,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Mail,
  Phone,
  Linkedin,
  Github,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  FileText,
  Briefcase,
  CreditCard,
  UserRound,
} from 'lucide-react';
import LaunchpathMuxPlayer from '@/components/LaunchpathMuxPlayer';
import {
  PageHeader,
  Card,
  Badge,
  StatusBadge,
  MatchScore,
  Button,
  buttonClasses,
  Field,
  Input,
  Select,
  SearchInput,
  Segmented,
  Avatar,
  Identity,
  EmptyState,
  Alert,
  cx,
} from '@/components/portal/ui';
import { Drawer, useConfirm } from '@/components/portal/overlay';

const VIDEO_POSTER = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#0A1B3D"/><circle cx="400" cy="205" r="44" fill="#A6F23C"/><path d="M388 184 L422 205 L388 226 Z" fill="#0A1B3D"/><text x="400" y="300" fill="#ffffff" fill-opacity="0.7" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" text-anchor="middle">Video interview</text></svg>'
)}`;

interface ApplicantsTabProps {
  jobs: any[];
  applications: any[];
  selectedJobFilter: string | number | null;
  setSelectedJobFilter: (id: any) => void;
  isJobUnlocked: (jobId: any) => boolean;
  unlocking: boolean;
  handleUnlock: (action: 'checkout' | 'bypass', jobIdToUnlock?: any) => void;
  filterScore: number | 'All';
  setFilterScore: (val: number | 'All') => void;
  filterExperience: string;
  setFilterExperience: (val: string) => void;
  filterSkill: string;
  setFilterSkill: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  filteredApplicants: any[];
  selectedApplicant: any | null;
  setSelectedApplicant: (val: any) => void;
  interviewDate: string;
  setInterviewDate: (val: string) => void;
  interviewTime: string;
  setInterviewTime: (val: string) => void;
  interviewNotes: string;
  setInterviewNotes: (val: string) => void;
  scheduleInterview: (app: any) => void | Promise<void>;
  handleUpdateApplicationStatus: (appId: number, status: 'Accepted' | 'Rejected') => void | Promise<void>;
}

type Stage = 'all' | 'new' | 'interviewing' | 'accepted' | 'rejected';

/** Pipeline stage derived from the real application status + interviews. */
function stageOf(app: any): Exclude<Stage, 'all'> {
  if (app.status === 'Accepted') return 'accepted';
  if (app.status === 'Rejected') return 'rejected';
  if (app.interviews && app.interviews.length > 0) return 'interviewing';
  return 'new';
}

function parseList(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const str = String(value).trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    /* not JSON, fall through to comma-separated */
  }
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseQuestions(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(value: any) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value: any) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ApplicationStatus({ app }: { app: any }) {
  const stage = stageOf(app);
  if (stage === 'interviewing') return <Badge tone="info" dot>Interviewing</Badge>;
  if (stage === 'new') return <Badge tone="warning" dot>New</Badge>;
  return <StatusBadge status={app.status} />;
}

function DetailSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ApplicantsTab({
  jobs = [],
  applications = [],
  selectedJobFilter,
  setSelectedJobFilter,
  isJobUnlocked,
  unlocking,
  handleUnlock,
  filterScore,
  setFilterScore,
  filterExperience,
  setFilterExperience,
  filterSkill,
  setFilterSkill,
  sortBy,
  setSortBy,
  filteredApplicants = [],
  selectedApplicant,
  setSelectedApplicant,
  interviewDate,
  setInterviewDate,
  interviewTime,
  setInterviewTime,
  interviewNotes,
  setInterviewNotes,
  scheduleInterview,
  handleUpdateApplicationStatus,
}: ApplicantsTabProps) {
  const askConfirm = useConfirm();
  const [stage, setStage] = useState<Stage>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFullCv, setShowFullCv] = useState(false);
  const [busy, setBusy] = useState<null | 'Accepted' | 'Rejected' | 'invite'>(null);

  const activeJob = jobs.find((j) => j.id === selectedJobFilter);
  const appsForJob = (jobId: any) => (applications || []).filter((a: any) => a.job_id === jobId);

  const activeFilterCount =
    (filterScore !== 'All' ? 1 : 0) + (filterExperience !== 'All' ? 1 : 0) + (filterSkill !== 'All' ? 1 : 0);

  const stageCounts = useMemo(() => {
    const counts: Record<Stage, number> = { all: 0, new: 0, interviewing: 0, accepted: 0, rejected: 0 };
    filteredApplicants.forEach((a: any) => {
      counts.all += 1;
      counts[stageOf(a)] += 1;
    });
    return counts;
  }, [filteredApplicants]);

  const visibleApplicants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filteredApplicants.filter((a: any) => {
      if (stage !== 'all' && stageOf(a) !== stage) return false;
      if (!q) return true;
      const c = a.candidate || {};
      return [c.name, c.email, c.professional_title, c.experience_level].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [filteredApplicants, stage, search]);

  const resetFilters = () => {
    setFilterScore('All');
    setFilterExperience('All');
    setFilterSkill('All');
    setSortBy('applied_at_desc');
  };

  const openApplicant = (app: any) => {
    setShowFullCv(false);
    setSelectedApplicant(app);
  };

  const decide = async (status: 'Accepted' | 'Rejected') => {
    if (!selectedApplicant) return;
    if (status === 'Rejected') {
      const ok = await askConfirm({
        title: 'Reject this applicant?',
        description: `${selectedApplicant.candidate?.name || 'This candidate'} will be marked as rejected for ${selectedApplicant.job?.title || 'this role'}.`,
        confirmLabel: 'Reject applicant',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setBusy(status);
    try {
      await handleUpdateApplicationStatus(selectedApplicant.id, status);
    } finally {
      setBusy(null);
    }
  };

  const sendInvite = async () => {
    if (!selectedApplicant) return;
    setBusy('invite');
    try {
      await scheduleInterview(selectedApplicant);
    } finally {
      setBusy(null);
    }
  };

  const jobSelect = (
    <Select
      aria-label="Role"
      value={selectedJobFilter == null ? '' : String(selectedJobFilter)}
      onChange={(e) => {
        const job = jobs.find((j: any) => String(j.id) === e.target.value);
        setSelectedJobFilter(job ? job.id : null);
        setStage('all');
      }}
      className="h-10 w-full sm:w-72"
    >
      {jobs.length > 1 && <option value="">All roles</option>}
      {jobs.map((j: any) => (
        <option key={j.id} value={String(j.id)}>
          {j.title}
          {isJobUnlocked(j.id) ? '' : ' (locked)'}
        </option>
      ))}
    </Select>
  );

  /* ------------------------------- No roles yet ------------------------------ */
  if (jobs.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader title="Applicants" description="Review matched candidates, make decisions and schedule interviews." />
        <Card padded={false}>
          <EmptyState
            icon={Briefcase}
            title="Post a role to receive applicants"
            description="Once your role is live, matched candidates and their applications appear here."
            action={
              <Link href="/employer/new" className={buttonClasses({ variant: 'primary' })}>
                Post a job
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  /* ------------------------------- Role picker ------------------------------- */
  if (!selectedJobFilter && jobs.length > 1) {
    return (
      <div className="space-y-8">
        <PageHeader title="Applicants" description="Choose a role to review its applicants, match scores and interviews." />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j: any) => {
            const list = appsForJob(j.id);
            const unlocked = isJobUnlocked(j.id);
            const fresh = list.filter((a: any) => stageOf(a) === 'new').length;
            return (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => setSelectedJobFilter(j.id)}
                  className="group flex h-full w-full cursor-pointer flex-col rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(10,27,61,0.04)] transition-all hover:border-slate-300 hover:shadow-[0_4px_16px_-6px_rgba(10,27,61,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-navy">{j.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {[j.company, j.location].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {unlocked ? (
                      <Badge tone="success" dot>Live</Badge>
                    ) : (
                      <Badge tone={j.status === 'CLOSED' ? 'neutral' : 'warning'}>
                        <Lock className="h-3 w-3" />
                        {j.status === 'CLOSED' ? 'Closed' : 'Locked'}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      <span className="text-2xl font-semibold tabular-nums text-brand-navy">{list.length}</span>{' '}
                      {list.length === 1 ? 'applicant' : 'applicants'}
                      {unlocked && fresh > 0 && <span className="ml-1 text-amber-700">· {fresh} new</span>}
                    </p>
                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-navy" />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /* ---------------------------- Locked (payment) ----------------------------- */
  if (selectedJobFilter && !isJobUnlocked(selectedJobFilter)) {
    const waiting = appsForJob(selectedJobFilter).length;
    const benefits = [
      { icon: UserRound, title: 'Full candidate profiles', text: 'Names, contact details, CVs and experience.' },
      { icon: Sparkles, title: 'Match scores', text: 'How each candidate fits your required skills.' },
      { icon: Video, title: 'Interview recordings', text: 'Watch practice interview answers and transcripts.' },
      { icon: CalendarClock, title: 'Interview scheduling', text: 'Propose times and send invites from LaunchPath.' },
    ];
    return (
      <div className="space-y-8">
        <PageHeader
          title="Applicants"
          description="Review matched candidates, make decisions and schedule interviews."
          actions={jobSelect}
        />
        <Card padded={false} className="mx-auto max-w-3xl overflow-hidden">
          <div className="p-6 text-center sm:p-10">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-brand-lime">
              <Lock className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-brand-navy">Activate this role to see its applicants</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{activeJob?.title || 'Selected role'}</p>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600">
              {waiting > 0 ? (
                <>
                  <span className="font-semibold text-brand-navy">
                    {waiting} {waiting === 1 ? 'candidate has' : 'candidates have'}
                  </span>{' '}
                  applied so far. Activate the role to review them and start matching.
                </>
              ) : (
                'Activate the role to start matching and receive applicants.'
              )}
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-px border-y border-slate-100 bg-slate-100 sm:grid-cols-2">
            {benefits.map((b) => (
              <li key={b.title} className="flex items-start gap-3 bg-white p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200">
                  <b.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-brand-navy">{b.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-4 bg-slate-50/60 p-6 text-center sm:p-8">
            <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
              <Button variant="accent" size="lg" icon={CreditCard} loading={unlocking} onClick={() => handleUnlock('checkout', selectedJobFilter)}>
                Activate role · R1,999 once-off
              </Button>
              <Button variant="ghost" size="lg" disabled={unlocking} onClick={() => handleUnlock('bypass', selectedJobFilter)}>
                Simulate payment (demo)
              </Button>
            </div>
            <p className="text-xs text-slate-500">Secure payment by PayFast. No subscriptions or placement fees.</p>
            {jobs.length > 1 && (
              <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setSelectedJobFilter(null)}>
                All roles
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  /* --------------------------------- Pipeline -------------------------------- */
  const readiness = selectedApplicant?.candidate?.video_interviews?.[0];
  const match = selectedApplicant?.matchContext;
  const matched = parseList(match?.matched_skills);
  const missing = parseList(match?.missing_skills);
  const questions = parseQuestions(readiness?.questions);
  const resume: string = String(selectedApplicant?.candidate?.resume_text || '').trim();
  const cvPreviewLength = 900;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applicants"
        description={
          activeJob ? (
            <>
              Reviewing applicants for <span className="font-medium text-brand-navy">{activeJob.title}</span>.
            </>
          ) : (
            'Review matched candidates, make decisions and schedule interviews.'
          )
        }
        actions={jobSelect}
      />

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented<Stage>
            value={stage}
            onChange={setStage}
            options={[
              { value: 'all', label: 'All', count: stageCounts.all },
              { value: 'new', label: 'New', count: stageCounts.new },
              { value: 'interviewing', label: 'Interviewing', count: stageCounts.interviewing },
              { value: 'accepted', label: 'Accepted', count: stageCounts.accepted },
              { value: 'rejected', label: 'Rejected', count: stageCounts.rejected },
            ]}
          />
          <div className="flex gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name or title" className="min-w-0 flex-1 lg:w-64" />
            <Button
              icon={SlidersHorizontal}
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="applicant-filters"
            >
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-navy px-1.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="animate-fade-in p-4 sm:p-5" padded={false}>
            <div id="applicant-filters" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Sort by" htmlFor="f-sort">
                <Select id="f-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-10">
                  <option value="applied_at_desc">Newest first</option>
                  <option value="score_desc">Highest match</option>
                  <option value="readiness_desc">Highest interview score</option>
                  <option value="name_asc">Name (A–Z)</option>
                </Select>
              </Field>
              <Field label="Minimum match" htmlFor="f-score">
                <Select
                  id="f-score"
                  value={String(filterScore)}
                  onChange={(e) => setFilterScore(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                  className="h-10"
                >
                  <option value="All">Any match</option>
                  <option value="70">70% or higher</option>
                  <option value="80">80% or higher</option>
                  <option value="90">90% or higher</option>
                </Select>
              </Field>
              <Field label="Experience" htmlFor="f-exp">
                <Select id="f-exp" value={filterExperience} onChange={(e) => setFilterExperience(e.target.value)} className="h-10">
                  <option value="All">Any level</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Lead or executive</option>
                </Select>
              </Field>
              <Field label="Skill" htmlFor="f-skill">
                <Select id="f-skill" value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} className="h-10">
                  <option value="All">Any skill</option>
                  <option value="React">React</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Node">Node.js</option>
                  <option value="Python">Python</option>
                  <option value="SQL">SQL</option>
                  <option value="DevOps">DevOps</option>
                </Select>
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Candidate list */}
      <Card padded={false} className="overflow-hidden">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-200/80 bg-slate-50/60 px-5 py-3 text-xs font-medium text-slate-500 md:grid">
          <span className="col-span-5">Candidate</span>
          <span className="col-span-2">Match</span>
          <span className="col-span-2">Applied</span>
          <span className="col-span-3">Status</span>
        </div>
        {visibleApplicants.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filteredApplicants.length === 0 && activeFilterCount === 0 ? 'No applicants yet' : 'No applicants match'}
            description={
              filteredApplicants.length === 0 && activeFilterCount === 0
                ? 'New applications for this role will appear here.'
                : 'Try another stage, search term or filter.'
            }
            action={
              (activeFilterCount > 0 || search || stage !== 'all') && (
                <Button
                  size="sm"
                  onClick={() => {
                    resetFilters();
                    setSearch('');
                    setStage('all');
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleApplicants.map((app: any) => {
              const c = app.candidate || {};
              const sub = [c.professional_title, c.experience_level].filter(Boolean).join(' · ') || app.job?.title;
              const selected = selectedApplicant?.id === app.id;
              return (
                <li key={app.id}>
                  <button
                    type="button"
                    onClick={() => openApplicant(app)}
                    className={cx(
                      'grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-slate-50/70 focus-visible:bg-slate-50 focus-visible:outline-none md:grid-cols-12',
                      selected && 'bg-slate-50'
                    )}
                  >
                    <div className="min-w-0 md:col-span-5">
                      <Identity name={c.name} sub={sub} />
                    </div>
                    <div className="justify-self-end md:col-span-2 md:justify-self-start">
                      {app.matchContext ? (
                        <MatchScore score={app.matchContext.match_score} />
                      ) : (
                        <span className="text-xs text-slate-400">Not scored</span>
                      )}
                    </div>
                    <div className="text-xs tabular-nums text-slate-500 md:col-span-2 md:text-sm">
                      <span className="md:hidden">Applied </span>
                      {formatDate(app.applied_at)}
                    </div>
                    <div className="flex items-center justify-end gap-2 md:col-span-3 md:justify-between">
                      <ApplicationStatus app={app} />
                      <ChevronRight className="hidden h-4 w-4 text-slate-300 md:block" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Applicant drawer */}
      <Drawer
        open={Boolean(selectedApplicant)}
        onClose={() => setSelectedApplicant(null)}
        width="max-w-2xl"
        title={
          selectedApplicant && (
            <div className="flex min-w-0 items-center gap-4">
              <Avatar name={selectedApplicant.candidate?.name} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-brand-navy">{selectedApplicant.candidate?.name || 'Candidate'}</h2>
                <p className="truncate text-sm text-slate-500">
                  {[selectedApplicant.candidate?.professional_title, selectedApplicant.candidate?.experience_level].filter(Boolean).join(' · ') ||
                    'Candidate'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ApplicationStatus app={selectedApplicant} />
                  <MatchScore score={match?.match_score} />
                </div>
              </div>
            </div>
          )
        }
        footer={
          selectedApplicant && (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Applied {formatDate(selectedApplicant.applied_at)}
                {selectedApplicant.job?.title && ` for ${selectedApplicant.job.title}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  icon={XCircle}
                  className="flex-1 text-rose-600 sm:flex-none"
                  disabled={selectedApplicant.status === 'Rejected' || busy !== null}
                  loading={busy === 'Rejected'}
                  onClick={() => decide('Rejected')}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  className="flex-1 sm:flex-none"
                  disabled={selectedApplicant.status === 'Accepted' || busy !== null}
                  loading={busy === 'Accepted'}
                  onClick={() => decide('Accepted')}
                >
                  Accept
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedApplicant && (
          <div className="space-y-6">
            {/* Contact */}
            <DetailSection title="Contact">
              <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {selectedApplicant.candidate?.email && (
                  <li className="min-w-0">
                    <a
                      href={`mailto:${selectedApplicant.candidate.email}`}
                      className="flex min-w-0 items-center gap-2 rounded-lg text-slate-600 hover:text-brand-navy hover:underline"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{selectedApplicant.candidate.email}</span>
                    </a>
                  </li>
                )}
                {selectedApplicant.candidate?.phone && (
                  <li>
                    <a href={`tel:${selectedApplicant.candidate.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-brand-navy hover:underline">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      {selectedApplicant.candidate.phone}
                    </a>
                  </li>
                )}
                {selectedApplicant.candidate?.linkedin_url && (
                  <li>
                    <a
                      href={selectedApplicant.candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-600 hover:text-brand-navy hover:underline"
                    >
                      <Linkedin className="h-4 w-4 shrink-0 text-slate-400" />
                      LinkedIn profile
                    </a>
                  </li>
                )}
                {selectedApplicant.candidate?.github_url && (
                  <li>
                    <a
                      href={selectedApplicant.candidate.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-600 hover:text-brand-navy hover:underline"
                    >
                      <Github className="h-4 w-4 shrink-0 text-slate-400" />
                      GitHub profile
                    </a>
                  </li>
                )}
              </ul>
            </DetailSection>

            {/* Match */}
            <DetailSection title="Match" action={match && <MatchScore score={match.match_score} />}>
              {match ? (
                <div className="space-y-4">
                  {match.fit_summary && <p className="text-sm leading-relaxed text-slate-600">{match.fit_summary}</p>}
                  {match.recommendation && (
                    <Alert tone="info" icon={Sparkles}>
                      {match.recommendation}
                    </Alert>
                  )}
                  {matched.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-500">Matched skills ({matched.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matched.map((s) => (
                          <Badge key={s} tone="success">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {missing.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-500">Missing skills ({missing.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {missing.map((s) => (
                          <Badge key={s} tone="neutral">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">This applicant hasn&apos;t been scored for this role yet.</p>
              )}
            </DetailSection>

            {/* Interviews */}
            <DetailSection title="Interviews">
              {selectedApplicant.interviews && selectedApplicant.interviews.length > 0 ? (
                <ul className="mb-5 space-y-2">
                  {selectedApplicant.interviews.map((iv: any) => (
                    <li key={iv.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200/70">
                      <div className="flex min-w-0 items-center gap-3">
                        <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-brand-navy">{formatDateTime(iv.proposed_time)}</p>
                          {iv.notes && <p className="truncate text-xs text-slate-500">{iv.notes}</p>}
                        </div>
                      </div>
                      <StatusBadge status={iv.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-5 text-sm text-slate-500">No interviews scheduled yet.</p>
              )}

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-brand-navy">Propose an interview</p>
                <p className="mt-0.5 text-xs text-slate-500">The candidate is notified and can confirm the time.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Date" htmlFor="iv-date">
                    <Input id="iv-date" type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="h-10" />
                  </Field>
                  <Field label="Time" htmlFor="iv-time">
                    <Input id="iv-time" type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} className="h-10" />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="Meeting link or notes" htmlFor="iv-notes" optional>
                    <Input
                      id="iv-notes"
                      type="text"
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      placeholder="Google Meet, Teams or Zoom link, or directions"
                      className="h-10"
                    />
                  </Field>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="primary" icon={CalendarClock} loading={busy === 'invite'} disabled={busy !== null} onClick={sendInvite}>
                    Send invite
                  </Button>
                </div>
              </div>
            </DetailSection>

            {/* Video interview */}
            {readiness && (
              <DetailSection
                title="Video interview"
                action={
                  typeof readiness.score === 'number' && (
                    <Badge tone={readiness.score >= 70 ? 'success' : 'neutral'}>
                      <span className="tabular-nums">Score {readiness.score}%</span>
                    </Badge>
                  )
                }
              >
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-brand-navy ring-1 ring-slate-200">
                    <LaunchpathMuxPlayer videoUrl={readiness?.video_url as string | undefined} poster={VIDEO_POSTER} className="h-full w-full" />
                  </div>
                  {readiness.feedback && (
                    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70">
                      <p className="text-xs font-medium text-slate-500">Assessment feedback</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{readiness.feedback}</p>
                    </div>
                  )}
                  {questions.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-500">Answers</p>
                      <ol className="space-y-2">
                        {questions.map((q: any, i: number) => (
                          <li key={q.id ?? i} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium text-brand-navy">
                                <span className="mr-1.5 text-slate-400">{i + 1}.</span>
                                {q.title}
                              </p>
                              {q.questionScore !== undefined && q.questionScore !== null && (
                                <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500">{q.questionScore}%</span>
                              )}
                            </div>
                            {q.transcript && <p className="mt-2 text-sm leading-relaxed text-slate-600">&ldquo;{q.transcript}&rdquo;</p>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </DetailSection>
            )}

            {/* CV */}
            <DetailSection title="CV">
              {resume ? (
                <div>
                  <div className="relative">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                      {showFullCv || resume.length <= cvPreviewLength ? resume : `${resume.slice(0, cvPreviewLength)}…`}
                    </p>
                  </div>
                  {resume.length > cvPreviewLength && (
                    <Button size="sm" variant="ghost" className="mt-2 -ml-3" onClick={() => setShowFullCv((v) => !v)}>
                      {showFullCv ? 'Show less' : 'Show full CV'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <FileText className="h-4 w-4 text-slate-400" />
                  No CV text on file.
                </div>
              )}
            </DetailSection>
          </div>
        )}
      </Drawer>
    </div>
  );
}
