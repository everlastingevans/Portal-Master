'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, PageHeader, PageSkeleton } from '../_components/ui';

// Commercial setup status: which Phase 3 features are switched on, which business decisions are open,
// and which credentials are present. Flags are environment variables, so changing them needs a deploy.
export default function SetupPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/superadmin/setup', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Could not load');
        setData(j);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Card><p className="text-sm text-rose-300">{error}</p></Card>;
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commercial setup"
        description="Features awaiting commercial validation are off by default. Each is switched with an environment variable (e.g. FEATURE_HIRING_PARTNER=true) and a redeploy."
      />

      <Card>
        <h2 className="text-sm font-semibold text-white">Features</h2>
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {data.features.map((f: any) => (
            <li key={f.key} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{f.label}</p>
                <p className="text-xs text-slate-500">{f.description}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-500">{f.env}</p>
              </div>
              <Badge tone={f.enabled ? 'success' : 'neutral'} dot>
                {f.enabled ? 'On' : 'Off'}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white">Decisions needed before live use</h2>
        <p className="mt-1 text-xs text-slate-500">The system does not assume answers to these. Until decided, the affected action is refused or must be recorded explicitly per agreement.</p>
        <ul className="mt-4 space-y-4">
          {data.decisions.map((d: any) => (
            <li key={d.key} className="rounded-xl border border-white/[0.06] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warning">Open</Badge>
                <span className="text-xs text-slate-500">{d.feature}</span>
              </div>
              <p className="mt-2 text-sm text-white">{d.question}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">Current handling: {d.handling}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white">Credentials and configuration</h2>
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {data.credentials.map((c: any) => (
            <li key={c.key} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-mono text-xs text-slate-200">{c.key}</p>
                <p className="text-xs text-slate-500">{c.purpose}</p>
              </div>
              <Badge tone={c.key === 'PARTNER_BILLING_LIVE' ? (c.present ? 'danger' : 'success') : c.present ? 'success' : 'warning'}>
                {c.key === 'PARTNER_BILLING_LIVE' ? (c.present ? 'Set: remove it' : 'Absent (correct)') : c.present ? 'Set' : 'Not set'}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">{data.liveBilling.note}</p>
      </Card>
    </div>
  );
}
