'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, PageHeader, PageSkeleton, Segmented } from '../../_components/ui';
import { formatRand } from '@/lib/hire/terms';
import type { HireMetrics, Rate } from '@/lib/hire/metrics';
import type { Breakdowns } from '@/lib/hire/breakdowns';
import { BreakdownsSection, MatchingEvaluation } from './_Breakdowns';

type WindowKey = '30' | '90' | '180' | '365' | 'all';

const pct = (v: number | null) => (v === null ? null : `${Math.round(v * 100)}%`);
const num = (v: number | null, digits = 1) => (v === null ? null : Number(v.toFixed(digits)).toString());

function Metric({ title, value, sub, definition }: { title: string; value: string | null; sub?: string; definition: string }) {
  return (
    <Card>
      <p className="text-xs font-medium text-slate-400">{title}</p>
      <p className={value === null ? 'mt-2 text-lg font-medium text-slate-500' : 'mt-2 text-3xl font-semibold tabular-nums text-white'}>{value ?? 'No data yet'}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      <details className="mt-4 text-xs text-slate-500">
        <summary className="cursor-pointer select-none text-slate-400 hover:text-white">How this is calculated</summary>
        <p className="mt-2 leading-relaxed">{definition}</p>
      </details>
    </Card>
  );
}

const rateSub = (r: Rate) => `${r.numerator} of ${r.denominator}`;

export default function HireReportPage() {
  const [win, setWin] = useState<WindowKey>('90');
  const [metrics, setMetrics] = useState<HireMetrics | null>(null);
  const [breakdowns, setBreakdowns] = useState<Breakdowns | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`/api/superadmin/hire-metrics?days=${win}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load the report');
      setMetrics(json.metrics);
      setBreakdowns(json.breakdowns);
    } catch (e: any) {
      setError(e.message);
    }
  }, [win]);

  useEffect(() => {
    load();
  }, [load]);

  if (!metrics && !error) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <Link href="/admin/vacancies" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Vacancies
      </Link>
      <PageHeader
        title="Hiring report"
        description="LaunchPath Hire funnel from real vacancy, shortlist, interview, offer and placement records. Open “How this is calculated” on any metric for its numerator, denominator and time window."
      />
      <Segmented
        value={win}
        onChange={setWin}
        options={[
          { value: '30', label: '30 days' },
          { value: '90', label: '90 days' },
          { value: '180', label: '180 days' },
          { value: '365', label: '12 months' },
          { value: 'all', label: 'All time' },
        ]}
      />
      {error && <Card><p className="text-sm text-rose-300">{error}</p></Card>}

      {metrics && (
        <>
          {metrics.vacanciesInWindow === 0 && (
            <Card>
              <p className="text-sm text-slate-300">No vacancies were submitted in this window, so the funnel metrics below have no data yet.</p>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Metric title="Live vacancies (now)" value={String(metrics.liveVacancies.value)} definition={metrics.liveVacancies.definition} />
            <Metric
              title="Vacancy to shortlist (median working days)"
              value={num(metrics.timeToShortlist.medianWorkingDays)}
              sub={
                metrics.timeToShortlist.count
                  ? `Average ${num(metrics.timeToShortlist.averageWorkingDays)} · ${pct(metrics.timeToShortlist.withinFiveWorkingDays.value)} within 5 working days · ${metrics.timeToShortlist.count} vacancies`
                  : undefined
              }
              definition={`${metrics.timeToShortlist.definition} Within-target share: ${metrics.timeToShortlist.withinFiveWorkingDays.definition}`}
            />
            <Metric title="Shortlist to interview" value={pct(metrics.shortlistToInterview.value)} sub={rateSub(metrics.shortlistToInterview)} definition={metrics.shortlistToInterview.definition} />
            <Metric title="Interview to offer" value={pct(metrics.interviewToOffer.value)} sub={rateSub(metrics.interviewToOffer)} definition={metrics.interviewToOffer.definition} />
            <Metric
              title="Vacancy to hire"
              value={pct(metrics.vacancyToHire.value)}
              sub={`${rateSub(metrics.vacancyToHire)} · ${metrics.vacancyToHire.stillOpen} still in progress`}
              definition={metrics.vacancyToHire.definition}
            />
            <Metric
              title="Offer acceptance"
              value={pct(metrics.offerAcceptance.value)}
              sub={`${rateSub(metrics.offerAcceptance)} · ${metrics.offerAcceptance.awaitingResponse} awaiting response`}
              definition={metrics.offerAcceptance.definition}
            />
            <Metric
              title="Average placement fee"
              value={metrics.averagePlacementFee.value === null ? null : formatRand(metrics.averagePlacementFee.value)}
              sub={metrics.averagePlacementFee.count ? `${metrics.averagePlacementFee.count} placements · ${formatRand(metrics.averagePlacementFee.total)} total` : undefined}
              definition={metrics.averagePlacementFee.definition}
            />
            {([60, 90] as const).map((d) => {
              const r = metrics[`retention${d}` as 'retention60' | 'retention90'];
              return (
                <Metric
                  key={d}
                  title={`${d}-day retention`}
                  value={pct(r.value)}
                  sub={
                    r.eligible || r.notYetDue
                      ? `${r.retained} retained · ${r.departed} left · ${r.unknownOrNotChecked} not checked or unconfirmed · ${r.notYetDue} not yet ${d} days in`
                      : 'No placements old enough to assess'
                  }
                  definition={r.definition}
                />
              );
            })}
            <Metric title="Repeat employers" value={pct(metrics.repeatEmployers.value)} sub={rateSub(metrics.repeatEmployers)} definition={metrics.repeatEmployers.definition} />
          </div>
          {breakdowns && <BreakdownsSection data={breakdowns} />}
          <MatchingEvaluation />
          <p className="text-xs text-slate-500">
            Window: {metrics.window.from ? `${new Date(metrics.window.from).toLocaleDateString('en-ZA')} to ${new Date(metrics.window.to).toLocaleDateString('en-ZA')}` : 'all records'}. Working days
            exclude weekends but not South African public holidays.
          </p>
        </>
      )}
    </div>
  );
}
