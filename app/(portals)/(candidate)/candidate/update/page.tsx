'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, CalendarClock, Check, RotateCcw, X, MapPin } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import PortalLoader from '@/components/PortalLoader';
import { useToast } from '@/components/ToastNotification';
import { Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, Section, StatusBadge } from '@/components/portal/ui';

function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

export default function CandidateUpdatePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  // Settings Form State
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Interview state
  const [applications, setApplications] = useState<any[]>([]);
  const [busyInterviewId, setBusyInterviewId] = useState<number | null>(null);

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
        setEmail(sessionData.user.email || '');

        // Load applications for interviews
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

  // LinkedIn OAuth event listener & popup initiator
  const [syncingLinkedIn, setSyncingLinkedIn] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        toastSuccess('Your LinkedIn profile is synced.');
        loadData(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadData, toastSuccess]);

  const handleLinkedInConnect = async () => {
    try {
      setSyncingLinkedIn(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`/api/auth/linkedin/url?origin=${encodeURIComponent(origin)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch auth url');
      }
      const { url } = await response.json();

      const authWindow = window.open(url, 'linkedin_oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        toastWarning('Please allow pop-ups for this site to connect LinkedIn.');
      }
    } catch (err: any) {
      console.error(err);
      toastError('We couldn’t connect to LinkedIn: ' + err.message);
    } finally {
      setSyncingLinkedIn(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError('Your new passwords don’t match.');
      toastError('Your new passwords don’t match.');
      return;
    }
    setPasswordError(null);

    setUpdating(true);
    try {
      const res = await fetch('/api/candidate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      if (res.ok) {
        toastSuccess('Settings saved. If you changed your email or password, please sign in again.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const d = await res.json();
        toastError('We couldn’t save your settings: ' + d.error);
      }
    } catch (e) {
      toastError('Something went wrong while saving your settings.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateInterview = async (interviewId: number, status: string) => {
    setBusyInterviewId(interviewId);
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toastSuccess('Interview updated.');
        loadData(true); // reload
      } else {
        toastError('We couldn’t update that interview.');
      }
    } catch (e) {
      toastError('Something went wrong while updating the interview.');
    } finally {
      setBusyInterviewId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  if (loading || !user) {
    return <PortalLoader portal="CANDIDATE" title="Loading your settings" />;
  }

  // Filter applications with interviews
  const applicationsWithInterviews = applications.filter((app) => app.interviews && app.interviews.length > 0);

  return (
    <PortalShell portal="candidate" user={user} onLogout={handleLogout} title="Account settings">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader title="Account settings" description="Manage your sign-in details, connected accounts and interview invitations." />

        {/* Credentials */}
        <Card className="sm:p-8">
          <form onSubmit={handleUpdateSettings}>
            <Section title="Email address" description="We use this to sign you in and send you updates.">
              <Field label="Email" htmlFor="settings-email">
                <Input
                  id="settings-email"
                  type="email"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
            </Section>

            <Section title="Password" description="Leave these blank to keep your current password.">
              <Field label="Current password" htmlFor="settings-current" hint="Only needed if you're changing your password.">
                <Input
                  id="settings-current"
                  type="password"
                  icon={Lock}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="New password" htmlFor="settings-new">
                  <Input
                    id="settings-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm new password" htmlFor="settings-confirm" error={passwordError || undefined}>
                  <Input
                    id="settings-confirm"
                    type="password"
                    value={confirmPassword}
                    invalid={!!passwordError}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </Section>

            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <Button type="submit" variant="primary" loading={updating} className="w-full sm:w-auto">
                {updating ? 'Saving' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Card>

        {/* LinkedIn */}
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A66C2]/10 text-[#0A66C2]">
                <LinkedInGlyph className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-brand-navy">LinkedIn</h2>
                <p className="mt-0.5 text-sm text-slate-500">Import your LinkedIn details to fill in your profile faster.</p>
              </div>
            </div>
            <Button type="button" variant="secondary" loading={syncingLinkedIn} onClick={handleLinkedInConnect} className="w-full sm:w-auto">
              {syncingLinkedIn ? 'Connecting' : 'Sync LinkedIn'}
            </Button>
          </div>
        </Card>

        {/* Interviews */}
        <Card>
          <CardHeader title="Interview invitations" description="Confirm a time, ask to reschedule or decline interviews proposed by employers." />
          {applicationsWithInterviews.length > 0 ? (
            <ul className="space-y-3">
              {applicationsWithInterviews.map((app) => (
                <li key={app.id} className="rounded-xl border border-slate-200/80 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-brand-navy">{app.job.title}</h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                        <span>{app.job.company}</span>
                        {app.job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {app.job.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {app.interviews.map((iv: any) => (
                      <li key={iv.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/80">
                            <CalendarClock className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-brand-navy">
                              {new Date(iv.proposed_time).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                            <div className="mt-1">
                              <StatusBadge status={iv.status} />
                            </div>
                            {iv.notes && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">&ldquo;{iv.notes}&rdquo;</p>}
                          </div>
                        </div>
                        {iv.status === 'Proposed' && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              icon={Check}
                              disabled={busyInterviewId === iv.id}
                              onClick={() => handleUpdateInterview(iv.id, 'Confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={RotateCcw}
                              disabled={busyInterviewId === iv.id}
                              onClick={() => handleUpdateInterview(iv.id, 'Rescheduled')}
                            >
                              Reschedule
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={X}
                              disabled={busyInterviewId === iv.id}
                              className="hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => handleUpdateInterview(iv.id, 'Cancelled')}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No interview invitations yet"
              description="When an employer proposes an interview time, it will appear here for you to confirm."
            />
          )}
        </Card>
      </div>
    </PortalShell>
  );
}
