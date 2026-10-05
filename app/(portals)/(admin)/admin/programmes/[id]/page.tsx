'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { Badge, Button, Card, Field, Input, PageSkeleton, Select, Textarea } from '../../_components/ui';
import { PROGRAMME_STATUSES } from '@/lib/hire/programmes';
import { formatRand } from '@/lib/hire/terms';
import { INVOICE_STATUSES, VACANCY_STATUSES, labelFor } from '@/lib/hire/vacancy';
import { fmtDate } from '../../vacancies/_shared';

export default function ProgrammeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { error: toastError, success } = useToast();
  const [data, setData] = useState<any>(null);
  const [terms, setTerms] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const r = await fetch(`/api/superadmin/programmes/${id}`, { cache: 'no-store' });
    const j = await r.json();
    if (!r.ok) return toastError(j.error || 'Could not load');
    setData(j);
    setNotes(j.programme.internal_notes || '');
    const s = j.tierSuggestion;
    const tier = s.matches.length === 1 ? s.matches[0] : null;
    setTerms({
      pricing_model: tier && tier.perHireFee !== null ? 'TIER' : 'CUSTOM_QUOTE',
      tier_label: tier?.label ?? '',
      per_hire_fee: tier?.perHireFee ?? '',
      guarantee_days: '',
      agreed_on: new Date().toISOString().slice(0, 10),
      note: '',
    });
  }, [id, toastError]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string, payload: Record<string, unknown>) => {
    const r = await fetch('/api/superadmin/programmes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload: { programmeId: Number(id), ...payload } }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      toastError(j.error || 'Something went wrong');
      return null;
    }
    await load();
    return j;
  };

  if (!data || !terms) return <PageSkeleton />;
  const p = data.programme;
  const s = data.summary;
  const suggestion = data.tierSuggestion;

  return (
    <div className="space-y-6">
      <Link href="/admin/programmes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Programmes
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs text-slate-500">
            #{p.id} · {p.source === 'ENQUIRY_FORM' ? 'website enquiry' : 'created by staff'} · {fmtDate(p.created_at)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{p.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {p.company_name} · {p.contact_name} · <a className="text-brand-lime hover:underline" href={`mailto:${p.contact_email}`}>{p.contact_email}</a>
            {p.contact_phone ? ` · ${p.contact_phone}` : ''}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
          <Field label="Status" htmlFor="pg-status">
            <Select id="pg-status" value={p.status} onChange={(e) => act('UPDATE_PROGRAMME', { status: e.target.value }).then((r) => r && success('Status updated'))}>
              {PROGRAMME_STATUSES.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Owner" htmlFor="pg-owner">
            <Select id="pg-owner" value={p.owner_id ?? ''} onChange={(e) => act('UPDATE_PROGRAMME', { owner_id: e.target.value || null })}>
              <option value="">Unassigned</option>
              {data.admins.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.email}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Verified company" htmlFor="pg-company">
            <Select id="pg-company" value={p.company_id ?? ''} onChange={(e) => act('UPDATE_PROGRAMME', { company_id: e.target.value || null })}>
              <option value="">Not linked</option>
              {data.companies.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['Target hires', p.target_hires],
          ['Placed', s.placements],
          ['Linked vacancies', s.linkedVacancies],
          ['Candidates shortlisted', s.shortlistedCandidates],
        ].map(([k, v]) => (
          <Card key={k as string}>
            <p className="text-xs text-slate-400">{k}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{v}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-white">Requirements</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">{p.requirements || '—'}</p>
          {p.locations && <p className="mt-3 text-xs text-slate-400">Locations: {p.locations}</p>}
          {data.enquiryEmail && (
            <p className="mt-3 text-xs text-slate-500">
              Ops enquiry email: {data.enquiryEmail.status.toLowerCase().replace('_', ' ')}
              {data.enquiryEmail.last_error ? ` (${data.enquiryEmail.last_error})` : ''}
            </p>
          )}
          <div className="mt-5">
            <Field label="Internal notes" htmlFor="pg-notes">
              <Textarea id="pg-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="mt-2 flex justify-end">
              <Button size="sm" disabled={notes === (p.internal_notes || '')} onClick={() => act('UPDATE_PROGRAMME', { internal_notes: notes }).then((r) => r && success('Saved'))}>
                Save notes
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-white">Accepted commercial terms</h2>
          <p className="mt-1 text-xs text-slate-500">Each record applies to placements made after it is agreed. Earlier placements keep the fee they were priced with.</p>
          {p.terms.length === 0 ? (
            <p className="mt-3 text-sm text-amber-300">No terms recorded. Programme placements are refused until accepted terms are recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {p.terms.map((t: any, i: number) => (
                <li key={t.id} className="rounded-xl border border-white/[0.06] p-3">
                  <p className="text-slate-200">
                    {formatRand(t.per_hire_fee)} per hire · {t.pricing_model === 'TIER' ? t.tier_label : 'custom quote'} · {t.guarantee_days}-day guarantee {i === 0 && <Badge tone="brand">current</Badge>}
                  </p>
                  <p className="text-xs text-slate-500">
                    Agreed {fmtDate(t.agreed_on)}
                    {t.note ? ` · ${t.note}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 space-y-3 rounded-xl border border-white/[0.06] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Record accepted terms</p>
            {suggestion.ambiguous && (
              <p className="flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {p.target_hires} hires falls into more than one tier ({suggestion.matches.map((m: any) => m.label).join(' and ')}). Choose what was actually agreed.
              </p>
            )}
            {suggestion.none && <p className="text-xs text-slate-400">{p.target_hires} hires is outside every configured tier; record a custom quote if one was agreed.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Select aria-label="Pricing model" value={terms.pricing_model} onChange={(e) => setTerms({ ...terms, pricing_model: e.target.value })}>
                <option value="TIER">Configured tier</option>
                <option value="CUSTOM_QUOTE">Custom quote</option>
              </Select>
              {terms.pricing_model === 'TIER' && (
                <Select
                  aria-label="Tier"
                  value={terms.tier_label}
                  onChange={(e) => {
                    const t = data.tiers.find((x: any) => x.label === e.target.value);
                    setTerms({ ...terms, tier_label: e.target.value, per_hire_fee: t?.perHireFee ?? '' });
                  }}
                >
                  <option value="">Choose tier</option>
                  {data.tiers.map((t: any) => (
                    <option key={t.label} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              )}
              <Field label="Agreed fee per hire (R)" htmlFor="t-fee">
                <Input id="t-fee" inputMode="numeric" value={terms.per_hire_fee} onChange={(e) => setTerms({ ...terms, per_hire_fee: e.target.value })} />
              </Field>
              <Field label="Agreed guarantee (days)" htmlFor="t-g" hint="Enter 0 if no guarantee applies.">
                <Input id="t-g" inputMode="numeric" value={terms.guarantee_days} onChange={(e) => setTerms({ ...terms, guarantee_days: e.target.value })} />
              </Field>
              <Field label="Accepted on" htmlFor="t-on">
                <Input id="t-on" type="date" value={terms.agreed_on} onChange={(e) => setTerms({ ...terms, agreed_on: e.target.value })} />
              </Field>
              <Field label="Reference" htmlFor="t-note">
                <Input id="t-note" value={terms.note} onChange={(e) => setTerms({ ...terms, note: e.target.value })} placeholder="e.g. Signed quote Q-2026-014" />
              </Field>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                act('AGREE_TERMS', { ...terms, guarantee_days: Number(terms.guarantee_days) }).then((r) => {
                  if (r) success(r.differsFromTier ? 'Terms recorded (fee differs from the tier price)' : 'Terms recorded');
                })
              }
            >
              Record terms
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-white">Linked vacancies and placements</h2>
        <p className="mt-1 text-xs text-slate-500">Link vacancies from each vacancy’s page (Commercial terms → Bulk programme).</p>
        {p.vacancies.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No vacancies linked yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {p.vacancies.map((v: any) => (
              <li key={v.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/admin/vacancies/${v.id}`} className="font-medium text-white hover:underline">
                    #{v.id} {v.role_title}
                  </Link>
                  <Badge>{labelFor(VACANCY_STATUSES, v.status)}</Badge>
                </div>
                {v.placements.map((pl: any) => (
                  <p key={pl.id} className="mt-1 text-xs text-slate-400">
                    {pl.candidate_name} · started {fmtDate(pl.start_date)} · {formatRand(pl.placement_fee)} · {labelFor(INVOICE_STATUSES, pl.invoice_status)}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 text-sm sm:grid-cols-4">
          <p className="text-slate-400">
            Total fees <span className="block text-lg font-semibold tabular-nums text-white">{formatRand(s.fees.total)}</span>
          </p>
          <p className="text-slate-400">
            Not invoiced <span className="block text-lg font-semibold tabular-nums text-white">{formatRand(s.fees.notInvoiced)}</span>
          </p>
          <p className="text-slate-400">
            Invoiced <span className="block text-lg font-semibold tabular-nums text-white">{formatRand(s.fees.invoiced)}</span>
          </p>
          <p className="text-slate-400">
            Paid <span className="block text-lg font-semibold tabular-nums text-white">{formatRand(s.fees.paid)}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
