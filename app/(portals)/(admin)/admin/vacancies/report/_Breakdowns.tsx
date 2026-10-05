'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, Segmented, Table, TBody, Td, Th, THead, Tr } from '../../_components/ui';
import type { Breakdowns } from '@/lib/hire/breakdowns';
import { formatRand } from '@/lib/hire/terms';

type GroupKey = 'byCategory' | 'byEmployer' | 'byCohort';
const pct = (r: { value: number | null; numerator: number; denominator: number }) => (r.value === null ? '—' : `${Math.round(r.value * 100)}% (${r.numerator}/${r.denominator})`);
const num = (v: number | null) => (v === null ? '—' : String(Number(v.toFixed(1))));

export function BreakdownsSection({ data }: { data: Breakdowns }) {
  const [group, setGroup] = useState<GroupKey>('byCategory');
  const rows = data[group];
  const rev = data.revenue;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-semibold text-white">Revenue</h2>
        <p className="mt-1 text-xs text-slate-500">Invoiced is not cash received; only “paid” is. Windowed figures use the date the fee was invoiced or paid.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            ['Placement fees invoiced (window)', rev.placementFeesInvoicedInWindow],
            ['Placement fees paid (window)', rev.placementFeesPaidInWindow],
            ['Invoiced, awaiting payment (all time)', rev.outstandingInvoiced],
            ['Placed, not yet invoiced (all time)', rev.notYetInvoiced],
          ].map(([k, v]) => (
            <div key={k as string}>
              <p className="text-xs text-slate-400">{k}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white">{formatRand(v as number)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
          {rev.byModel.map((m) => (
            <span key={m.model} className="rounded-lg bg-white/[0.04] px-2.5 py-1 ring-1 ring-inset ring-white/10">
              {m.model.toLowerCase()}: invoiced {formatRand(m.invoiced)}, paid {formatRand(m.paid)}
            </span>
          ))}
          <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 ring-1 ring-inset ring-white/10">Hiring Partner subscription payments recorded: {formatRand(rev.subscriptionPaymentsRecorded)}</span>
          {rev.sandboxTestPayments > 0 && <Badge tone="warning">Sandbox test payments (not revenue): {formatRand(rev.sandboxTestPayments)}</Badge>}
        </div>
      </Card>

      <Card padded={false}>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Comparisons</h2>
            <p className="mt-1 text-xs text-slate-500">Groups with fewer than 5 vacancies are marked as small samples. “—” means no data yet, not zero.</p>
          </div>
          <Segmented
            value={group}
            onChange={setGroup}
            options={[
              { value: 'byCategory', label: 'Role category' },
              { value: 'byEmployer', label: 'Employer' },
              { value: 'byCohort', label: 'Monthly cohort' },
            ]}
          />
        </div>
        <Table>
          <THead>
            <Th>Group</Th>
            <Th align="right">Vacancies</Th>
            <Th align="right">To shortlist (wd)</Th>
            <Th align="right">To hire (days)</Th>
            <Th align="right">Shortlist → interview</Th>
            <Th align="right">Interview → offer</Th>
            <Th align="right">Vacancy → hire</Th>
            <Th align="right">Fees invoiced / paid</Th>
            <Th align="right">60-day retention</Th>
            <Th align="right">Repeat employers</Th>
          </THead>
          <TBody>
            {rows.map((r) => (
              <Tr key={r.key}>
                <Td>
                  <span className="text-slate-200">{r.label}</span> {r.smallSample && <Badge tone="warning">small sample</Badge>}
                  {r.stillOpen > 0 && <p className="text-xs text-slate-500">{r.stillOpen} still in progress</p>}
                </Td>
                <Td align="right" className="tabular-nums">{r.vacancies}</Td>
                <Td align="right" className="tabular-nums">{num(r.medianWorkingDaysToShortlist)}</Td>
                <Td align="right" className="tabular-nums">{num(r.medianDaysToHire)}</Td>
                <Td align="right" className="tabular-nums text-xs">{pct(r.shortlistToInterview)}</Td>
                <Td align="right" className="tabular-nums text-xs">{pct(r.interviewToOffer)}</Td>
                <Td align="right" className="tabular-nums text-xs">{pct(r.vacancyToHire)}</Td>
                <Td align="right" className="tabular-nums text-xs">
                  {formatRand(r.revenue.invoiced)} / {formatRand(r.revenue.paid)}
                </Td>
                <Td align="right" className="tabular-nums text-xs">
                  {pct(r.retention60)}
                  {r.retention60.unknownOrNotChecked > 0 && <span className="block text-slate-500">{r.retention60.unknownOrNotChecked} unchecked</span>}
                  {r.retention60.notYetDue > 0 && <span className="block text-slate-500">{r.retention60.notYetDue} too recent</span>}
                </Td>
                <Td align="right" className="tabular-nums text-xs">{pct(r.repeatEmployers)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        {rows.length === 0 && <p className="p-5 text-sm text-slate-500">No vacancies in this window.</p>}
        <details className="border-t border-white/[0.06] p-5 text-xs text-slate-400">
          <summary className="cursor-pointer text-slate-300">How these are calculated</summary>
          <dl className="mt-3 space-y-2">
            {Object.entries(data.definitions).map(([k, v]) => (
              <div key={k}>
                <dt className="font-medium text-slate-300">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Card>
    </div>
  );
}

export function MatchingEvaluation() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch('/api/superadmin/matching/evaluation', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ error: true }));
  }, []);
  if (!data) return null;
  return (
    <Card>
      <h2 className="text-sm font-semibold text-white">Matching evaluation</h2>
      {data.error ? (
        <p className="mt-2 text-sm text-rose-300">Could not run the evaluation.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-300">{data.conclusion}</p>
          {data.sufficient && data.recallAtK && (
            <p className="mt-2 text-sm text-slate-300">
              Top {data.k}: explainable matcher found {Math.round(data.recallAtK.explainable * 100)}% of recruiter-approved candidates; skills-only baseline {Math.round(data.recallAtK.skillsOnlyBaseline * 100)}%.
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">{data.method}</p>
        </>
      )}
    </Card>
  );
}
