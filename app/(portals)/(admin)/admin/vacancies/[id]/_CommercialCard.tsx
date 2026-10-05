'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastNotification';
import { Badge, Button, Card, Field, Select, Textarea } from '../../_components/ui';
import { formatRate } from '@/lib/hire/terms';
import type { Act } from './page';

/** Which verified company a vacancy belongs to and which commercial terms will price its placements. */
export function CommercialCard({ data, act }: { data: any; act: Act }) {
  const { success } = useToast();
  const v = data.vacancy;
  const [model, setModel] = useState(v.commercial_model);
  const [subscriptionId, setSubscriptionId] = useState(v.partner_subscription_id ? String(v.partner_subscription_id) : '');
  const [programmeId, setProgrammeId] = useState(v.programme_id ? String(v.programme_id) : '');
  const [benchmark, setBenchmark] = useState(v.salary_benchmark_note || '');
  const locked = v.placements.length > 0;
  const sub = v.partner_subscription;
  const benchmarkAllowed = v.commercial_model === 'PARTNER' && sub?.status === 'ACTIVE' && sub.entitlements.includes('SALARY_BENCHMARKING');

  return (
    <Card>
      <h2 className="text-sm font-semibold text-white">Commercial terms</h2>
      <p className="mt-1 text-xs text-slate-500">Standard unless you explicitly link this vacancy to a verified company’s Hiring Partner subscription or a bulk programme.</p>

      <div className="mt-4 space-y-4">
        <Field label="Verified company" htmlFor="c-company" hint="Not inferred from the submitter’s email. Create companies under Companies & Partner.">
          <Select id="c-company" value={v.company_id ?? ''} onChange={(e) => act('LINK_COMPANY', { companyId: e.target.value || null }).then((r) => r.ok && success('Company updated'))}>
            <option value="">Not linked</option>
            {data.companies.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Terms" htmlFor="c-model">
          <Select id="c-model" value={model} disabled={locked} onChange={(e) => setModel(e.target.value)}>
            <option value="STANDARD">Standard (LaunchPath Hire)</option>
            {data.features.partner && <option value="PARTNER">Hiring Partner subscription</option>}
            {data.features.programmes && <option value="PROGRAMME">Bulk programme</option>}
          </Select>
        </Field>
        {model === 'PARTNER' && (
          <Select aria-label="Subscription" value={subscriptionId} disabled={locked} onChange={(e) => setSubscriptionId(e.target.value)}>
            <option value="">Choose the company’s subscription</option>
            {data.subscriptions.map((s: any) => (
              <option key={s.id} value={s.id}>
                #{s.id} · {s.status.toLowerCase()} · up to {s.vacancy_limit} vacancies
              </option>
            ))}
          </Select>
        )}
        {model === 'PROGRAMME' && (
          <Select aria-label="Programme" value={programmeId} disabled={locked} onChange={(e) => setProgrammeId(e.target.value)}>
            <option value="">Choose a programme</option>
            {data.programmes.map((p: any) => (
              <option key={p.id} value={p.id}>
                #{p.id} {p.name}
              </option>
            ))}
          </Select>
        )}
        {locked ? (
          <p className="text-xs text-slate-500">This vacancy has placements priced on its current terms, so they can’t change.</p>
        ) : (
          <Button
            size="sm"
            variant="primary"
            disabled={model === v.commercial_model && String(v.partner_subscription_id ?? '') === subscriptionId && String(v.programme_id ?? '') === programmeId}
            onClick={() => act('SET_COMMERCIAL_MODEL', { model, subscriptionId: Number(subscriptionId) || null, programmeId: Number(programmeId) || null }).then((r) => r.ok && success('Terms updated'))}
          >
            Apply terms
          </Button>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone={v.commercial_model === 'STANDARD' ? 'neutral' : 'brand'}>Current: {v.commercial_model.toLowerCase()}</Badge>
          {sub && (
            <Badge tone={sub.status === 'ACTIVE' ? 'success' : 'warning'}>
              Subscription {sub.status.toLowerCase().replace('_', ' ')} · {formatRate(sub.success_fee_bps)} · fee rule {sub.fee_rule.toLowerCase().replace(/_/g, ' ')}
            </Badge>
          )}
          {v.programme && (
            <Link href={`/admin/programmes/${v.programme.id}`} className="text-brand-lime hover:underline">
              Programme: {v.programme.name}
            </Link>
          )}
        </div>

        {v.commercial_model === 'PARTNER' && (
          <div>
            <Field label="Salary benchmark (shared with the employer)" htmlFor="c-bench" hint={benchmarkAllowed ? undefined : 'Available only on an active subscription that includes salary benchmarking.'}>
              <Textarea id="c-bench" rows={3} disabled={!benchmarkAllowed} value={benchmark} onChange={(e) => setBenchmark(e.target.value)} placeholder="Source and range, e.g. recent LaunchPath screenings for similar roles" />
            </Field>
            {benchmarkAllowed && (
              <div className="mt-2 flex justify-end">
                <Button size="sm" disabled={benchmark === (v.salary_benchmark_note || '')} onClick={() => act('UPDATE_VACANCY', { salary_benchmark_note: benchmark }).then((r) => r.ok && success('Benchmark saved'))}>
                  Save benchmark
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
