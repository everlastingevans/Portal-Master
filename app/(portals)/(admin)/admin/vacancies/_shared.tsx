'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastNotification';
import { Modal } from '../_components/overlay';
import { BadgeTone, Button, Field, Input } from '../_components/ui';
import { CLOSED_STATUSES, PLACED_STATUSES } from '@/lib/hire/vacancy';
import { HireTerms } from '@/lib/hire/terms';

export function vacancyTone(status: string): BadgeTone {
  if (status === 'NEW_VACANCY') return 'warning';
  if (['SHORTLIST_READY', 'SHORTLIST_SENT', 'INTERVIEWING', 'OFFER'].includes(status)) return 'info';
  if ((PLACED_STATUSES as string[]).includes(status)) return 'success';
  if ((CLOSED_STATUSES as string[]).includes(status)) return 'danger';
  return 'neutral';
}

export const dateOnly = (v?: string | Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');
export const fmtDate = (v?: string | Date | null) =>
  v ? new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(v)) : '—';
export const fmtDateTime = (v?: string | Date | null) =>
  v ? new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(v)) : '—';
export const daysSince = (v: string | Date) => Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 86_400_000));

export function TermsModal({ terms, onClose, onSaved }: { terms: HireTerms; onClose: () => void; onSaved: (t: HireTerms) => void }) {
  const { success } = useToast();
  const [form, setForm] = useState({
    rate: String(terms.feeRateBps / 100),
    min: String(terms.feeMin),
    max: String(terms.feeMax),
    days: String(terms.guaranteeDays),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const num = (s: string) => (s.trim() === '' ? NaN : Number(s));
      const res = await fetch('/api/superadmin/hire-terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeRateBps: Math.round(num(form.rate) * 100), feeMin: num(form.min), feeMax: num(form.max), guaranteeDays: num(form.days) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      onSaved(data.terms);
      success('Hire terms saved');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="LaunchPath Hire terms"
      description="Shown on the website and used for new placements. Existing placements keep the terms they were created with."
      footer={
        <>
          {error && (
            <p className="mr-auto text-xs text-rose-300" role="alert">
              {error}
            </p>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} loading={saving}>
            Save terms
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fee (% of annual CTC)" htmlFor="t-rate">
          <Input id="t-rate" inputMode="decimal" value={form.rate} onChange={set('rate')} />
        </Field>
        <Field label="Guarantee (days)" htmlFor="t-days">
          <Input id="t-days" inputMode="numeric" value={form.days} onChange={set('days')} />
        </Field>
        <Field label="Minimum fee (R)" htmlFor="t-min">
          <Input id="t-min" inputMode="numeric" value={form.min} onChange={set('min')} />
        </Field>
        <Field label="Maximum fee (R)" htmlFor="t-max">
          <Input id="t-max" inputMode="numeric" value={form.max} onChange={set('max')} />
        </Field>
      </div>
    </Modal>
  );
}
