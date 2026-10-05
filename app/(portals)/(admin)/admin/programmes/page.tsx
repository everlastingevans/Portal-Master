'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Layers, Plus } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { Modal } from '../_components/overlay';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, PageSkeleton, Table, TBody, Td, Textarea, Th, THead, Tr } from '../_components/ui';
import { PROGRAMME_STATUSES } from '@/lib/hire/programmes';
import { formatRand } from '@/lib/hire/terms';
import { fmtDate } from '../vacancies/_shared';

const statusLabel = (s: string) => PROGRAMME_STATUSES.find((x) => x.value === s)?.label ?? s;

export default function ProgrammesPage() {
  const router = useRouter();
  const { error: toastError, success } = useToast();
  const [data, setData] = useState<any>(null);
  const [creating, setCreating] = useState<any>(null);
  const [tiersText, setTiersText] = useState('');
  const [editingTiers, setEditingTiers] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/superadmin/programmes', { cache: 'no-store' });
    const j = await r.json();
    if (!r.ok) toastError(j.error || 'Could not load');
    else {
      setData(j);
      if (j.tiers) setTiersText(JSON.stringify(j.tiers, null, 2));
    }
  }, [toastError]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string, payload: Record<string, unknown>) => {
    const r = await fetch('/api/superadmin/programmes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      toastError(j.error || 'Something went wrong');
      return null;
    }
    await load();
    return j;
  };

  if (!data) return <PageSkeleton />;
  if (!data.enabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bulk hiring programmes" />
        <Card>
          <p className="text-sm text-slate-300">Bulk programmes are switched off (FEATURE_BULK_PROGRAMMES). See Commercial setup for the open tier decisions.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk hiring programmes"
        description="Programmes for multiple hires. Pricing is by agreement (“Talk to LaunchPath”); record the accepted terms on each programme. New terms never apply retroactively."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreating({ name: '', company_name: '', contact_name: '', contact_email: '', target_hires: '', requirements: '' })}>
            New programme
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Per-hire tiers (guidance for quotes)</h2>
          <Button size="sm" onClick={() => setEditingTiers((v) => !v)}>
            {editingTiers ? 'Close' : 'Edit tiers'}
          </Button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {data.tiers.map((t: any) => (
            <li key={t.label} className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-slate-200 ring-1 ring-inset ring-white/10">
              {t.label}: {t.minHires}
              {t.maxHires === null ? '+' : `–${t.maxHires}`} hires · {t.perHireFee === null ? 'custom quote' : `${formatRand(t.perHireFee)} per hire`}
            </li>
          ))}
        </ul>
        {data.overlaps.length > 0 && (
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Tier overlap needs a decision:{' '}
            {data.overlaps.map((o: any) => `${o.a} and ${o.b} both cover ${o.from}${o.to === null ? '+' : o.to === o.from ? '' : `–${o.to}`} hires`).join('; ')}. Staff must choose the tier when recording terms.
          </p>
        )}
        {editingTiers && (
          <div className="mt-4 space-y-2">
            <Textarea rows={10} aria-label="Tiers JSON" className="font-mono text-xs" value={tiersText} onChange={(e) => setTiersText(e.target.value)} />
            <p className="text-xs text-slate-500">Each tier: label, minHires, maxHires (null = no upper limit), perHireFee (null = custom quote). Changing tiers does not change any agreed programme terms.</p>
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                let tiers;
                try {
                  tiers = JSON.parse(tiersText);
                } catch {
                  return toastError('That isn’t valid JSON.');
                }
                if (await act('SAVE_TIERS', { tiers })) success('Tiers saved');
              }}
            >
              Save tiers
            </Button>
          </div>
        )}
      </Card>

      <Table empty={data.programmes.length === 0 && <EmptyState icon={Layers} title="No programmes yet" description="Enquiries from the bulk hiring page and programmes you create appear here." />}>
        <THead>
          <Th>Programme</Th>
          <Th>Status</Th>
          <Th>Progress</Th>
          <Th align="right">Agreed fee</Th>
        </THead>
        <TBody>
          {data.programmes.map((p: any) => (
            <Tr key={p.id} onClick={() => router.push(`/admin/programmes/${p.id}`)}>
              <Td>
                <p className="font-medium text-white">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.company_name} · {p.source === 'ENQUIRY_FORM' ? 'website enquiry' : 'created by staff'} · {fmtDate(p.created_at)}
                </p>
              </Td>
              <Td>
                <Badge tone={['AGREED', 'ACTIVE'].includes(p.status) ? 'success' : p.status === 'ENQUIRY' ? 'warning' : 'neutral'}>{statusLabel(p.status)}</Badge>
              </Td>
              <Td className="text-sm text-slate-300">
                {p.placements} of {p.target_hires} hires · {p.linkedVacancies} vacancies
              </Td>
              <Td align="right" className="text-sm tabular-nums text-slate-200">
                {p.currentTerms ? `${formatRand(p.currentTerms.per_hire_fee)} / hire` : <span className="text-xs text-slate-500">No terms recorded</span>}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      {creating && (
        <Modal
          open
          onClose={() => setCreating(null)}
          title="New programme"
          footer={
            <>
              <Button variant="ghost" onClick={() => setCreating(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => act('CREATE_PROGRAMME', creating).then((r) => r && router.push(`/admin/programmes/${r.programme.id}`))}>
                Create
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['name', 'Programme name'],
                ['company_name', 'Company'],
                ['contact_name', 'Contact name'],
                ['contact_email', 'Contact email'],
                ['target_hires', 'Target hires'],
              ] as const
            ).map(([k, l]) => (
              <Field key={k} label={l} htmlFor={`np-${k}`}>
                <Input id={`np-${k}`} value={creating[k]} onChange={(e) => setCreating({ ...creating, [k]: e.target.value })} />
              </Field>
            ))}
            <div className="sm:col-span-2">
              <Field label="Requirements" htmlFor="np-req">
                <Textarea id="np-req" rows={4} value={creating.requirements} onChange={(e) => setCreating({ ...creating, requirements: e.target.value })} />
              </Field>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
