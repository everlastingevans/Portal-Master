'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BrainCircuit, Check, CheckCircle2, ClipboardCopy, Copy, RefreshCw, SearchCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { Button, Skeleton, cx } from '@/components/portal/ui';
import type { CandidateBriefing } from '@/lib/briefing';

// Session-level cache so reopening an applicant shows their dossier instantly
const sessionCache = new Map<string, CandidateBriefing>();

function scoreBand(score: number) {
  if (score >= 80) return { label: 'Strong fit', bar: 'bg-[#5E8C14]', text: 'text-[#4A7010]' };
  if (score >= 60) return { label: 'Promising fit', bar: 'bg-[#2A78D6]', text: 'text-[#1F5FAD]' };
  if (score >= 40) return { label: 'Partial fit', bar: 'bg-amber-500', text: 'text-amber-700' };
  return { label: 'Weak fit', bar: 'bg-slate-400', text: 'text-slate-600' };
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours}h ago` : new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}

function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      className={cx(
        'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors',
        copied ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-white hover:text-brand-navy hover:shadow-sm',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={copied ? 'done' : 'copy'} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

interface AiDossierCardProps {
  candidateId?: number;
  jobId?: number;
  candidateName?: string;
}

export default function AiDossierCard({ candidateId, jobId, candidateName }: AiDossierCardProps) {
  const key = `${candidateId}:${jobId}`;
  const [briefing, setBriefing] = useState<CandidateBriefing | null>(() => sessionCache.get(key) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset when switching applicants
  useEffect(() => {
    setBriefing(sessionCache.get(key) || null);
    setError('');
    setLoading(false);
  }, [key]);

  const firstName = candidateName?.split(' ')[0] || 'this candidate';

  const generate = async (refresh = false) => {
    if (!candidateId || !jobId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/candidate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, jobId, refresh }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not generate a briefing right now.');
      sessionCache.set(key, json.briefing);
      setBriefing(json.briefing);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const band = briefing ? scoreBand(briefing.matchScore) : null;
  const sourceLabels = briefing
    ? [briefing.sources.resume && 'CV', briefing.sources.skills && 'skills', briefing.sources.transcript && 'video interview'].filter(Boolean).join(', ')
    : '';

  return (
    <section
      aria-label="AI recruiter dossier"
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-brand-navy px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-lime text-brand-navy">
            <BrainCircuit className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">AI recruiter dossier</p>
            <p className="text-xs text-white/55">
              {briefing ? `Generated ${timeAgo(briefing.generatedAt)} from ${sourceLabels}` : 'CV, skills and video interview vs. this role'}
            </p>
          </div>
        </div>
        {briefing && !loading && (
          <button
            type="button"
            onClick={() => generate(true)}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </button>
        )}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4" role="status">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Sparkles className="h-4 w-4 animate-pulse text-brand-navy" />
                Reading {firstName}’s CV and interview against the role…
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/3 rounded-full bg-brand-navy animate-loader-bar" />
              </div>
              <div className="space-y-2.5 pt-1">
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-9/12" />
                <Skeleton className="mt-4 h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-start gap-3">
              <p className="flex items-start gap-2 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
              <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => generate(false)}>
                Try again
              </Button>
            </motion.div>
          ) : briefing && band ? (
            <motion.div key="ready" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
              {/* Score */}
              <div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Role fit</p>
                    <p className={cx('mt-0.5 text-sm font-semibold', band.text)}>{band.label}</p>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-brand-navy">
                    <span className="tabular-nums">{briefing.matchScore}</span>
                    <span className="text-base font-medium text-slate-400">/100</span>
                  </p>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={briefing.matchScore}
                  aria-label="AI match score"
                >
                  <motion.div
                    className={cx('h-full rounded-full', band.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${briefing.matchScore}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              {/* Strengths & probes */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2.5 text-xs font-semibold text-brand-navy">Key strengths</p>
                  <ul className="space-y-2.5">
                    {briefing.keyStrengths.map((s, i) => (
                      <motion.li
                        key={s}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="flex gap-2.5 text-sm leading-snug text-slate-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5E8C14]" /> {s}
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2.5 text-xs font-semibold text-brand-navy">Areas to probe</p>
                  <ul className="space-y-2.5">
                    {briefing.areasToProbe.map((s, i) => (
                      <motion.li
                        key={s}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.06 }}
                        className="flex gap-2.5 text-sm leading-snug text-slate-700"
                      >
                        <SearchCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> {s}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-brand-navy">Suggested interview questions</p>
                  <CopyAllButton questions={briefing.suggestedInterviewQuestions} />
                </div>
                <ol className="space-y-2">
                  {briefing.suggestedInterviewQuestions.map((q, i) => (
                    <motion.li
                      key={q}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.07 }}
                      className="group flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200/70"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-semibold tabular-nums text-brand-lime">{i + 1}</span>
                      <p className="flex-1 pt-0.5 text-sm leading-relaxed text-slate-700">{q}</p>
                      <CopyButton text={q} label={`Copy question ${i + 1}`} />
                    </motion.li>
                  ))}
                </ol>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-400">
                AI-generated from the candidate’s own CV and interview. It can be wrong. Use it to prepare, not to decide.
              </p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-slate-600">
                Get a fit score, {firstName}’s key strengths, what to probe, and three interview questions tailored to this role.
              </p>
              <Button variant="primary" icon={Sparkles} onClick={() => generate(false)} disabled={!candidateId || !jobId} className="shrink-0">
                Generate briefing
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function CopyAllButton({ questions }: { questions: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(questions.map((q, i) => `${i + 1}. ${q}`).join('\n'))) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
      className={cx(
        'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors',
        copied ? 'text-emerald-600' : 'text-slate-500 hover:bg-slate-100 hover:text-brand-navy',
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy all'}
    </button>
  );
}
