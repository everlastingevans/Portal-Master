'use client';

import { SOURCE_KINDS } from '@/lib/cv-import/profile';
import { Badge, BadgeTone, Field, Input, Select } from '../_components/ui';

export type Source = { id: number; name: string; kind: string; candidates: number };

export interface ImportSettings {
  /** '' = no organisation, 'new' = create one from newName/newKind, otherwise a source id */
  sourceId: string;
  newName: string;
  newKind: string;
  label: string;
  visible: boolean;
  consent: boolean;
}

export const DEFAULT_SETTINGS: ImportSettings = { sourceId: '', newName: '', newKind: 'TRAINING_PROVIDER', label: '', visible: false, consent: false };

export const IMPORT_STATUS_UI: Record<string, { label: string; tone: BadgeTone }> = {
  CREATED: { label: 'Profile created', tone: 'success' },
  EXISTING: { label: 'Already on LaunchPath', tone: 'info' },
  NEEDS_REVIEW: { label: 'Needs review', tone: 'warning' },
  FAILED: { label: 'Failed', tone: 'danger' },
};

export function ImportStatusBadge({ status }: { status: string }) {
  const ui = IMPORT_STATUS_UI[status] || { label: status, tone: 'neutral' as const };
  return (
    <Badge tone={ui.tone} dot>
      {ui.label}
    </Badge>
  );
}

async function readJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

/** Starts an import on the server and returns its id. */
export async function startBatch(settings: ImportSettings, mode: 'SINGLE' | 'BULK', totalFiles: number): Promise<number> {
  const data = await readJson(
    await fetch('/api/superadmin/cv-import/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        totalFiles,
        sourceId: settings.sourceId && settings.sourceId !== 'new' ? Number(settings.sourceId) : null,
        newSource: settings.sourceId === 'new' ? { name: settings.newName, kind: settings.newKind } : null,
        label: mode === 'BULK' ? settings.label : null,
        talentPoolVisible: settings.visible,
        consentConfirmed: settings.consent,
      }),
    }),
  );
  return data.batch.id;
}

export type ImportResult = {
  itemId: number;
  status: 'CREATED' | 'EXISTING' | 'NEEDS_REVIEW' | 'FAILED';
  message: string | null;
  candidate: { id: number; name: string | null; email: string | null } | null;
};

/** Sends one CV to an import. A reviewed profile skips the AI step. */
export async function uploadToBatch(batchId: number, file: File, reviewedProfile?: object): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  if (reviewedProfile) form.append('profile', JSON.stringify(reviewedProfile));
  const data = await readJson(await fetch(`/api/superadmin/cv-import/batches/${batchId}/files`, { method: 'POST', body: form }));
  return data.result;
}

export { readJson };

/** A settings problem that should stop the import from starting, or null. */
export function settingsError(s: ImportSettings): string | null {
  if (s.sourceId === 'new' && !s.newName.trim()) return 'Enter the new organisation’s name.';
  if (!s.consent) return 'Confirm the candidates agreed to LaunchPath processing their CVs.';
  return null;
}

export function ImportSettingsFields({
  value,
  onChange,
  sources,
  showLabel,
  disabled,
}: {
  value: ImportSettings;
  onChange: (next: ImportSettings) => void;
  sources: Source[];
  showLabel: boolean;
  disabled?: boolean;
}) {
  const set = (patch: Partial<ImportSettings>) => onChange({ ...value, ...patch });
  return (
    <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="School or organisation" htmlFor="imp-source" hint="Tag candidates so you can filter them on the Talent page.">
          <Select id="imp-source" value={value.sourceId} onChange={(e) => set({ sourceId: e.target.value })}>
            <option value="">None</option>
            {sources.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
            <option value="new">+ Add a new organisation…</option>
          </Select>
        </Field>
        {showLabel && (
          <Field label="Import name" htmlFor="imp-label" hint="Optional, e.g. “2026 BCom graduates”.">
            <Input id="imp-label" value={value.label} maxLength={120} onChange={(e) => set({ label: e.target.value })} placeholder="Optional" />
          </Field>
        )}
      </div>

      {value.sourceId === 'new' && (
        <div className="grid gap-4 rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06] sm:grid-cols-2">
          <Field label="Organisation name" htmlFor="imp-new-name">
            <Input id="imp-new-name" value={value.newName} maxLength={120} onChange={(e) => set({ newName: e.target.value })} placeholder="e.g. Umuzi" autoFocus />
          </Field>
          <Field label="Type" htmlFor="imp-new-kind">
            <Select id="imp-new-kind" value={value.newKind} onChange={(e) => set({ newKind: e.target.value })}>
              {SOURCE_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
          <input type="checkbox" checked={value.visible} onChange={(e) => set({ visible: e.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-lime" />
          <span>
            Show these profiles to employers in the talent pool now
            <span className="block text-xs text-slate-500">
              Off by default: imported profiles are visible to LaunchPath staff only until the candidate signs in for the first time.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
          <input type="checkbox" checked={value.consent} onChange={(e) => set({ consent: e.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-lime" />
          <span>
            I confirm these candidates agreed to LaunchPath processing their CV
            <span className="block text-xs text-slate-500">For example, through the school or training organisation that shared them. Required under POPIA.</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
