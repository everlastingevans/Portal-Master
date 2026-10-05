'use client';

import { useMemo, useState } from 'react';
import { Award, Plus } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { HireTerms, calculatePlacementFee, formatRand, formatRate } from '@/lib/hire/terms';
import { FOLLOW_UP_DAYS, INVOICE_STATUSES, RETENTION_OUTCOMES, labelFor } from '@/lib/hire/vacancy';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Textarea } from '../../_components/ui';
import { dateOnly, fmtDate } from '../_shared';
import type { Act } from './page';

const DAY = 86_400_000;

const MODEL_LABEL: Record<string, string> = { STANDARD: "standard", PARTNER: "Hiring Partner", PROGRAMME: "programme" };

/** The terms a placement was priced with (snapshotted when it was recorded). */
function feeTermsText(p: any) {
  if (p.fee_basis === "FLAT") return `Flat ${formatRand(p.fee_flat ?? p.placement_fee)} per hire (${MODEL_LABEL[p.commercial_model] || "programme"} terms)`;
  const bounds = [p.fee_min !== null && p.fee_min !== undefined && `min ${formatRand(p.fee_min)}`, p.fee_max !== null && p.fee_max !== undefined && `max ${formatRand(p.fee_max)}`].filter(Boolean).join(", ");
  return `${formatRate(p.fee_rate_bps)} of ${formatRand(p.annual_ctc)}${bounds ? ` · ${bounds}` : " · no min/max"} (${MODEL_LABEL[p.commercial_model] || "standard"} terms)`;
}

function followUpState(start: string, days: number, outcome: string | null) {
  const due = new Date(new Date(start).getTime() + days * DAY);
  if (outcome) return { due, label: labelFor(RETENTION_OUTCOMES, outcome), tone: outcome === 'RETAINED' ? 'success' : outcome === 'UNREACHABLE' ? 'warning' : 'danger' } as const;
  if (due.getTime() > Date.now()) return { due, label: 'Not due yet', tone: 'neutral' } as const;
  return { due, label: 'Due: not yet checked', tone: 'warning' } as const;
}

export function PlacementPanel({ vacancy, terms, act }: { vacancy: any; terms: HireTerms; act: Act }) {
  const [creating, setCreating] = useState(false);
  const entries = useMemo(() => vacancy.shortlists.flatMap((s: any) => s.candidates.map((c: any) => ({ ...c, shortlistTitle: s.title }))), [vacancy]);
  const available = entries.filter((c: any) => !c.placement);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-400">
          Record each hire with its start date and annual cost to company. The fee is calculated on the server using the terms in force when the placement is recorded, and those
          terms stay with the placement.
        </p>
        {!creating && (
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
            Record placement
          </Button>
        )}
      </div>

      {creating && <CreatePlacement entries={available} terms={terms} model={vacancy.commercial_model} act={act} onDone={() => setCreating(false)} />}

      {vacancy.placements.length === 0 && !creating && (
        <Card>
          <EmptyState icon={Award} title="No placement yet" description="When the employer hires a candidate, record the placement here." />
        </Card>
      )}

      {vacancy.placements.map((p: any) => (
        <PlacementCard key={p.id} p={p} act={act} />
      ))}
    </div>
  );
}

function CreatePlacement({ entries, terms, model, act, onDone }: { entries: any[]; terms: HireTerms; model: string; act: Act; onDone: () => void }) {
  const { success } = useToast();
  const [entryId, setEntryId] = useState(entries[0]?.id ? String(entries[0].id) : '');
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [ctc, setCtc] = useState('');
  const [busy, setBusy] = useState(false);
  const ctcNum = Number(ctc.replace(/[\s,R]/gi, ''));
  // Only standard terms can be previewed here; partner and programme fees use the agreed terms on save
  const preview = model === "STANDARD" && Number.isInteger(ctcNum) && ctcNum >= 12_000 ? calculatePlacementFee(ctcNum, terms) : null;

  return (
    <Card>
      <h2 className="text-sm font-semibold text-white">Record a placement</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Hired candidate" htmlFor="pl-entry">
          <Select id="pl-entry" value={entryId} onChange={(e) => setEntryId(e.target.value)}>
            {entries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name} ({c.shortlistTitle})
              </option>
            ))}
            <option value="">Someone not on a shortlist</option>
          </Select>
        </Field>
        {!entryId && (
          <Field label="Candidate name" htmlFor="pl-name">
            <Input id="pl-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field label="Start date" htmlFor="pl-start">
          <Input id="pl-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Annual cost to company (R)" htmlFor="pl-ctc" hint={preview !== null ? `Placement fee will be ${formatRand(preview)} (${formatRate(terms.feeRateBps)}, min ${formatRand(terms.feeMin)}, max ${formatRand(terms.feeMax)})` : model !== "STANDARD" ? `Fee is calculated on save from the agreed ${MODEL_LABEL[model]} terms.` : undefined}>
          <Input id="pl-ctc" inputMode="numeric" value={ctc} onChange={(e) => setCtc(e.target.value)} placeholder="180000" />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            const r = await act('CREATE_PLACEMENT', { shortlistCandidateId: entryId ? Number(entryId) : null, candidate_name: name, start_date: start, annual_ctc: ctc });
            setBusy(false);
            if (r.ok) {
              success('Placement recorded');
              onDone();
            }
          }}
        >
          Save placement
        </Button>
      </div>
    </Card>
  );
}

function PlacementCard({ p, act }: { p: any; act: Act }) {
  const { success } = useToast();
  const [ctc, setCtc] = useState(String(p.annual_ctc));
  const [start, setStart] = useState(dateOnly(p.start_date));
  const [feedback, setFeedback] = useState(p.employer_feedback || '');
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(FOLLOW_UP_DAYS.map((d) => [d, { outcome: p[`check_${d}_outcome`] || '', note: p[`check_${d}_note`] || '' }])) as Record<number, { outcome: string; note: string }>,
  );

  const save = async (payload: Record<string, unknown>, message = 'Placement updated') => {
    const r = await act('UPDATE_PLACEMENT', { placementId: p.id, ...payload });
    if (r.ok) success(message);
  };

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{p.candidate_name}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Started {fmtDate(p.start_date)} · guarantee ends {fmtDate(p.guarantee_end_date)}
            {new Date(p.guarantee_end_date) > new Date() ? ' (active)' : ' (ended)'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums text-white">{formatRand(p.placement_fee)}</p>
          <p className="text-xs text-slate-500">
            {feeTermsText(p)} · {p.guarantee_days}-day guarantee
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Field label="Annual CTC (R)" htmlFor={`p-ctc-${p.id}`}>
          <Input id={`p-ctc-${p.id}`} inputMode="numeric" value={ctc} onChange={(e) => setCtc(e.target.value)} onBlur={() => ctc !== String(p.annual_ctc) && save({ annual_ctc: ctc }, 'Fee recalculated')} />
        </Field>
        <Field label="Start date" htmlFor={`p-start-${p.id}`}>
          <Input id={`p-start-${p.id}`} type="date" value={start} onChange={(e) => setStart(e.target.value)} onBlur={() => start !== dateOnly(p.start_date) && save({ start_date: start })} />
        </Field>
        <Field
          label="Invoice"
          htmlFor={`p-inv-${p.id}`}
          hint={[p.invoiced_at && `Invoiced ${fmtDate(p.invoiced_at)}`, p.paid_at && `Paid ${fmtDate(p.paid_at)}`].filter(Boolean).join(' · ') || undefined}
        >
          <Select id={`p-inv-${p.id}`} value={p.invoice_status} onChange={(e) => save({ invoice_status: e.target.value }, 'Invoice status updated')}>
            {INVOICE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <h3 className="mt-8 text-sm font-semibold text-white">Follow-up checks</h3>
      <p className="mt-1 text-xs text-slate-500">“Still employed” can be recorded once a check is due. A departure can be recorded at any time and carries forward to later checks in reporting.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {FOLLOW_UP_DAYS.map((d) => {
          const state = followUpState(p.start_date, d, p[`check_${d}_outcome`]);
          const c = checks[d];
          return (
            <div key={d} className="rounded-xl border border-white/[0.06] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{d}-day check</p>
                <Badge tone={state.tone}>{state.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Due {fmtDate(state.due)}
                {p[`check_${d}_at`] ? ` · recorded ${fmtDate(p[`check_${d}_at`])}` : ''}
              </p>
              <div className="mt-3 space-y-3">
                <Select aria-label={`${d}-day outcome`} value={c.outcome} onChange={(e) => setChecks((s) => ({ ...s, [d]: { ...s[d], outcome: e.target.value } }))}>
                  <option value="">Not yet checked</option>
                  {RETENTION_OUTCOMES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Textarea rows={2} aria-label={`${d}-day note`} placeholder="Note" value={c.note} onChange={(e) => setChecks((s) => ({ ...s, [d]: { ...s[d], note: e.target.value } }))} />
                <Button
                  size="sm"
                  disabled={c.outcome === (p[`check_${d}_outcome`] || '') && c.note === (p[`check_${d}_note`] || '')}
                  onClick={() => save({ [`check_${d}_outcome`]: c.outcome || null, [`check_${d}_note`]: c.note }, `${d}-day check saved`)}
                >
                  Save check
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <Field label="Employer feedback on the hire" htmlFor={`p-fb-${p.id}`}>
          <Textarea id={`p-fb-${p.id}`} rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </Field>
        <div className="mt-2 flex justify-end">
          <Button size="sm" disabled={feedback === (p.employer_feedback || '')} onClick={() => save({ employer_feedback: feedback }, 'Feedback saved')}>
            Save feedback
          </Button>
        </div>
      </div>
    </Card>
  );
}
