'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Building2, Briefcase, FileText, Video, ArrowRight, RefreshCcw, Sparkles, CalendarClock } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { useToast } from '@/components/ToastNotification';
import { useAdmin } from '../AdminContext';
import { useConfirm } from '../_components/overlay';
import { PageHeader, Card, CardHeader, StatCard, Button, Badge, EmptyState, LegendKey, chartTheme, Identity, EMPTY } from '../_components/ui';

const PIPELINE_STAGES = ['Pending', 'Reviewed', 'Interviewing', 'Offered', 'Rejected'] as const;
const DAY_MS = 86_400_000;

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-ZA').format(n);
}

export default function AdminOverviewPage() {
  const { data } = useAdmin();
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [rescoring, setRescoring] = useState(false);

  const candidates: any[] = data?.candidates ?? EMPTY;
  const employers: any[] = data?.employers ?? EMPTY;
  const jobs: any[] = data?.jobs ?? EMPTY;
  const matches: any[] = data?.matches ?? EMPTY;
  const applications: any[] = data?.applications ?? EMPTY;
  const interviews: any[] = data?.interviews ?? EMPTY;
  const stats: any = data?.stats ?? {};

  const metrics = useMemo(() => {
    const now = Date.now();
    const appTimes = applications.map((a: any) => new Date(a.applied_at).getTime()).filter(Boolean);
    const last7 = appTimes.filter((t: number) => now - t < 7 * DAY_MS).length;
    const prev7 = appTimes.filter((t: number) => now - t >= 7 * DAY_MS && now - t < 14 * DAY_MS).length;

    const liveJobs = jobs.filter((j: any) => String(j.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const pendingJobs = jobs.filter((j: any) => ['PENDING', 'DRAFT'].includes(String(j.status).toUpperCase())).length;
    const withCv = candidates.filter((c: any) => c.resume_text).length;
    const hiring = employers.filter((e: any) => e.jobs_posted?.length > 0).length;
    const upcoming = interviews.filter((iv: any) => new Date(iv.proposed_time).getTime() > now && iv.status !== 'Cancelled').length;

    return { last7, prev7, liveJobs, pendingJobs, withCv, hiring, upcoming };
  }, [applications, jobs, candidates, employers, interviews]);

  // Real daily activity for the last 30 days (applications submitted, interviews scheduled)
  const activity = useMemo(() => {
    const days: { key: string; label: string; Applications: number; Interviews: number }[] = [];
    const index = new Map<string, number>();
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      index.set(dayKey(d), days.length);
      days.push({ key: dayKey(d), label: d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }), Applications: 0, Interviews: 0 });
    }
    applications.forEach((a: any) => {
      const i = index.get(dayKey(new Date(a.applied_at)));
      if (i !== undefined) days[i].Applications++;
    });
    interviews.forEach((iv: any) => {
      const i = index.get(dayKey(new Date(iv.created_at)));
      if (i !== undefined) days[i].Interviews++;
    });
    return days;
  }, [applications, interviews]);

  const activityTotals = activity.reduce(
    (acc, d) => ({ apps: acc.apps + d.Applications, ivs: acc.ivs + d.Interviews }),
    { apps: 0, ivs: 0 },
  );

  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a: any) => {
      const s = a.status || 'Pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    const known = PIPELINE_STAGES.map((stage) => ({ stage, count: counts[stage] || 0 }));
    const other = Object.entries(counts)
      .filter(([s]) => !(PIPELINE_STAGES as readonly string[]).includes(s))
      .reduce((sum, [, n]) => sum + n, 0);
    return other ? [...known, { stage: 'Other', count: other }] : known;
  }, [applications]);
  const pipelineMax = Math.max(1, ...pipeline.map((p) => p.count));

  const matchBands = useMemo(() => {
    const bands = [
      { band: '<50%', count: 0 },
      { band: '50–69%', count: 0 },
      { band: '70–84%', count: 0 },
      { band: '85%+', count: 0 },
    ];
    matches.forEach((m: any) => {
      const s = m.match_score;
      bands[s >= 85 ? 3 : s >= 70 ? 2 : s >= 50 ? 1 : 0].count++;
    });
    return bands;
  }, [matches]);

  const handleRescore = async () => {
    const ok = await confirm({
      title: 'Re-score all matches?',
      description: 'This re-runs AI matching for every candidate against every live job. It can take several minutes and uses AI credits.',
      confirmLabel: 'Re-score matches',
    });
    if (!ok) return;
    setRescoring(true);
    try {
      const res = await fetch('/api/superadmin/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESCORE_ALL' }),
      });
      const result = await res.json();
      if (res.ok) toast.success(result.message || 'Re-scoring started');
      else toast.error(result.error || 'Could not start re-scoring');
    } catch (err: any) {
      toast.error(err.message || 'Could not start re-scoring');
    } finally {
      setRescoring(false);
    }
  };

  const appDelta = metrics.last7 - metrics.prev7;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="A live view of talent, hiring demand and pipeline health across the platform."
        actions={
          <Button icon={RefreshCcw} onClick={handleRescore} loading={rescoring}>
            Re-score matches
          </Button>
        }
      />

      {stats.pendingVideoInterviewsCount > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
              <Video className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">
                {stats.pendingVideoInterviewsCount} video interview{stats.pendingVideoInterviewsCount === 1 ? '' : 's'} awaiting review
              </p>
              <p className="text-xs text-slate-400">Candidates are waiting on grading and feedback.</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => router.push('/admin/talent?filter=pending-video')}>
            Review now <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Candidates"
          value={formatNumber(stats.totalCandidates || 0)}
          icon={Users}
          hint={`${formatNumber(metrics.withCv)} with a CV on file`}
          onClick={() => router.push('/admin/talent')}
        />
        <StatCard
          label="Employers"
          value={formatNumber(stats.totalEmployers || 0)}
          icon={Building2}
          hint={`${formatNumber(metrics.hiring)} with job posts`}
          onClick={() => router.push('/admin/corporate')}
        />
        <StatCard
          label="Live jobs"
          value={formatNumber(metrics.liveJobs)}
          icon={Briefcase}
          tone={metrics.pendingJobs > 0 ? 'attention' : 'default'}
          hint={
            metrics.pendingJobs > 0 ? (
              <span className="text-amber-300">{metrics.pendingJobs} awaiting approval</span>
            ) : (
              'No jobs awaiting approval'
            )
          }
          onClick={() => router.push(metrics.pendingJobs > 0 ? '/admin/jobs?status=pending' : '/admin/jobs')}
        />
        <StatCard
          label="Applications"
          value={formatNumber(stats.totalApplications || 0)}
          icon={FileText}
          hint={
            <span>
              <span className="text-slate-300">{metrics.last7}</span> in the last 7 days
              {metrics.prev7 > 0 || metrics.last7 > 0 ? (
                <span className={appDelta >= 0 ? 'text-emerald-400' : 'text-rose-300'}>
                  {' '}
                  ({appDelta >= 0 ? '+' : ''}
                  {appDelta} vs prior week)
                </span>
              ) : null}
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Activity"
            description="Applications submitted and interviews scheduled per day, last 30 days"
            action={
              <div className="flex flex-wrap items-center gap-4">
                <LegendKey color={chartTheme.series1} label="Applications" value={activityTotals.apps} />
                <LegendKey color={chartTheme.series2} label="Interviews" value={activityTotals.ivs} />
              </div>
            }
          />
          <div className="h-64">
            {activityTotals.apps + activityTotals.ivs === 0 ? (
              <EmptyState icon={FileText} title="No activity in the last 30 days" description="Applications and interviews will appear here as they happen." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartTheme.series1} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={chartTheme.series1} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillIvs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartTheme.series2} stopOpacity={0.14} />
                      <stop offset="100%" stopColor={chartTheme.series2} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="label" tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis allowDecimals={false} tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTheme.tooltip} cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="Applications" stroke={chartTheme.series1} strokeWidth={2} fill="url(#fillApps)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#081227' }} />
                  <Area type="monotone" dataKey="Interviews" stroke={chartTheme.series2} strokeWidth={2} fill="url(#fillIvs)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#081227' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Application pipeline"
            description={`${stats.successRate || 0}% reached interview or offer`}
          />
          {applications.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" />
          ) : (
            <ul className="space-y-4">
              {pipeline.map(({ stage, count }) => (
                <li key={stage}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{stage}</span>
                    <span className="font-medium tabular-nums text-white">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${(count / pipelineMax) * 100}%`, backgroundColor: chartTheme.series1 }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Match quality" description={`${matches.length} AI matches · average ${stats.averageMatchScore || 0}%`} />
          <div className="h-56">
            {matches.length === 0 ? (
              <EmptyState icon={Sparkles} title="No matches yet" description="Matches appear once candidates upload a CV." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={matchBands} margin={{ top: 20, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="band" tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTheme.tooltip} formatter={(v) => [v, 'Matches']} />
                  <Bar dataKey="count" fill={chartTheme.series1} radius={[4, 4, 0, 0]} maxBarSize={24}>
                    <LabelList dataKey="count" position="top" fill="#cbd5e1" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2" padded={false}>
          <div className="p-6 pb-2">
            <CardHeader
              title="Strongest matches"
              description="Highest-scoring candidate–job pairs right now"
              action={
                <Link href="/admin/matcher" className="text-xs font-medium text-brand-lime hover:text-brand-lime-soft">
                  Create a match
                </Link>
              }
            />
          </div>
          {matches.length === 0 ? (
            <EmptyState icon={Sparkles} title="No matches yet" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {matches.slice(0, 5).map((m: any) => (
                <li key={m.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Identity name={m.candidate?.name} sub={`${m.job?.title || 'Unknown role'} · ${m.job?.company || ''}`} />
                  </div>
                  <Badge tone={m.match_score >= 85 ? 'success' : m.match_score >= 70 ? 'info' : 'neutral'}>
                    <span className="tabular-nums">{m.match_score}%</span>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {metrics.upcoming > 0 && (
        <Link
          href="/admin/interviews"
          className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-ink-900 px-6 py-4 text-sm transition-colors hover:bg-ink-850"
        >
          <span className="flex items-center gap-3 text-slate-300">
            <CalendarClock className="h-4 w-4 text-slate-500" />
            <span>
              <span className="font-medium text-white">{metrics.upcoming}</span> upcoming interview{metrics.upcoming === 1 ? '' : 's'} scheduled
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-500" />
        </Link>
      )}
    </div>
  );
}
