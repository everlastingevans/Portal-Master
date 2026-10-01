'use client';

import { Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bold, List, Lock, NotebookPen, Trash2, Users } from 'lucide-react';
import { useConfirm } from '@/components/portal/overlay';
import { StarRatingDisplay, StarRatingInput } from '@/components/portal/StarRating';
import { Alert, Avatar, Button, IconButton, Skeleton, cx } from '@/components/portal/ui';
import { useToast } from '@/components/ToastNotification';

type Ratings = { rating_technical: number | null; rating_communication: number | null; rating_culture: number | null };

interface Note extends Ratings {
  id: number;
  content: string;
  created_at: string;
  isMine: boolean;
  author: { id: number; name: string | null } | null;
}

type Summary = Record<'technical' | 'communication' | 'culture', { average: number; count: number } | null>;

const CATEGORIES: { key: keyof Ratings; summaryKey: keyof Summary; label: string }[] = [
  { key: 'rating_technical', summaryKey: 'technical', label: 'Technical' },
  { key: 'rating_communication', summaryKey: 'communication', label: 'Communication' },
  { key: 'rating_culture', summaryKey: 'culture', label: 'Culture fit' },
];

const EMPTY_RATINGS: Ratings = { rating_technical: null, rating_communication: null, rating_culture: null };
const MAX_LENGTH = 5000;

/* --------------------------- Safe note formatting --------------------------- */
// Supports **bold** and "- " bullet lines. Rendered as React nodes; never as HTML.

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold text-brand-navy">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function FormattedNote({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-0.5 pl-5">
        {bullets.map((b, i) => (
          <li key={i}>{inline(b)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  content.split('\n').forEach((line, i) => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) return void bullets.push(bullet[1]);
    flush();
    if (line.trim()) blocks.push(<p key={`p-${i}`}>{inline(line)}</p>);
  });
  flush();
  return <div className="space-y-2 text-sm leading-relaxed text-slate-700">{blocks}</div>;
}

function relative(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* --------------------------------- Panel --------------------------------- */

export default function TeamEvaluationPanel({ applicationId, candidateName, onCountChange }: { applicationId: number; candidateName?: string; onCountChange?: (n: number) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [notes, setNotes] = useState<Note[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [content, setContent] = useState('');
  const [ratings, setRatings] = useState<Ratings>(EMPTY_RATINGS);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoadError('');
    try {
      const res = await fetch(`/api/applications/${applicationId}/notes`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNotes(json.notes);
      setSummary(json.summary);
      onCountChange?.(json.notes.length);
    } catch (err: any) {
      setLoadError(err.message || 'Could not load notes.');
    }
  };

  useEffect(() => {
    setNotes(null);
    setSummary(null);
    setContent('');
    setRatings(EMPTY_RATINGS);
    setFormError('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  // Auto-grow the textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [content]);

  const applyFormat = (kind: 'bold' | 'bullet') => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    let next: string;
    let cursor: [number, number];
    if (kind === 'bold') {
      const selected = value.slice(s, e) || 'bold text';
      next = `${value.slice(0, s)}**${selected}**${value.slice(e)}`;
      cursor = [s + 2, s + 2 + selected.length];
    } else {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      next = `${value.slice(0, lineStart)}- ${value.slice(lineStart)}`;
      cursor = [s + 2, e + 2];
    }
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(...cursor);
    });
  };

  const hasInput = content.trim().length > 0 || Object.values(ratings).some((r) => r !== null);

  const submit = async () => {
    if (!hasInput || saving) return;
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch(`/api/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, ...ratings }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContent('');
      setRatings(EMPTY_RATINGS);
      toast.success('Evaluation saved');
      await load(); // refresh team averages
    } catch (err: any) {
      setFormError(err.message || 'Could not save the note.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (note: Note) => {
    const ok = await confirm({ title: 'Delete this note?', description: 'It will be removed for everyone on your hiring team.', confirmLabel: 'Delete note', tone: 'danger' });
    if (!ok) return;
    const res = await fetch(`/api/applications/${applicationId}/notes?noteId=${note.id}`, { method: 'DELETE' });
    if (res.ok) {
      await load();
      toast.success('Note deleted');
    } else {
      toast.error((await res.json().catch(() => ({}))).error || 'Could not delete the note.');
    }
  };

  const firstName = candidateName?.split(' ')[0] || 'this candidate';
  const ratedCount = notes?.filter((n) => n.rating_technical || n.rating_communication || n.rating_culture).length ?? 0;

  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200/70">
        <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        Private to your hiring team. {firstName} will never see these notes or ratings.
      </p>

      {/* Team averages */}
      <section aria-label="Team ratings" className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-navy">Team rating</p>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5" />
            {ratedCount} evaluation{ratedCount === 1 ? '' : 's'}
          </span>
        </div>
        {summary === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <dl className="space-y-3">
            {CATEGORIES.map(({ summaryKey, label }) => {
              const s = summary[summaryKey];
              return (
                <div key={summaryKey} className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-slate-600">{label}</dt>
                  <dd className="flex items-center gap-2.5">
                    <StarRatingDisplay value={s?.average ?? null} size="md" />
                    <span className="w-8 text-right text-sm font-semibold tabular-nums text-brand-navy">{s ? s.average.toFixed(1) : '—'}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </section>

      {/* Composer */}
      <section aria-label="Add an evaluation" className="rounded-2xl border border-slate-200/80 bg-white">
        <div className="space-y-3.5 border-b border-slate-100 p-5">
          {CATEGORIES.map(({ key, label }) => (
            <StarRatingInput key={key} label={label} value={ratings[key]} onChange={(v) => setRatings((r) => ({ ...r, [key]: v }))} disabled={saving} />
          ))}
        </div>
        <div className="p-5">
          <div className="overflow-hidden rounded-xl border border-slate-200 transition-colors focus-within:border-brand-navy/40 focus-within:ring-4 focus-within:ring-brand-navy/[0.06]">
            <div className="flex items-center gap-0.5 border-b border-slate-100 bg-slate-50/70 px-1.5 py-1" role="toolbar" aria-label="Formatting">
              <IconButton icon={Bold} label="Bold (wrap in **)" onClick={() => applyFormat('bold')} />
              <IconButton icon={List} label="Bullet point" onClick={() => applyFormat('bullet')} />
              <span className="ml-auto pr-2 text-[11px] tabular-nums text-slate-400">
                {content.length}/{MAX_LENGTH}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={4}
              disabled={saving}
              aria-label="Interview notes"
              placeholder={`How did ${firstName} come across? Evidence, concerns, and a recommendation…`}
              className="block w-full resize-none bg-white px-3.5 py-3 text-sm leading-relaxed text-brand-navy placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          {formError && (
            <div className="mt-3">
              <Alert>{formError}</Alert>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="hidden text-[11px] text-slate-400 sm:block">Ctrl + Enter to save</span>
            <Button variant="primary" icon={NotebookPen} loading={saving} disabled={!hasInput} onClick={submit} className="ml-auto">
              Save evaluation
            </Button>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section aria-label="Team notes">
        <p className="mb-4 text-sm font-semibold text-brand-navy">Notes</p>
        {loadError ? (
          <Alert>
            {loadError}{' '}
            <button type="button" onClick={load} className="font-semibold underline underline-offset-2">
              Retry
            </button>
          </Alert>
        ) : notes === null ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No notes yet. Be the first on your team to evaluate {firstName}.
          </p>
        ) : (
          <ol className="relative space-y-5 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-px before:bg-slate-200">
            <AnimatePresence initial={false}>
              {notes.map((note) => {
                const rated = CATEGORIES.filter((c) => note[c.key] !== null);
                return (
                  <motion.li key={note.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="relative flex gap-3">
                    <span className="relative z-10 rounded-xl ring-4 ring-white">
                      <Avatar name={note.author?.name || 'Former member'} size="sm" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">
                          <span className="font-semibold text-brand-navy">{note.isMine ? 'You' : note.author?.name || 'Former team member'}</span>{' '}
                          <time dateTime={note.created_at} title={new Date(note.created_at).toLocaleString('en-ZA')} className="text-xs text-slate-500">
                            · {relative(note.created_at)}
                          </time>
                        </p>
                        {note.isMine && <IconButton icon={Trash2} label="Delete note" tone="danger" onClick={() => remove(note)} className="-mr-1 -mt-1" />}
                      </div>
                      <div className={cx('mt-2 rounded-xl bg-white p-3.5 ring-1 ring-inset ring-slate-200/80', !note.content && !rated.length && 'hidden')}>
                        {rated.length > 0 && (
                          <dl className={cx('flex flex-wrap gap-x-4 gap-y-1.5', note.content && 'mb-3 border-b border-slate-100 pb-3')}>
                            {rated.map((c) => (
                              <div key={c.key} className="flex items-center gap-1.5">
                                <dt className="text-xs text-slate-500">{c.label}</dt>
                                <dd>
                                  <StarRatingDisplay value={note[c.key]} />
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        {note.content && <FormattedNote content={note.content} />}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        )}
      </section>
    </div>
  );
}
