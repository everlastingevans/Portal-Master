'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarClock, CalendarPlus, CalendarCheck2, Users, Video, Phone, MapPin, Plus, UserRoundSearch } from 'lucide-react';
import PortalLoader from '@/components/PortalLoader';
import PortalShell from '@/components/portal/PortalShell';
import { Modal } from '@/components/portal/overlay';
import { useToast } from '@/components/ToastNotification';
import {
  Button,
  Card,
  ChoiceCard,
  EmptyState,
  Field,
  Identity,
  Input,
  MatchScore,
  PageHeader,
  SearchInput,
  Segmented,
  StatCard,
  StatusBadge,
  Textarea,
  buttonClasses,
} from '@/components/portal/ui';

type Mode = 'video' | 'phone' | 'in_person';

const MODES: Record<Mode, { label: string; icon: typeof Video; notesLabel: string; placeholder: string }> = {
  video: {
    label: 'Video call',
    icon: Video,
    notesLabel: 'Meeting link and notes',
    placeholder: 'Paste the meeting link and anything the candidate should prepare.',
  },
  phone: {
    label: 'Phone call',
    icon: Phone,
    notesLabel: 'Call details',
    placeholder: 'e.g. We’ll call you on the number in your profile. Plan for about 20 minutes.',
  },
  in_person: {
    label: 'In person',
    icon: MapPin,
    notesLabel: 'Address and notes',
    placeholder: 'Street address, who to ask for at reception, parking, and what to bring.',
  },
};

type Filter = 'all' | 'unscheduled' | 'scheduled';

const latestInterview = (app: any) => {
  const list: any[] = app?.interviews || [];
  if (!list.length) return null;
  return [...list].sort((a, b) => new Date(b.proposed_time).getTime() - new Date(a.proposed_time).getTime())[0];
};

const formatSlot = (iso: string) =>
  new Date(iso).toLocaleString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export default function EmployerUpdatePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  // Proposed interview form state
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [mode, setMode] = useState<Mode>('video');
  const [scheduling, setScheduling] = useState(false);

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const router = useRouter();
  const toast = useToast();

  const loadData = useCallback(async (silent = false) => {
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

        // Fetch employer data
        const dashRes = await fetch('/api/employer/dashboard');
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

  const resetForm = () => {
    setInterviewDate('');
    setInterviewTime('');
    setInterviewNotes('');
    setMode('video');
  };

  const closeModal = useCallback(() => {
    if (!scheduling) setSelectedApplicant(null);
  }, [scheduling]);

  const openScheduler = (app: any) => {
    resetForm();
    setSelectedApplicant(app);
  };

  const scheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant || !interviewDate || !interviewTime || !interviewNotes.trim()) {
      toast.warning('Add a date, time and interview details before sending.');
      return;
    }

    setScheduling(true);
    const combined = new Date(`${interviewDate}T${interviewTime}`);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedApplicant.id,
          candidate_id: selectedApplicant.candidate_id,
          proposed_time: combined.toISOString(),
          notes: `${MODES[mode].label}: ${interviewNotes.trim()}`,
        }),
      });
      if (res.ok) {
        toast.success(`Invitation sent to ${selectedApplicant.candidate?.name || 'the candidate'}.`);
        resetForm();
        setSelectedApplicant(null);
        loadData(true); // refresh the list in place
      } else {
        toast.error('We couldn’t send the invitation. Please try again.');
      }
    } catch (err) {
      toast.error('Something went wrong while scheduling. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  const stats = useMemo(() => {
    const all = applications.flatMap((a) => a.interviews || []);
    const status = (s: any) => String(s?.status || '').toUpperCase();
    return {
      applicants: applications.length,
      unscheduled: applications.filter((a) => !(a.interviews || []).length).length,
      proposed: all.filter((i) => status(i) === 'PROPOSED' || status(i) === 'RESCHEDULED').length,
      confirmed: all.filter((i) => status(i) === 'CONFIRMED').length,
    };
  }, [applications]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((app) => {
      const hasInterview = (app.interviews || []).length > 0;
      if (filter === 'unscheduled' && hasInterview) return false;
      if (filter === 'scheduled' && !hasInterview) return false;
      if (!q) return true;
      return [app.candidate?.name, app.candidate?.professional_title, app.job?.title].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [applications, filter, query]);

  if (loading || !user) {
    return <PortalLoader portal="EMPLOYER" title="Loading interviews" />;
  }

  const ModeIcon = MODES[mode].icon;

  return (
    <PortalShell portal="employer" user={user} onLogout={handleLogout} title="Interviews">
      <div className="space-y-8">
        <PageHeader
          title="Interviews"
          description="Invite applicants to interview and keep track of every proposed slot."
          actions={
            <Link href="/employer/dashboard?tab=Applicants" className={buttonClasses({ variant: 'secondary' })}>
              <Users className="h-4 w-4" /> All applicants
            </Link>
          }
        />

        {applications.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={CalendarClock}
              title="No applicants to interview yet"
              description="When candidates apply to your roles, you can invite them to interview from here."
              action={
                <Link href="/employer/new" className={buttonClasses({ variant: 'primary' })}>
                  <Plus className="h-4 w-4" /> Post a job
                </Link>
              }
            />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard label="Applicants" value={stats.applicants} icon={Users} />
              <StatCard
                label="To schedule"
                value={stats.unscheduled}
                icon={CalendarPlus}
                tone={stats.unscheduled > 0 ? 'attention' : 'default'}
                onClick={() => setFilter('unscheduled')}
              />
              <StatCard label="Awaiting reply" value={stats.proposed} icon={CalendarClock} />
              <StatCard label="Confirmed" value={stats.confirmed} icon={CalendarCheck2} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Segmented
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All', count: applications.length },
                  { value: 'unscheduled', label: 'To schedule', count: stats.unscheduled },
                  { value: 'scheduled', label: 'Scheduled', count: applications.length - stats.unscheduled },
                ]}
              />
              <SearchInput value={query} onChange={setQuery} placeholder="Search name or role" className="w-full sm:w-72" />
            </div>

            <Card padded={false} className="overflow-hidden">
              {visible.length === 0 ? (
                <EmptyState
                  icon={UserRoundSearch}
                  title="No applicants match"
                  description="Try a different search or filter."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQuery('');
                        setFilter('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="hidden grid-cols-12 gap-4 border-b border-slate-200/80 bg-slate-50/60 px-5 py-3 text-xs font-medium text-slate-500 md:grid">
                    <span className="col-span-4">Candidate</span>
                    <span className="col-span-3">Role</span>
                    <span className="col-span-3">Interview</span>
                    <span className="col-span-2 text-right">
                      <span className="sr-only">Actions</span>
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {visible.map((app) => {
                      const interview = latestInterview(app);
                      return (
                        <li key={app.id} className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 md:grid-cols-12 md:items-center md:gap-4">
                          <div className="min-w-0 md:col-span-4">
                            <Identity
                              name={app.candidate?.name}
                              sub={app.candidate?.professional_title || app.candidate?.email}
                            />
                          </div>
                          <div className="flex min-w-0 flex-wrap items-center gap-2 md:col-span-3">
                            <span className="truncate text-sm text-slate-600">{app.job?.title}</span>
                            <MatchScore score={app.matchContext?.match_score} />
                          </div>
                          <div className="min-w-0 md:col-span-3">
                            {interview ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm tabular-nums text-brand-navy">{formatSlot(interview.proposed_time)}</span>
                                <StatusBadge status={interview.status} />
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">Not scheduled</span>
                            )}
                          </div>
                          <div className="md:col-span-2 md:text-right">
                            <Button
                              size="sm"
                              variant={interview ? 'secondary' : 'primary'}
                              icon={CalendarPlus}
                              onClick={() => openScheduler(app)}
                              className="w-full md:w-auto"
                            >
                              {interview ? 'New time' : 'Schedule'}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Card>
          </>
        )}
      </div>

      <Modal
        open={Boolean(selectedApplicant)}
        onClose={closeModal}
        title="Schedule an interview"
        description={
          selectedApplicant ? (
            <>
              {selectedApplicant.candidate?.name} · {selectedApplicant.job?.title}
            </>
          ) : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={scheduling}>
              Cancel
            </Button>
            <Button type="submit" form="schedule-interview" variant="primary" loading={scheduling}>
              {scheduling ? 'Sending…' : 'Send invitation'}
            </Button>
          </>
        }
      >
        <form id="schedule-interview" onSubmit={scheduleInterview} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="interview-date">
              <Input id="interview-date" type="date" min={todayISO()} value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} required />
            </Field>
            <Field label="Time" htmlFor="interview-time">
              <Input id="interview-time" type="time" step={900} value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} required />
            </Field>
          </div>

          <Field label="Format">
            <div role="radiogroup" aria-label="Interview format" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Object.keys(MODES) as Mode[]).map((m) => (
                <ChoiceCard key={m} selected={mode === m} onSelect={() => setMode(m)} icon={MODES[m].icon} title={MODES[m].label} />
              ))}
            </div>
          </Field>

          <Field label={MODES[mode].notesLabel} htmlFor="interview-notes" hint="Included in the invitation the candidate receives.">
            <Textarea
              id="interview-notes"
              rows={4}
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              placeholder={MODES[mode].placeholder}
              required
            />
          </Field>

          {interviewDate && interviewTime && (
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200/80">
              <ModeIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                {MODES[mode].label} on <span className="font-medium text-brand-navy">{formatSlot(`${interviewDate}T${interviewTime}`)}</span>
              </span>
            </div>
          )}
        </form>
      </Modal>
    </PortalShell>
  );
}
