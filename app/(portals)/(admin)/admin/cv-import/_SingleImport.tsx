'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { AlertTriangle, CheckCircle2, FileText, Info, RotateCcw, Sparkles, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { CANDIDATE_LOCATIONS } from '@/lib/talent';
import { ImportedProfile, MAX_CV_BYTES, PROFILE_EXPERIENCE_LEVELS, PROFILE_FIELDS } from '@/lib/cv-import/profile';
import { Button, Card, Field, IconButton, Input, Select, Textarea, cx } from '../_components/ui';
import {
  DEFAULT_SETTINGS,
  ImportResult,
  ImportSettings,
  ImportSettingsFields,
  ImportStatusBadge,
  Source,
  readJson,
  settingsError,
  startBatch,
  uploadToBatch,
} from './_shared';

type Draft = Record<keyof ImportedProfile, string>;
type Existing = { id: number; name: string | null; isCandidate: boolean } | null;

const toDraft = (p: ImportedProfile): Draft => Object.fromEntries(PROFILE_FIELDS.map((f) => [f, p[f] ?? ''])) as Draft;
const MAX_MB = MAX_CV_BYTES / 1024 / 1024;

export default function SingleImport({ sources, onImported }: { sources: Source[]; onImported: () => void }) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [existing, setExisting] = useState<Existing>(null);
  const [settings, setSettings] = useState<ImportSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<(ImportResult & { batchId: number }) | null>(null);
  const [error, setError] = useState('');

  const reset = () => {
    setFile(null);
    setDraft(null);
    setExisting(null);
    setResult(null);
    setError('');
    setSettings((s) => ({ ...DEFAULT_SETTINGS, sourceId: s.sourceId === 'new' ? '' : s.sourceId }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: MAX_CV_BYTES,
    disabled: analysing || saving,
    onDrop: (accepted, rejected) => {
      setError(rejected.length ? (rejected[0].errors[0]?.code === 'file-too-large' ? `That file is over ${MAX_MB} MB.` : 'Choose a single PDF file.') : '');
      if (accepted[0]) {
        setFile(accepted[0]);
        setDraft(null);
        setExisting(null);
        setResult(null);
      }
    },
  });

  const analyse = async () => {
    if (!file) return;
    setAnalysing(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const data = await readJson(await fetch('/api/superadmin/cv-import/analyse', { method: 'POST', body: form }));
      setDraft(toDraft(data.profile));
      setExisting(data.existing);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalysing(false);
    }
  };

  const save = async () => {
    if (!file || !draft) return;
    const problem = settingsError(settings);
    if (problem) return setError(problem);
    setSaving(true);
    setError('');
    try {
      const batchId = await startBatch(settings, 'SINGLE', 1);
      const res = await uploadToBatch(batchId, file, draft);
      setResult({ ...res, batchId });
      onImported();
      if (res.status === 'FAILED') toast.error(res.message || 'The profile couldn’t be created');
      else toast.success(res.status === 'EXISTING' ? 'Existing candidate updated' : 'Candidate profile created');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof ImportedProfile) => (e: { target: { value: string } }) => setDraft((d) => (d ? { ...d, [field]: e.target.value } : d));
  const blocked = existing && !existing.isCandidate;

  /* ------------------------------- Result -------------------------------- */
  if (result) {
    const ok = result.status !== 'FAILED';
    return (
      <Card>
        <div className="flex items-start gap-4">
          <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', ok ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300')}>
            {ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white">{result.candidate?.name || file?.name}</h3>
              <ImportStatusBadge status={result.status} />
            </div>
            {result.message && <p className="mt-1.5 text-sm text-slate-400">{result.message}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {result.candidate && (
                <Link
                  href={`/admin/talent?batch=${result.batchId}`}
                  className="inline-flex h-10 items-center rounded-xl bg-white/[0.04] px-4 text-sm font-medium text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08] hover:text-white"
                >
                  View on Talent page
                </Link>
              )}
              <Button variant="primary" icon={RotateCcw} onClick={reset}>
                Import another CV
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. File */}
      <Card>
        <h3 className="text-sm font-semibold text-white">1. Choose a CV</h3>
        <p className="mt-1 text-xs text-slate-500">PDF up to {MAX_MB} MB. Scanned CVs work too.</p>
        {file ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-inset ring-white/[0.06]">
            <FileText className="h-5 w-5 shrink-0 text-brand-lime" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            {!draft && (
              <Button variant="primary" icon={Sparkles} loading={analysing} onClick={analyse}>
                {analysing ? 'Analysing…' : 'Analyse with AI'}
              </Button>
            )}
            <IconButton icon={X} label="Remove file" onClick={reset} disabled={analysing || saving} />
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={cx(
              'mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
              isDragActive ? 'border-brand-lime/60 bg-brand-lime/[0.04]' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.02]',
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="h-8 w-8 text-slate-500" />
            <p className="mt-3 text-sm font-medium text-white">{isDragActive ? 'Drop the CV here' : 'Drag a CV here, or click to choose'}</p>
          </div>
        )}
        {analysing && <p className="mt-3 text-xs text-slate-500" role="status">Reading the CV and building a profile. This usually takes 5–15 seconds.</p>}
        {error && !draft && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </Card>

      {/* 2. Review */}
      {draft && (
        <Card>
          <h3 className="text-sm font-semibold text-white">2. Check the profile</h3>
          <p className="mt-1 text-xs text-slate-500">AI drafted this from the CV. Correct anything it got wrong before saving.</p>

          {existing && (
            <div
              className={cx(
                'mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset',
                existing.isCandidate ? 'bg-sky-400/[0.06] text-sky-200 ring-sky-400/20' : 'bg-rose-400/[0.06] text-rose-200 ring-rose-400/20',
              )}
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {existing.isCandidate
                ? `${existing.name || 'A candidate'} already has a profile with this email. Saving won’t replace anything they entered; it only fills their empty fields and adds the CV if they have none.`
                : 'This email belongs to a staff or employer account, so a candidate profile can’t be created with it. Change the email or cancel.'}
            </div>
          )}
          {!draft.email && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200 ring-1 ring-inset ring-amber-400/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              No email address was found. You can still save the profile, but it will be flagged for review and the candidate can’t sign in until an email is added.
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="sp-name">
              <Input id="sp-name" value={draft.name} onChange={set('name')} maxLength={120} />
            </Field>
            <Field label="Email" htmlFor="sp-email">
              <Input
                id="sp-email"
                type="email"
                value={draft.email}
                onChange={(e) => {
                  set('email')(e);
                  setExisting(null); // the server re-checks the edited email when saving
                }}
                maxLength={200}
              />
            </Field>
            <Field label="Phone" htmlFor="sp-phone">
              <Input id="sp-phone" value={draft.phone} onChange={set('phone')} maxLength={30} />
            </Field>
            <Field label="Headline" htmlFor="sp-title">
              <Input id="sp-title" value={draft.professional_title} onChange={set('professional_title')} maxLength={120} />
            </Field>
            <Field label="Experience level" htmlFor="sp-exp">
              <Select id="sp-exp" value={draft.experience_level} onChange={set('experience_level')}>
                <option value="">Not specified</option>
                {PROFILE_EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location" htmlFor="sp-location">
              <Select id="sp-location" value={draft.location} onChange={set('location')}>
                <option value="">Not specified</option>
                {CANDIDATE_LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Skills" htmlFor="sp-skills" hint="Separate skills with commas.">
                <Textarea id="sp-skills" rows={2} value={draft.skills} onChange={set('skills')} maxLength={1000} />
              </Field>
            </div>
            <Field label="Place of study" htmlFor="sp-inst">
              <Input id="sp-inst" value={draft.study_institution} onChange={set('study_institution')} maxLength={200} />
            </Field>
            <Field label="Field of study" htmlFor="sp-spec">
              <Input id="sp-spec" value={draft.study_specialisation} onChange={set('study_specialisation')} maxLength={200} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Qualifications" htmlFor="sp-quals">
                <Textarea id="sp-quals" rows={3} value={draft.qualifications} onChange={set('qualifications')} maxLength={1500} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Work experience" htmlFor="sp-work">
                <Textarea id="sp-work" rows={6} value={draft.work_experience} onChange={set('work_experience')} maxLength={4000} />
              </Field>
            </div>
            <Field label="Suited to roles" htmlFor="sp-roles" hint="Separate roles with commas.">
              <Input id="sp-roles" value={draft.seeking_roles} onChange={set('seeking_roles')} maxLength={300} />
            </Field>
            <Field label="LinkedIn" htmlFor="sp-li">
              <Input id="sp-li" value={draft.linkedin_url} onChange={set('linkedin_url')} maxLength={300} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="GitHub" htmlFor="sp-gh">
              <Input id="sp-gh" value={draft.github_url} onChange={set('github_url')} maxLength={300} />
            </Field>
            <Field label="Portfolio" htmlFor="sp-pf">
              <Input id="sp-pf" value={draft.portfolio_url} onChange={set('portfolio_url')} maxLength={300} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Summary" htmlFor="sp-bio" hint={`${draft.bio.length}/600 · Shown to employers if the profile is visible.`}>
                <Textarea id="sp-bio" rows={3} value={draft.bio} onChange={set('bio')} maxLength={600} />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Save */}
      {draft && (
        <Card>
          <h3 className="mb-5 text-sm font-semibold text-white">3. Save</h3>
          <ImportSettingsFields value={settings} onChange={setSettings} sources={sources} showLabel={false} disabled={saving} />
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={reset} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} loading={saving} disabled={Boolean(blocked) || !settings.consent}>
              {existing?.isCandidate ? 'Update existing candidate' : 'Create profile'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
