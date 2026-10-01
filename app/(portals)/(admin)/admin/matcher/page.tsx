'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Info, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { useAdmin } from '../AdminContext';
import { PageHeader, Card, CardHeader, Field, Input, Textarea, Select, Button, Identity, Badge, cx , EMPTY } from '../_components/ui';

function scoreTone(score: number) {
  if (score >= 85) return { label: 'Prime fit', tone: 'success' as const };
  if (score >= 70) return { label: 'Strong fit', tone: 'info' as const };
  return { label: 'Moderate fit', tone: 'neutral' as const };
}

export default function AdminMatcherPage() {
  const { data, runOverride } = useAdmin();
  const toast = useToast();
  const candidates: any[] = data?.candidates ?? EMPTY;
  const jobs: any[] = data?.jobs ?? EMPTY;

  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState('');
  const [score, setScore] = useState(85);
  const [matched, setMatched] = useState('');
  const [missing, setMissing] = useState('');
  const [summary, setSummary] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const candidate = useMemo(() => candidates.find((c) => String(c.id) === candidateId), [candidates, candidateId]);
  const job = useMemo(() => jobs.find((j) => String(j.id) === jobId), [jobs, jobId]);
  const existing = candidate?.job_matches?.find((m: any) => String(m.job?.id) === jobId);
  const fit = scoreTone(score);

  const handleJobChange = (id: string) => {
    setJobId(id);
    const next = jobs.find((j) => String(j.id) === id);
    // Seed the skills field from the job's requirements so the admin edits rather than types
    if (next && !matched) setMatched((next.mandatory_skills || []).join(', '));
  };

  const reset = () => {
    setCandidateId('');
    setJobId('');
    setScore(85);
    setMatched('');
    setMissing('');
    setSummary('');
    setRecommendation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !jobId) {
      setError('Choose a candidate and a job to create a match.');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await runOverride('MANUAL_MATCH', {
      candidate_id: parseInt(candidateId),
      job_id: parseInt(jobId),
      match_score: score,
      matched_skills: matched,
      missing_skills: missing,
      recommendation,
      fit_summary: summary,
    });
    setSubmitting(false);
    if (res.success) {
      toast.success(`${candidate?.name || 'Candidate'} matched to ${job?.title || 'job'}`);
      reset();
    } else {
      setError(res.error || 'Could not create the match.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matchmaker"
        description="Manually pair a candidate with a job. The match appears in the employer’s pipeline straight away, bypassing AI scoring."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader title="Who and where" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Candidate" htmlFor="match-candidate">
                <Select id="match-candidate" value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
                  <option value="">Select a candidate</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email}
                      {c.professional_title ? ` — ${c.professional_title}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Job" htmlFor="match-job">
                <Select id="match-job" value={jobId} onChange={(e) => handleJobChange(e.target.value)}>
                  <option value="">Select a job</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.company}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {existing && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-sky-400/[0.06] px-3.5 py-2.5 text-xs text-sky-200 ring-1 ring-inset ring-sky-400/15">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This pair already has a {existing.match_score}% match. Saving will overwrite it.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Fit assessment" />
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="match-score" className="text-xs font-medium text-slate-300">
                    Match score
                  </label>
                  <span className="text-sm font-semibold tabular-nums text-white">{score}%</span>
                </div>
                <input
                  id="match-score"
                  type="range"
                  min={50}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-lime"
                />
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Matched skills" hint="Comma-separated">
                  <Input value={matched} onChange={(e) => setMatched(e.target.value)} placeholder="e.g. React, SQL" />
                </Field>
                <Field label="Skill gaps" hint="Comma-separated">
                  <Input value={missing} onChange={(e) => setMissing(e.target.value)} placeholder="e.g. AWS" />
                </Field>
              </div>

              <Field label="Fit summary" hint="Shown to the employer alongside the match.">
                <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Why this candidate suits the role" />
              </Field>

              <Field label="Recommended next step">
                <Input value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="e.g. Fast-track to a technical interview" />
              </Field>
            </div>
          </Card>

          {error && <p className="rounded-xl bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/20">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={reset} disabled={submitting}>
              Reset
            </Button>
            <Button type="submit" variant="primary" loading={submitting} disabled={!candidateId || !jobId}>
              {existing ? 'Update match' : 'Create match'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        {/* Live preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-0">
            <Card>
              <CardHeader title="Preview" description="How this match will look" />
              <div className={cx('space-y-4 transition-opacity', !candidate && !job && 'opacity-50')}>
                <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.05]">
                  <p className="mb-2 text-[11px] font-medium text-slate-500">Candidate</p>
                  {candidate ? (
                    <Identity name={candidate.name} sub={candidate.professional_title || candidate.email} />
                  ) : (
                    <p className="text-sm text-slate-500">Not selected</p>
                  )}
                </div>
                <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.05]">
                  <p className="mb-2 text-[11px] font-medium text-slate-500">Job</p>
                  {job ? (
                    <>
                      <p className="font-medium text-white">{job.title}</p>
                      <p className="text-xs text-slate-500">
                        {job.company}
                        {job.location ? ` · ${job.location}` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Not selected</p>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.05]">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">Score</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{score}%</p>
                  </div>
                  <Badge tone={fit.tone}>
                    <Sparkles className="h-3 w-3" />
                    {fit.label}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
