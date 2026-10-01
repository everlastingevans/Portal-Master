'use client';

import { useState, useEffect, ReactNode } from 'react';
import LaunchpathMuxPlayer from '@/components/LaunchpathMuxPlayer';
import {
  X,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Calendar,
  Clock,
  Check,
  Copy,
  Save,
  Video,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Badge, BadgeTone, Button, EmptyState, Identity, Segmented, StatusBadge, Table, TBody, Td, Th, THead, Tr, Textarea, cx, statusTone } from '../_components/ui';
import { useToast } from '@/components/ToastNotification';
import { OverlayPortal } from '@/components/portal/overlay';

// Brand video poster (navy surface, lime play mark)
const LAUNCHPATH_POSTER_SVG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
  <rect width="800" height="450" fill="#081227"/>
  <rect x="0.5" y="0.5" width="799" height="449" fill="none" stroke="#ffffff" stroke-opacity="0.06"/>
  <circle cx="400" cy="200" r="38" fill="#A6F23C" fill-opacity="0.12" stroke="#A6F23C" stroke-opacity="0.5" stroke-width="1.5"/>
  <polygon points="390,184 418,200 390,216" fill="#A6F23C"/>
  <text x="400" y="285" fill="#ffffff" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="600" text-anchor="middle">Video interview</text>
  <text x="400" y="310" fill="#94a3b8" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="12" text-anchor="middle">LaunchPath readiness assessment</text>
</svg>`,
  );

interface SuperadminCandidateInspectorProps {
  inspectCandidate: any;
  setInspectCandidate: (candidate: any) => void;
  inspectTab: string;
  setInspectTab: (tab: string) => void;
  interviews: any[];
  onRefresh?: () => void;
}

type InspectTab = 'profile' | 'video' | 'matches' | 'pipeline';

/* ------------------------------ Local helpers ----------------------------- */

function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-850/60 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-white">{children}</div>
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="font-normal text-slate-500">{children}</span>;
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-3.5 py-3 text-xs leading-relaxed text-rose-200">
      <AlertCircle className="mt-px h-4 w-4 shrink-0 text-rose-300" />
      <span>{message}</span>
    </div>
  );
}

function scoreTone(score: number): BadgeTone {
  if (score < 55) return 'danger';
  if (score < 75) return 'warning';
  return 'success';
}

function applicationTone(status?: string): BadgeTone {
  if (status === 'Declined') return 'danger';
  const tone = statusTone(status);
  return tone === 'neutral' ? 'warning' : tone;
}

function interviewTone(status?: string): BadgeTone {
  if (status === 'Confirmed') return 'success';
  if (status === 'Cancelled') return 'danger';
  return 'warning';
}

function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 text-xs font-medium text-slate-200 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/60"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
    </a>
  );
}

/* -------------------------------- Component ------------------------------- */

export default function SuperadminCandidateInspector({
  inspectCandidate,
  setInspectCandidate,
  inspectTab,
  setInspectTab,
  interviews = [],
  onRefresh
}: SuperadminCandidateInspectorProps) {
  const toast = useToast();
  const readiness = inspectCandidate?.video_interviews?.[0];
  const [manualScore, setManualScore] = useState(0);
  const [manualFeedback, setManualFeedback] = useState('');
  const [manualQuestions, setManualQuestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isOpen = Boolean(inspectCandidate);

  useEffect(() => {
    if (readiness) {
      setManualScore(readiness.score || 0);
      setManualFeedback(readiness.feedback || '');
      let parsed: any[] = [];
      try {
        parsed = typeof readiness.questions === 'string'
          ? JSON.parse(readiness.questions)
          : (readiness.questions || []);
      } catch (e) {
        parsed = [];
      }
      setManualQuestions(parsed);
    } else {
      setManualScore(0);
      setManualFeedback('');
      setManualQuestions([]);
    }
    setSubmitError('');
  }, [inspectCandidate, readiness]);

  // Escape to close + body scroll lock while the drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setInspectCandidate(null);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, setInspectCandidate]);

  const handleSaveGrades = async () => {
    if (!readiness) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/superadmin/video-interview/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: readiness.id,
          score: manualScore,
          feedback: manualFeedback,
          questions: manualQuestions
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit score grading');
      }

      toast.success('Score saved and interview approved');

      const updatedVideoArr = [{
        ...readiness,
        score: manualScore,
        feedback: manualFeedback,
        status: 'COMPLETED',
        questions: typeof readiness.questions === 'string'
          ? JSON.stringify(manualQuestions)
          : manualQuestions
      }];

      setInspectCandidate({
        ...inspectCandidate,
        video_interviews: updatedVideoArr
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Could not save the score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionTranscriptChange = (qi: number, value: string) => {
    const updated = [...manualQuestions];
    updated[qi] = { ...updated[qi], transcript: value };
    setManualQuestions(updated);
  };

  const handleQuestionScoreChange = (qi: number, value: number) => {
    const updated = [...manualQuestions];
    const scoreVal = Math.max(0, Math.min(100, value));
    updated[qi] = {
      ...updated[qi],
      questionScore: scoreVal,
      score: scoreVal,
      question_score: scoreVal
    };
    setManualQuestions(updated);
  };

  const handleCopyResume = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.clipboard) {
      window.navigator.clipboard.writeText(inspectCandidate.resume_text || '');
      toast.success('Resume text copied');
    }
  };

  if (!inspectCandidate) return null;

  const close = () => setInspectCandidate(null);
  const matches: any[] = inspectCandidate.job_matches || [];
  const applications: any[] = inspectCandidate.applications || [];
  const candidateInterviews = (interviews || []).filter((iv: any) => iv.candidate_id === inspectCandidate.id);
  const resumeTask = inspectCandidate.resume_tasks?.[0];

  const tabOptions: { value: InspectTab; label: string; count?: number }[] = [
    { value: 'profile', label: 'Profile' },
    { value: 'video', label: 'Video interview' },
    { value: 'matches', label: 'Matches', count: matches.length },
    { value: 'pipeline', label: 'Pipeline', count: applications.length },
  ];

  return (
    <OverlayPortal>
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Candidate ${inspectCandidate.name || ''}`}>
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in" onClick={close} />

      <aside className="h-app absolute right-0 top-0 flex w-full max-w-3xl flex-col border-l border-white/[0.06] bg-ink-900 shadow-2xl shadow-black/50 animate-fade-in">
        {/* Header */}
        <header className="space-y-4 border-b border-white/[0.06] px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Identity
                name={inspectCandidate.name}
                sub={inspectCandidate.professional_title || 'Candidate'}
              />
              <Badge>#{inspectCandidate.id}</Badge>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-mr-2 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            {inspectCandidate.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                {inspectCandidate.email}
              </span>
            )}
            {inspectCandidate.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                {inspectCandidate.phone}
              </span>
            )}
            {inspectCandidate.experience_level && (
              <Badge>
                <span className="capitalize">{String(inspectCandidate.experience_level).toLowerCase()}</span>
              </Badge>
            )}
            {(inspectCandidate.linkedin_url || inspectCandidate.github_url) && (
              <span className="ml-auto flex items-center gap-2">
                {inspectCandidate.linkedin_url && <LinkButton href={inspectCandidate.linkedin_url}>LinkedIn</LinkButton>}
                {inspectCandidate.github_url && <LinkButton href={inspectCandidate.github_url}>GitHub</LinkButton>}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <Segmented<InspectTab>
              value={inspectTab as InspectTab}
              onChange={(v) => setInspectTab(v)}
              options={tabOptions}
            />
          </div>
        </header>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {/* PROFILE */}
          {inspectTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DetailItem label="Job title">{inspectCandidate.professional_title || <Muted>Not specified</Muted>}</DetailItem>
                <DetailItem label="Email">
                  <span className="block truncate">{inspectCandidate.email || <Muted>Not specified</Muted>}</span>
                </DetailItem>
                <DetailItem label="Resume processing">
                  {resumeTask ? (
                    <Badge tone={statusTone(resumeTask.status)} dot>
                      <span className="capitalize">{String(resumeTask.status || '').toLowerCase()}</span>
                      <span className="tabular-nums">{resumeTask.progress}%</span>
                    </Badge>
                  ) : (
                    <Muted>No tasks queued</Muted>
                  )}
                </DetailItem>
              </div>

              <Section title="Education and preferences">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem label="Institution">{inspectCandidate.study_institution || <Muted>Not specified</Muted>}</DetailItem>
                  <DetailItem label="Field of study">{inspectCandidate.study_specialisation || <Muted>Not specified</Muted>}</DetailItem>
                  <div className="sm:col-span-2">
                    <DetailItem label="Seeking roles">{inspectCandidate.seeking_roles || <Muted>Not specified</Muted>}</DetailItem>
                  </div>
                </div>
              </Section>

              <Section title="Documents">
                <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06]">
                  {[
                    { label: 'Degree certificate', url: inspectCandidate.certificates_url, action: 'View certificate' },
                    { label: 'Police clearance', url: inspectCandidate.police_clearance_url, action: 'View clearance' },
                  ].map((doc) => (
                    <div key={doc.label} className="flex items-center justify-between gap-4 bg-ink-850/40 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{doc.label}</p>
                          {doc.url ? (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-300">
                              <Check className="h-3.5 w-3.5" /> Uploaded
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-slate-500">Not uploaded</p>
                          )}
                        </div>
                      </div>
                      {doc.url && <LinkButton href={doc.url}>{doc.action}</LinkButton>}
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="Resume text"
                description="Extracted from the uploaded resume and used for matching."
                action={
                  <Button size="sm" variant="secondary" icon={Copy} onClick={handleCopyResume} type="button">
                    Copy
                  </Button>
                }
              >
                <div className="max-h-96 select-text overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-ink-950/60 p-5 text-xs leading-relaxed text-slate-300">
                  {inspectCandidate.resume_text || <span className="text-slate-500">No resume text available.</span>}
                </div>
                <p className="text-xs text-slate-500">Candidate data is handled in line with POPIA.</p>
              </Section>
            </div>
          )}

          {/* VIDEO INTERVIEW */}
          {inspectTab === 'video' && (
            <div className="animate-fade-in">
              {!readiness ? (
                <EmptyState
                  icon={Video}
                  title="No video interview yet"
                  description="This candidate hasn't recorded their video interview or completed the readiness screen."
                />
              ) : (
                <div className="space-y-8">
                  <Section
                    title="Recording"
                    action={readiness.status === 'PENDING_REVIEW' ? <Badge tone="warning" dot>Awaiting review</Badge> : <StatusBadge status={readiness.status} />}
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-white/[0.06] bg-black">
                      <LaunchpathMuxPlayer
                        videoUrl={readiness?.video_url as string | undefined}
                        poster={LAUNCHPATH_POSTER_SVG}
                        className="h-full w-full"
                      />
                    </div>
                  </Section>

                  <Section
                    title="Overall score"
                    action={<Badge tone={scoreTone(manualScore)}><span className="tabular-nums">{manualScore}%</span></Badge>}
                  >
                    <div className="space-y-3 rounded-xl border border-white/[0.06] bg-ink-850/40 p-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          aria-label="Overall score"
                          className="h-1.5 w-full cursor-pointer accent-brand-lime"
                          value={manualScore}
                          onChange={(e) => setManualScore(Number(e.target.value))}
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          aria-label="Overall score value"
                          className="h-9 w-20 rounded-lg border border-white/[0.08] bg-ink-950/60 text-center text-sm font-medium tabular-nums text-white focus:border-brand-lime/50 focus:outline-none focus:ring-4 focus:ring-brand-lime/10"
                          value={manualScore}
                          onChange={(e) => setManualScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                        />
                      </div>
                    </div>
                  </Section>

                  <Section title="Feedback" description="Shared with the candidate as coaching notes.">
                    <Textarea
                      rows={4}
                      value={manualFeedback}
                      onChange={(e) => setManualFeedback(e.target.value)}
                      placeholder="Summary, rationale and coaching notes"
                    />
                  </Section>

                  <Section
                    title={`Questions (${manualQuestions.length})`}
                    description="Correct transcripts and adjust per-question scores."
                  >
                    <div className="space-y-3">
                      {manualQuestions.map((q: any, qi: number) => {
                        const qScore = q.questionScore ?? q.score ?? q.question_score ?? 0;
                        return (
                          <div key={q.id || qi} className="space-y-3 rounded-xl border border-white/[0.06] bg-ink-850/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="min-w-0 text-sm font-medium text-white">
                                <span className="mr-2 text-slate-500 tabular-nums">Q{q.id || qi + 1}</span>
                                {q.title}
                              </p>
                              <label className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                                Score
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="h-8 w-16 rounded-lg border border-white/[0.08] bg-ink-950/60 text-center text-xs font-medium tabular-nums text-white focus:border-brand-lime/50 focus:outline-none focus:ring-4 focus:ring-brand-lime/10"
                                  value={qScore}
                                  onChange={(e) => handleQuestionScoreChange(qi, Number(e.target.value))}
                                />
                                %
                              </label>
                            </div>
                            <Textarea
                              rows={3}
                              aria-label={`Transcript for question ${q.id || qi + 1}`}
                              className="text-xs"
                              value={q.transcript || ''}
                              onChange={(e) => handleQuestionTranscriptChange(qi, e.target.value)}
                              placeholder="No transcript. Add one manually."
                            />
                          </div>
                        );
                      })}
                    </div>
                  </Section>

                  <div className="space-y-3 border-t border-white/[0.06] pt-6">
                    {submitError && <ErrorAlert message={submitError} />}
                    <div className="flex justify-end">
                      <Button variant="primary" icon={Save} loading={isSubmitting} onClick={handleSaveGrades}>
                        Save score and approve
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MATCHES */}
          {inspectTab === 'matches' && (
            <div className="animate-fade-in">
              {matches.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No matches yet"
                  description="Run a rescore or create a match manually in Matchmaker."
                />
              ) : (
                <Section title="Job matches" description="How this candidate compares with open roles.">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {matches.map((m: any, idx: number) => {
                      const score = m.match_score;
                      const tone: BadgeTone = score >= 85 ? 'success' : score < 60 ? 'neutral' : 'info';
                      const barColor = score >= 85 ? 'bg-emerald-400' : score < 60 ? 'bg-slate-500' : 'bg-sky-400';
                      return (
                        <div key={m.id || idx} className="space-y-4 rounded-xl border border-white/[0.06] bg-ink-850/40 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{m.job?.title || 'Untitled role'}</p>
                              <p className="mt-0.5 truncate text-xs text-slate-400">{m.job?.company || 'LaunchPath'}</p>
                            </div>
                            <Badge tone={tone}><span className="tabular-nums">{score}% fit</span></Badge>
                          </div>

                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div className={cx('h-full rounded-full', barColor)} style={{ width: `${score}%` }} />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <p className="text-slate-500">Matched skills</p>
                              <p className="leading-relaxed text-slate-300">{m.matched_skills || 'None mapped'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-500">Missing skills</p>
                              <p className="leading-relaxed text-slate-300">{m.missing_skills || 'None'}</p>
                            </div>
                          </div>

                          <div className="space-y-3 border-t border-white/[0.06] pt-4 text-xs">
                            <div className="space-y-1">
                              <p className="text-slate-500">Summary</p>
                              <p className="leading-relaxed text-slate-300">{m.fit_summary || 'Pending'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-500">Recommendation</p>
                              <p className="leading-relaxed text-slate-300">{m.recommendation || 'Pending'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* PIPELINE */}
          {inspectTab === 'pipeline' && (
            <div className="space-y-8 animate-fade-in">
              <Section title="Applications" description={`${applications.length} submitted`}>
                {applications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.08]">
                    <EmptyState icon={FileText} title="No applications yet" />
                  </div>
                ) : (
                  <Table>
                    <THead>
                      <Th>Position</Th>
                      <Th>Company</Th>
                      <Th>Applied</Th>
                      <Th align="right">Status</Th>
                    </THead>
                    <TBody>
                      {applications.map((app: any, idx: number) => (
                        <Tr key={app.id || idx}>
                          <Td className="font-medium text-white">{app.job?.title || 'Deleted position'}</Td>
                          <Td className="text-slate-400">{app.job?.company || 'LaunchPath client'}</Td>
                          <Td className="whitespace-nowrap text-slate-400">
                            {app.applied_at ? new Date(app.applied_at).toLocaleString('en-US', { dateStyle: 'medium' }) : 'N/A'}
                          </Td>
                          <Td align="right">
                            <Badge tone={applicationTone(app.status)} dot>{app.status}</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                )}
              </Section>

              <Section title="Scheduled interviews">
                {candidateInterviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.08]">
                    <EmptyState icon={Calendar} title="No interviews scheduled" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {candidateInterviews.map((iv: any) => (
                      <div key={iv.id} className="space-y-3 rounded-xl border border-white/[0.06] bg-ink-850/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{iv.application?.job?.title || 'Open position'}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {iv.application?.job?.company || 'Employer'} · #{iv.id}
                            </p>
                          </div>
                          <Badge tone={interviewTone(iv.status)} dot>{iv.status}</Badge>
                        </div>
                        <p className="inline-flex items-center gap-2 text-xs text-slate-300">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {new Date(iv.proposed_time).toLocaleString()}
                        </p>
                        {iv.notes && (
                          <p className="border-t border-white/[0.06] pt-3 text-xs leading-relaxed text-slate-400">{iv.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}
        </div>
      </aside>
    </div>
    </OverlayPortal>
  );
}
