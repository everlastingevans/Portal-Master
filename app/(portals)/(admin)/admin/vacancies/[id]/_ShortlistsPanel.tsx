'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Copy, Eye, FileUp, Link2, Pencil, Plus, Send, Trash2, UserPlus, XCircle } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { CandidateCard } from '@/components/hire/CandidateCard';
import { toCandidateCard } from '@/lib/hire/card';
import { INTERVIEW_OUTCOMES, INTERVIEW_REQUEST_STATUSES, MATCH_LEVELS, OFFER_STATUSES, labelFor } from '@/lib/hire/vacancy';
import { Modal } from '../../_components/overlay';
import { useConfirm } from '../../_components/overlay';
import { Badge, Button, Card, EmptyState, Field, IconButton, Input, SearchInput, Select, Textarea } from '../../_components/ui';
import { fmtDate, fmtDateTime } from '../_shared';
import type { Act } from './page';

const linkState = (l: any) => (l.revoked_at ? 'Revoked' : new Date(l.expires_at) <= new Date() ? 'Expired' : 'Active');

export function ShortlistsPanel({ vacancy, act, onGoToPlacement, suggestionsEnabled = false }: { vacancy: any; act: Act; onGoToPlacement: () => void; suggestionsEnabled?: boolean }) {
  const confirm = useConfirm();
  const { success } = useToast();
  const [editing, setEditing] = useState<{ shortlistId: number; entry?: any; prefill?: any } | null>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const [sending, setSending] = useState<any>(null);
  const [sent, setSent] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [processing, setProcessing] = useState<any>(null);

  const shortlists = vacancy.shortlists as any[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-400">
          Build a shortlist of normally 3–5 candidates, assess each one, then send the employer a private link. Assessments are always shown to employers as LaunchPath recruiter
          assessments; leave a field blank if it wasn’t assessed.
        </p>
        <Button variant="primary" icon={Plus} onClick={() => act('CREATE_SHORTLIST').then((r) => r.ok && success('Shortlist created'))}>
          New shortlist
        </Button>
      </div>

      {shortlists.length === 0 && (
        <Card>
          <EmptyState icon={UserPlus} title="No shortlists yet" description="Create a shortlist once the role is calibrated, then add candidates." />
        </Card>
      )}

      {shortlists.map((s) => {
        const n = s.candidates.length;
        return (
          <Card key={s.id} padded={false}>
            <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-white">{s.title || `Shortlist #${s.id}`}</h2>
                  <Badge tone={s.status === 'SENT' ? 'success' : 'neutral'}>{s.status === 'SENT' ? `Sent ${fmtDate(s.sent_at)}` : 'Draft'}</Badge>
                  <span className="text-xs text-slate-500">
                    {n} candidate{n === 1 ? '' : 's'}
                  </span>
                  {n > 0 && (n < 3 || n > 5) && <Badge tone="warning">Outside the usual 3–5</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={UserPlus} onClick={() => setAdding(s.id)}>
                  Add candidate
                </Button>
                <Button size="sm" variant="primary" icon={Send} disabled={n === 0} onClick={() => setSending(s)}>
                  {s.status === 'SENT' ? 'Send new link' : 'Send to employer'}
                </Button>
                {s.status === 'DRAFT' && (
                  <IconButton
                    icon={Trash2}
                    label="Delete draft shortlist"
                    tone="danger"
                    onClick={async () => {
                      if (await confirm({ title: 'Delete this draft shortlist?', description: 'Its candidate cards will be removed.', confirmLabel: 'Delete', tone: 'danger' })) {
                        act('DELETE_SHORTLIST', { shortlistId: s.id });
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {n === 0 ? (
              <p className="p-5 text-sm text-slate-500">No candidates yet.</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {s.candidates.map((c: any) => {
                  const openRequests = c.interview_requests.filter((r: any) => ['NEW', 'SCHEDULED'].includes(r.status)).length;
                  const assessed = [c.match_level, c.communication_rating, c.interview_readiness].filter(Boolean).length;
                  return (
                    <li key={c.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          {c.display_name}
                          {c.candidate_id && <span className="ml-2 text-xs font-normal text-slate-500">platform #{c.candidate_id}</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{[c.target_role, c.location, c.salary_expectation ? `R${c.salary_expectation.toLocaleString('en-ZA')}/m` : null].filter(Boolean).join(' · ') || 'Card incomplete'}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.match_level ? <Badge tone="brand">{labelFor(MATCH_LEVELS, c.match_level)}</Badge> : <Badge>Match not rated</Badge>}
                          <Badge tone={assessed === 3 ? 'success' : 'warning'}>{assessed}/3 core assessments</Badge>
                          {!c.cv_s3_key && !c.cv_external_url && <Badge tone="warning">No CV</Badge>}
                          {openRequests > 0 && <Badge tone="info">Interview requested</Badge>}
                          {c.interview_outcome && <Badge>{labelFor(INTERVIEW_OUTCOMES, c.interview_outcome)}</Badge>}
                          {c.offer_status && <Badge tone={c.offer_status === 'ACCEPTED' ? 'success' : c.offer_status === 'OFFERED' ? 'info' : 'neutral'}>{labelFor(OFFER_STATUSES, c.offer_status)}</Badge>}
                          {c.placement && <Badge tone="success">Placed</Badge>}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        <Button size="sm" icon={Eye} onClick={() => setPreview(c)}>
                          Preview
                        </Button>
                        <Button size="sm" icon={Pencil} onClick={() => setEditing({ shortlistId: s.id, entry: c })}>
                          Edit card
                        </Button>
                        <Button size="sm" icon={CalendarCheck} onClick={() => setProcessing(c)}>
                          Interview &amp; offer
                        </Button>
                        <IconButton
                          icon={Trash2}
                          label="Remove from shortlist"
                          tone="danger"
                          onClick={async () => {
                            if (await confirm({ title: `Remove ${c.display_name}?`, description: s.status === 'SENT' ? 'The employer will no longer see this candidate on their link.' : undefined, confirmLabel: 'Remove', tone: 'danger' })) {
                              act('REMOVE_CANDIDATE', { shortlistCandidateId: c.id });
                            }
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {s.links.length > 0 && (
              <div className="border-t border-white/[0.06] p-5">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Link2 className="h-3.5 w-3.5" /> Employer links
                </p>
                <ul className="mt-3 space-y-2 text-xs">
                  {s.links.map((l: any) => {
                    const state = linkState(l);
                    return (
                      <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-slate-300">
                          Created {fmtDateTime(l.created_at)} · expires {fmtDate(l.expires_at)} · {l.view_count} view{l.view_count === 1 ? '' : 's'}
                          {l.last_viewed_at ? ` (last ${fmtDateTime(l.last_viewed_at)})` : ''}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge tone={state === 'Active' ? 'success' : 'neutral'}>{state}</Badge>
                          {state === 'Active' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={XCircle}
                              onClick={async () => {
                                if (await confirm({ title: 'Revoke this link?', description: 'The employer will no longer be able to open it.', confirmLabel: 'Revoke', tone: 'danger' })) {
                                  act('REVOKE_LINK', { linkId: l.id }).then((r) => r.ok && success('Link revoked'));
                                }
                              }}
                            >
                              Revoke
                            </Button>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Card>
        );
      })}

      {adding !== null && (
        <AddCandidateModal
          vacancyId={vacancy.id}
          suggestionsEnabled={suggestionsEnabled}
          onClose={() => setAdding(null)}
          onPick={(prefill) => {
            setEditing({ shortlistId: adding, prefill });
            setAdding(null);
          }}
        />
      )}
      {editing && (
        <CardEditorModal
          entry={editing.entry}
          prefill={editing.prefill}
          onClose={() => setEditing(null)}
          onSave={async (fields) => {
            const r = editing.entry
              ? await act('UPDATE_CANDIDATE', { shortlistCandidateId: editing.entry.id, ...fields })
              : await act('ADD_CANDIDATE', { shortlistId: editing.shortlistId, candidateId: editing.prefill?.candidateId, ...fields });
            if (r.ok) {
              success(editing.entry ? 'Card updated' : 'Candidate added');
              setEditing(null);
            }
          }}
        />
      )}
      {sending && (
        <SendModal
          shortlist={sending}
          defaultTo={vacancy.contact_email}
          onClose={() => setSending(null)}
          onSend={async (payload) => {
            const r = await act('SEND_SHORTLIST', { shortlistId: sending.id, ...payload });
            if (r.ok) {
              setSending(null);
              setSent(r.data);
            }
          }}
        />
      )}
      {sent && <SentModal result={sent} onClose={() => setSent(null)} />}
      {preview && (
        <Modal open onClose={() => setPreview(null)} size="md" title="Employer view of this card">
          <div className="rounded-2xl bg-canvas p-3">
            <CandidateCard card={toCandidateCard(preview, preview.interview_requests.length > 0)} />
          </div>
        </Modal>
      )}
      {processing && (
        <ProcessModal
          entry={processing}
          act={act}
          onClose={() => setProcessing(null)}
          onRecordHire={() => {
            setProcessing(null);
            onGoToPlacement();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ Add candidate ----------------------------- */

function AddCandidateModal({ vacancyId, suggestionsEnabled, onClose, onPick }: { vacancyId: number; suggestionsEnabled: boolean; onClose: () => void; onPick: (prefill: any) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/superadmin/candidates/search?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        setResults(json.candidates || []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Modal open onClose={onClose} size="lg" title="Add a candidate" description="Search platform candidates, or add someone sourced elsewhere.">
      {suggestionsEnabled && <Suggestions vacancyId={vacancyId} onPick={onPick} />}
      <SearchInput value={q} onChange={setQ} placeholder="Name, email, title or skill" />
      <ul className="mt-4 max-h-[50vh] divide-y divide-white/[0.06] overflow-y-auto">
        {loading && <li className="py-3 text-sm text-slate-500">Searching…</li>}
        {!loading && q.trim().length >= 2 && results.length === 0 && <li className="py-3 text-sm text-slate-500">No platform candidates match.</li>}
        {results.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{c.name || 'Unnamed'}</p>
              <p className="truncate text-xs text-slate-500">{[c.title, c.location, c.experience, c.email].filter(Boolean).join(' · ')}</p>
              <p className="mt-1 text-xs text-slate-500">
                {c.hasCvFile ? 'CV file on profile' : c.hasCvText ? 'CV text only (upload a PDF to share)' : 'No CV'}
                {c.practiceInterview && (
                  <span className="text-amber-300/80">
                    {' '}
                    · Practice interview {c.practiceInterview.score}/100 (self-service and unverified; not shown to employers)
                  </span>
                )}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                onPick({
                  candidateId: c.id,
                  display_name: c.name || '',
                  target_role: c.title || '',
                  location: c.location || '',
                  experience: c.experience || '',
                  key_skills: c.skills || '',
                })
              }
            >
              Use
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <Button icon={Plus} onClick={() => onPick({})}>
          Add manually
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------- Card editor ------------------------------ */

const CARD_FIELDS = [
  'display_name',
  'target_role',
  'location',
  'experience',
  'salary_expectation',
  'availability',
  'key_skills',
  'recruiter_note',
  'cv_external_url',
  'cv_s3_key',
  'match_level',
  'communication_rating',
  'communication_note',
  'interview_readiness',
  'role_assessment_name',
  'role_assessment_score',
  'role_assessment_max',
  'role_assessment_note',
] as const;
type CardField = (typeof CARD_FIELDS)[number];

function toForm(src: any): Record<CardField, string> {
  const out = {} as Record<CardField, string>;
  for (const k of CARD_FIELDS) {
    const v = src?.[k];
    out[k] = v === null || v === undefined ? '' : Array.isArray(v) ? v.join(', ') : String(v);
  }
  return out;
}

async function uploadCv(file: File): Promise<string> {
  const presign = await fetch('/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: 'application/pdf', category: 'resumes' }),
  });
  const p = await presign.json();
  if (!presign.ok) throw new Error(p.error || 'Could not prepare the upload.');
  const put = await fetch(p.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: file });
  if (!put.ok) throw new Error('The upload to storage failed.');
  return p.s3Key;
}

function CardEditorModal({ entry, prefill, onClose, onSave }: { entry?: any; prefill?: any; onClose: () => void; onSave: (f: Record<string, string | null>) => Promise<void> }) {
  const { error: toastError, success } = useToast();
  const initial = toForm(entry || prefill || {});
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: CardField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const fields: Record<string, string | null> = {};
    for (const k of CARD_FIELDS) {
      // On edit send only changes, so untouched assessments don't get a new "assessed" date
      if (!entry || form[k] !== initial[k]) fields[k] = form[k] === '' ? null : form[k];
    }
    if (prefill && !entry) {
      // Let the server fill CV and other blanks from the profile
      for (const k of CARD_FIELDS) if (fields[k] === null) delete fields[k];
    }
    await onSave(fields);
    setSaving(false);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') return toastError('Please upload the CV as a PDF.');
    setUploading(true);
    try {
      const key = await uploadCv(file);
      setForm((f) => ({ ...f, cv_s3_key: key }));
      success('CV uploaded. Save the card to attach it.');
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={entry ? `Edit card: ${entry.display_name}` : 'New candidate card'}
      description="This is exactly what the employer will see. Never include contact details, ID numbers or anything the candidate hasn’t agreed to share."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} loading={saving}>
            {entry ? 'Save card' : 'Add to shortlist'}
          </Button>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Candidate</h3>
          <Field label="Name shown to employer" htmlFor="c-name">
            <Input id="c-name" value={form.display_name} onChange={set('display_name')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target role" htmlFor="c-role">
              <Input id="c-role" value={form.target_role} onChange={set('target_role')} />
            </Field>
            <Field label="Location" htmlFor="c-loc">
              <Input id="c-loc" value={form.location} onChange={set('location')} />
            </Field>
            <Field label="Experience" htmlFor="c-exp" hint="e.g. 1 year inbound sales">
              <Input id="c-exp" value={form.experience} onChange={set('experience')} />
            </Field>
            <Field label="Salary expectation (R / month)" htmlFor="c-sal">
              <Input id="c-sal" inputMode="numeric" value={form.salary_expectation} onChange={set('salary_expectation')} />
            </Field>
            <Field label="Availability" htmlFor="c-avail" hint="e.g. Immediately, 1 month notice">
              <Input id="c-avail" value={form.availability} onChange={set('availability')} />
            </Field>
            <Field label="Key skills" htmlFor="c-skills" hint="Comma separated">
              <Input id="c-skills" value={form.key_skills} onChange={set('key_skills')} />
            </Field>
          </div>
          <Field label="Recruiter note (shown to employer)" htmlFor="c-note">
            <Textarea id="c-note" rows={3} maxLength={600} value={form.recruiter_note} onChange={set('recruiter_note')} />
          </Field>
          <div className="rounded-xl border border-white/[0.06] p-4">
            <p className="text-xs font-medium text-slate-300">CV</p>
            <p className="mt-1 text-xs text-slate-500">
              {form.cv_s3_key ? 'PDF on file (private; employers get a 5-minute link).' : form.cv_external_url ? 'External link on file.' : 'No CV attached. The card will say “CV available on request”.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 text-xs font-medium text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08]">
                <FileUp className="h-3.5 w-3.5" /> {uploading ? 'Uploading…' : 'Upload PDF'}
                <input type="file" accept="application/pdf" className="sr-only" onChange={onFile} disabled={uploading} />
              </label>
              {form.cv_s3_key && (
                <Button size="sm" variant="ghost" onClick={() => setForm((f) => ({ ...f, cv_s3_key: '' }))}>
                  Remove PDF
                </Button>
              )}
            </div>
            <div className="mt-3">
              <Field label="Or an external https:// link" htmlFor="c-cvurl">
                <Input id="c-cvurl" value={form.cv_external_url} onChange={set('cv_external_url')} placeholder="https://" />
              </Field>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recruiter assessment for this vacancy</h3>
          <p className="text-xs text-slate-500">Shown to the employer as a LaunchPath recruiter assessment, with today’s date. Leave blank if not assessed: the card will say “Not assessed”.</p>
          <Field label="Match against the brief" htmlFor="c-match">
            <Select id="c-match" value={form.match_level} onChange={set('match_level')}>
              <option value="">Not rated</option>
              {MATCH_LEVELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Communication (1–5)" htmlFor="c-comm">
              <Select id="c-comm" value={form.communication_rating} onChange={set('communication_rating')}>
                <option value="">Not assessed</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Interview readiness (1–5)" htmlFor="c-ready">
              <Select id="c-ready" value={form.interview_readiness} onChange={set('interview_readiness')}>
                <option value="">Not assessed</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Communication note" htmlFor="c-commnote">
            <Input id="c-commnote" value={form.communication_note} onChange={set('communication_note')} placeholder="e.g. Clear, confident on a 20-minute screening call" />
          </Field>
          <div className="rounded-xl border border-white/[0.06] p-4">
            <p className="text-xs font-medium text-slate-300">Role-specific assessment (where applicable)</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_90px_90px]">
              <Field label="Assessment" htmlFor="c-ra">
                <Input id="c-ra" value={form.role_assessment_name} onChange={set('role_assessment_name')} placeholder="e.g. Excel task" />
              </Field>
              <Field label="Score" htmlFor="c-rs">
                <Input id="c-rs" inputMode="numeric" value={form.role_assessment_score} onChange={set('role_assessment_score')} />
              </Field>
              <Field label="Out of" htmlFor="c-rm">
                <Input id="c-rm" inputMode="numeric" value={form.role_assessment_max} onChange={set('role_assessment_max')} />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Assessment note" htmlFor="c-rn">
                <Input id="c-rn" value={form.role_assessment_note} onChange={set('role_assessment_note')} />
              </Field>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}

/* --------------------------------- Sending -------------------------------- */

function SendModal({ shortlist, defaultTo, onClose, onSend }: { shortlist: any; defaultTo: string; onClose: () => void; onSend: (p: any) => Promise<void> }) {
  const [days, setDays] = useState('14');
  const [email, setEmail] = useState(true);
  const [to, setTo] = useState(defaultTo);
  const [busy, setBusy] = useState(false);
  const n = shortlist.candidates.length;

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={shortlist.status === 'SENT' ? 'Send a new link' : 'Send shortlist to employer'}
      description="Creates a private, expiring link to this shortlist. Existing links keep working until they expire or you revoke them."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await onSend({ expiresInDays: Number(days), sendEmail: email, to });
              setBusy(false);
            }}
          >
            Create link{email ? ' and email' : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {(n < 3 || n > 5) && <Badge tone="warning">This shortlist has {n} candidates; the usual target is 3–5.</Badge>}
        <Field label="Link expires after" htmlFor="s-days">
          <Select id="s-days" value={days} onChange={(e) => setDays(e.target.value)}>
            {[7, 14, 30, 60].map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="h-4 w-4 accent-brand-lime" />
          Email the link to the employer
        </label>
        {email && (
          <Field label="Send to" htmlFor="s-to" hint="Defaults to the vacancy contact.">
            <Input id="s-to" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        )}
      </div>
    </Modal>
  );
}

function SentModal({ result, onClose }: { result: any; onClose: () => void }) {
  const { success } = useToast();
  const emailText: Record<string, string> = {
    SENT: 'The employer has been emailed the link.',
    NOT_CONFIGURED: 'Email is not configured, so nothing was sent. Copy the link below and send it yourself.',
    FAILED: 'The email could not be sent. Copy the link below and send it yourself, or create a new link later.',
    ALREADY_SENT: 'This email was already sent.',
    IN_PROGRESS: 'An email for this link is already being sent.',
    NOT_REQUESTED: 'No email was sent. Copy the link below and share it with the employer.',
  };
  return (
    <Modal open onClose={onClose} size="md" title="Shortlist link created" footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <div className="space-y-4">
        <Badge tone={result.email === 'SENT' ? 'success' : 'warning'}>{emailText[result.email] || result.email}</Badge>
        <div>
          <p className="text-xs text-slate-400">Private link (shown once; it is not stored). Expires {fmtDate(result.expiresAt)}.</p>
          <div className="mt-2 flex gap-2">
            <Input readOnly value={result.url} onFocus={(e) => e.currentTarget.select()} />
            <Button
              icon={Copy}
              onClick={() => {
                navigator.clipboard.writeText(result.url);
                success('Link copied');
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------- Interviews and offers ------------------------- */

function ProcessModal({ entry, act, onClose, onRecordHire }: { entry: any; act: Act; onClose: () => void; onRecordHire: () => void }) {
  const { success } = useToast();
  const [feedback, setFeedback] = useState(entry.employer_feedback || '');
  const [outcome, setOutcome] = useState(entry.interview_outcome || '');
  const [offer, setOffer] = useState(entry.offer_status || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const payload: Record<string, unknown> = { shortlistCandidateId: entry.id };
    if (feedback !== (entry.employer_feedback || '')) payload.employer_feedback = feedback;
    if (outcome !== (entry.interview_outcome || '')) payload.interview_outcome = outcome || null;
    if (offer !== (entry.offer_status || '')) payload.offer_status = offer || null;
    const r = await act('UPDATE_CANDIDATE', payload);
    setBusy(false);
    if (r.ok) {
      success('Saved');
      onClose();
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${entry.display_name}: interviews and offer`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={save} loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Interview requests</h3>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => act('RECORD_INTERVIEW_REQUEST', { shortlistCandidateId: entry.id }).then((r) => r.ok && success(r.data.created ? 'Request recorded' : 'An open request already exists'))}
            >
              Record request
            </Button>
          </div>
          {entry.interview_requests.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No requests yet. Employers request interviews from their link, or record one here if they asked by phone or email.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {entry.interview_requests.map((r: any) => (
                <li key={r.id} className="rounded-xl border border-white/[0.06] p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-200">
                      {fmtDateTime(r.created_at)} · {r.source === 'EMPLOYER_LINK' ? 'via shortlist link' : 'recorded by staff'}
                      {r.requester_name ? ` · ${r.requester_name}` : ''}
                    </span>
                    <Select
                      aria-label="Request status"
                      className="w-40"
                      value={r.status}
                      onChange={(e) => act('UPDATE_INTERVIEW_REQUEST', { requestId: r.id, status: e.target.value })}
                    >
                      {INTERVIEW_REQUEST_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {r.preferred_times && <p className="mt-1 text-xs text-slate-400">Preferred: {r.preferred_times}</p>}
                  {r.message && <p className="mt-1 whitespace-pre-line text-xs text-slate-400">{r.message}</p>}
                  <div className="mt-2 max-w-xs">
                    <Field label="Scheduled for" htmlFor={`r-when-${r.id}`}>
                      <Input
                        id={`r-when-${r.id}`}
                        type="datetime-local"
                        defaultValue={r.scheduled_for ? new Date(r.scheduled_for).toISOString().slice(0, 16) : ''}
                        onBlur={(e) => act('UPDATE_INTERVIEW_REQUEST', { requestId: r.id, scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      />
                    </Field>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {entry.employer_feedback_entries?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-white">Employer dashboard feedback</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {entry.employer_feedback_entries.map((f: any) => (
                <li key={f.id} className="rounded-xl border border-white/[0.06] p-3">
                  <p className="text-slate-200">
                    {f.decision.toLowerCase().replace(/_/g, " ")}
                    {["score_skills", "score_communication", "score_culture", "score_overall"].some((k) => f[k]) &&
                      ` · scorecard: skills ${f.score_skills ?? "–"}, communication ${f.score_communication ?? "–"}, culture ${f.score_culture ?? "–"}, overall ${f.score_overall ?? "–"}`}
                  </p>
                  {f.comment && <p className="mt-1 text-xs text-slate-400">{f.comment}</p>}
                  <p className="mt-1 text-xs text-slate-500">Employer user #{f.user_id} · {fmtDateTime(f.updated_at)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Interview outcome" htmlFor="p-outcome">
            <Select id="p-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="">Not recorded</option>
              {INTERVIEW_OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Offer" htmlFor="p-offer" hint={entry.offer_made_at ? `Offer made ${fmtDate(entry.offer_made_at)}${entry.offer_responded_at ? `, response ${fmtDate(entry.offer_responded_at)}` : ''}` : undefined}>
            <Select id="p-offer" value={offer} onChange={(e) => setOffer(e.target.value)}>
              <option value="">No offer</option>
              {OFFER_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </section>
        <Field label="Employer feedback" htmlFor="p-fb">
          <Textarea id="p-fb" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </Field>

        {!entry.placement && (
          <div className="rounded-xl border border-brand-lime/20 bg-brand-lime/[0.04] p-4 text-sm text-slate-300">
            Hired? Record the placement (start date and annual CTC) on the Placement tab.{' '}
            <button type="button" onClick={onRecordHire} className="cursor-pointer font-medium text-brand-lime hover:underline">
              Go to Placement
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------ Suggestions ------------------------------- */

const CRITERION_TONE: Record<string, "success" | "info" | "danger" | "neutral" | "warning"> = { match: "success", partial: "warning", mismatch: "danger", unknown: "neutral", info: "info" };

/** Explainable suggestions for recruiter review. No score, no automatic rejection; unknown is shown as unknown. */
function Suggestions({ vacancyId, onPick }: { vacancyId: number; onPick: (prefill: any) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/superadmin/vacancies/${vacancyId}/suggestions`, { cache: "no-store" });
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="mb-4 rounded-xl border border-white/[0.06] p-4">
        <p className="text-sm text-slate-300">Suggest platform candidates for this vacancy, with the reasons and the gaps for each.</p>
        <Button className="mt-3" size="sm" loading={loading} onClick={load}>
          Show suggestions
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-white/[0.06] p-4">
      <p className="text-xs text-slate-400">{data.note} Searched {data.poolSize} candidates.</p>
      <ul className="mt-3 max-h-[40vh] divide-y divide-white/[0.06] overflow-y-auto">
        {(data.suggestions || []).map((sg: any) => (
          <li key={sg.candidateId} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="min-w-0 cursor-pointer text-left" onClick={() => setOpen(open === sg.candidateId ? null : sg.candidateId)} aria-expanded={open === sg.candidateId}>
                <p className="text-sm font-medium text-white">{sg.candidate?.name || `Candidate #${sg.candidateId}`}</p>
                <p className="text-xs text-slate-500">
                  {sg.counts.match} match · {sg.counts.partial} partial · {sg.counts.mismatch} mismatch · {sg.counts.unknown} unknown
                  {sg.alreadyShortlisted ? " · already on a shortlist" : ""}
                </p>
              </button>
              <Button
                size="sm"
                disabled={sg.alreadyShortlisted}
                onClick={() =>
                  onPick({
                    candidateId: sg.candidateId,
                    display_name: sg.candidate?.name || "",
                    target_role: sg.candidate?.professional_title || "",
                    location: sg.candidate?.location || "",
                  })
                }
              >
                Review &amp; add
              </Button>
            </div>
            {open === sg.candidateId && (
              <ul className="mt-2 space-y-1">
                {sg.criteria.map((c: any) => (
                  <li key={c.key} className="flex items-start gap-2 text-xs">
                    <Badge tone={CRITERION_TONE[c.status]}>{c.label}</Badge>
                    <span className="text-slate-400">{c.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
        {data.suggestions?.length === 0 && <li className="py-3 text-sm text-slate-500">No platform candidates to suggest.</li>}
      </ul>
    </div>
  );
}
