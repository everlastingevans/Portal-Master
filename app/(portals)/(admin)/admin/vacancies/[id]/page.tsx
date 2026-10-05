'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, RotateCw } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { Badge, Button, Card, Field, PageSkeleton, Segmented, Select, Textarea } from '../../_components/ui';
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  HIRE_EVENT_TYPES,
  ROLE_CATEGORIES,
  VACANCY_STATUSES,
  WORK_ARRANGEMENTS,
  labelFor,
} from '@/lib/hire/vacancy';
import { formatRand } from '@/lib/hire/terms';
import { fmtDate, fmtDateTime, vacancyTone } from '../_shared';
import { ShortlistsPanel } from './_ShortlistsPanel';
import { PlacementPanel } from './_PlacementPanel';
import { CommercialCard } from './_CommercialCard';

export type Act = (action: string, payload?: Record<string, unknown>) => Promise<{ ok: boolean; data?: any; error?: string }>;

type Tab = 'overview' | 'shortlists' | 'placement' | 'activity';

const EVENT_LABELS: Record<string, string> = {
  ROLE_CALIBRATION: 'Role calibration started',
  SHORTLIST_SENT: 'Shortlist sent',
  INTERVIEW_REQUESTED: 'Interview requested',
  OFFER_MADE: 'Offer made',
  OFFER_ACCEPTED: 'Offer accepted',
  OFFER_DECLINED: 'Offer declined',
  HIRE_COMPLETED: 'Hire completed',
  FEE_INVOICED: 'Fee invoiced',
  FEE_PAID: 'Fee paid',
};

const EMAIL_LABELS: Record<string, string> = {
  vacancy_confirmation: 'Employer confirmation',
  ops_new_vacancy: 'Operations alert: new vacancy',
  shortlist_ready: 'Employer: shortlist ready',
  ops_interview_request: 'Operations alert: interview request',
};

const EMAIL_TONE: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = { SENT: 'success', FAILED: 'danger', NOT_CONFIGURED: 'warning', SENDING: 'neutral', PENDING: 'neutral' };

export default function VacancyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { error: toastError, success: toastSuccess } = useToast();
  const [data, setData] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<Tab>('shortlists');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/superadmin/vacancies/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load the vacancy');
      setData(json);
      setNotes(json.vacancy.internal_notes || '');
    } catch (e: any) {
      setLoadError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act: Act = useCallback(
    async (action, payload = {}) => {
      try {
        const res = await fetch(`/api/superadmin/vacancies/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Something went wrong');
        await load();
        return { ok: true, data: json };
      } catch (e: any) {
        toastError(e.message);
        return { ok: false, error: e.message };
      }
    },
    [id, load, toastError],
  );

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/admin/vacancies" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All vacancies
        </Link>
        <Card>
          <p className="text-sm text-rose-300">{loadError}</p>
        </Card>
      </div>
    );
  }
  if (!data) return <PageSkeleton />;

  const v = data.vacancy;
  const candidatesCount = v.shortlists.reduce((a: number, s: any) => a + s.candidates.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/vacancies" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All vacancies
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs tabular-nums text-slate-500">
              #{v.id} · received {fmtDate(v.created_at)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{v.role_title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {v.company_name} · {v.location} · {v.role_category === 'OTHER' ? `Other: ${v.role_category_other}` : labelFor(ROLE_CATEGORIES, v.role_category)}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <Field label="Status" htmlFor="v-status">
              <Select id="v-status" value={v.status} onChange={(e) => act('UPDATE_VACANCY', { status: e.target.value }).then((r) => r.ok && toastSuccess('Status updated'))}>
                {VACANCY_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Owner" htmlFor="v-owner">
              <Select id="v-owner" value={v.owner_id ?? ''} onChange={(e) => act('UPDATE_VACANCY', { owner_id: e.target.value || null }).then((r) => r.ok && toastSuccess('Owner updated'))}>
                <option value="">Unassigned</option>
                {data.owners.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.name || o.email}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'shortlists', label: 'Shortlists', count: candidatesCount },
          { value: 'placement', label: 'Placement', count: v.placements.length },
          { value: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <h2 className="text-sm font-semibold text-white">Submission</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {(
                [
                  ['Work arrangement', labelFor(WORK_ARRANGEMENTS, v.work_arrangement)],
                  ['Salary (monthly)', `${formatRand(v.salary_min)} – ${formatRand(v.salary_max)}`],
                  ['Employment', labelFor(EMPLOYMENT_TYPES, v.employment_type)],
                  ['Experience', labelFor(EXPERIENCE_LEVELS, v.required_experience)],
                  ['Key skills', v.key_skills.join(', ') || '—'],
                  ['Start date', v.start_date ? fmtDate(v.start_date) : 'Flexible'],
                ] as [string, string][]
              ).map(([k, val]) => (
                <div key={k} className="grid grid-cols-[140px_1fr] gap-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-200">{val}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-xs font-medium text-slate-400">Role description</p>
            <p className="mt-1.5 whitespace-pre-line rounded-xl bg-ink-950/60 p-3 text-sm leading-relaxed text-slate-300">{v.description}</p>
          </Card>

          <div className="space-y-6">
            <CommercialCard data={data} act={act} />
            <Card>
              <h2 className="text-sm font-semibold text-white">Employer contact</h2>
              <p className="mt-1 text-xs text-slate-500">As submitted; not verified.</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="text-slate-200">{v.contact_name}</div>
                <a className="block text-brand-lime hover:underline" href={`mailto:${v.contact_email}`}>
                  {v.contact_email}
                </a>
                <a className="block text-brand-lime hover:underline" href={`tel:${v.contact_phone}`}>
                  {v.contact_phone}
                </a>
              </dl>
              {data.emailMatchesAccount && (
                <div className="mt-3">
                  <Badge tone="info">An employer account uses this email (not verified as the same person)</Badge>
                </div>
              )}
              {data.otherVacancies.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-slate-400">Other vacancies from this contact</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {data.otherVacancies.map((o: any) => (
                      <li key={o.id}>
                        <Link href={`/admin/vacancies/${o.id}`} className="text-slate-200 hover:underline">
                          #{o.id} {o.role_title}
                        </Link>{' '}
                        <span className="text-xs text-slate-500">· {labelFor(VACANCY_STATUSES, o.status)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
            <Card>
              <Field label="Internal notes (calibration, context)" htmlFor="v-notes">
                <Textarea id="v-notes" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="primary" disabled={notes === (v.internal_notes || '')} onClick={() => act('UPDATE_VACANCY', { internal_notes: notes }).then((r) => r.ok && toastSuccess('Notes saved'))}>
                  Save notes
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'shortlists' && <ShortlistsPanel vacancy={v} act={act} suggestionsEnabled={data.features.suggestions} onGoToPlacement={() => setTab('placement')} />}
      {tab === 'placement' && <PlacementPanel vacancy={v} terms={data.terms} act={act} />}

      {tab === 'activity' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-sm font-semibold text-white">Status history</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {v.events.map((e: any) => (
                <li key={e.id} className="flex items-center justify-between gap-3">
                  <Badge tone={vacancyTone(e.to_status)} dot>
                    {labelFor(VACANCY_STATUSES, e.to_status)}
                  </Badge>
                  <span className="text-xs tabular-nums text-slate-500">
                    {fmtDateTime(e.created_at)} {e.actor_id ? '' : '· automatic'}
                  </span>
                </li>
              ))}
            </ul>
            <h2 className="mt-8 text-sm font-semibold text-white">Hiring milestones</h2>
            {v.hire_events.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No milestones yet.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {v.hire_events
                  .filter((e: any) => (HIRE_EVENT_TYPES as readonly string[]).includes(e.type))
                  .map((e: any) => (
                    <li key={e.id} className="flex items-center justify-between gap-3">
                      <span className="text-slate-200">{EVENT_LABELS[e.type] || e.type}</span>
                      <span className="text-xs tabular-nums text-slate-500">{fmtDateTime(e.occurred_at)}</span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Emails</h2>
              <Link href="/admin/vacancies/emails" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                Preview templates <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            {data.emails.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No emails recorded for this vacancy.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/[0.06]">
                {data.emails.map((m: any) => (
                  <li key={m.id} className="py-3 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-slate-200">{EMAIL_LABELS[m.template] || m.template}</span>
                      <Badge tone={EMAIL_TONE[m.status] || 'neutral'}>{m.status === 'NOT_CONFIGURED' ? 'Not sent: email not configured' : m.status.toLowerCase()}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      To {m.to_email} · {m.attempts} attempt{m.attempts === 1 ? '' : 's'} · {m.sent_at ? `sent ${fmtDateTime(m.sent_at)}` : `created ${fmtDateTime(m.created_at)}`}
                    </p>
                    {m.last_error && m.status !== 'SENT' && <p className="mt-1 text-xs text-rose-300">{m.last_error}</p>}
                    {m.status !== 'SENT' && m.template !== 'shortlist_ready' && (
                      <Button
                        className="mt-2"
                        size="sm"
                        icon={RotateCw}
                        onClick={() =>
                          act('RETRY_EMAIL', { emailLogId: m.id }).then((r) => {
                            if (r.ok) r.data.outcome === 'SENT' ? toastSuccess('Email sent') : toastError(`Not sent: ${String(r.data.outcome).toLowerCase().replace('_', ' ')}`);
                          })
                        }
                      >
                        Retry
                      </Button>
                    )}
                    {m.status !== 'SENT' && m.template === 'shortlist_ready' && (
                      <p className="mt-1 text-xs text-slate-500">Shortlist emails contain a one-time link. Send a new link from the Shortlists tab instead.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
