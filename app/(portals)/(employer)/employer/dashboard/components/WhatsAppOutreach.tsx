'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CalendarClock, CheckCircle2, ExternalLink, FolderGit2, MessageCircleQuestion, LucideIcon } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { Modal } from '@/components/portal/overlay';
import { Button, Field, Input, Skeleton, cx } from '@/components/portal/ui';
import { useToast } from '@/components/ToastNotification';
import { formatSaMobile, normalizeSaMobile } from '@/lib/phone';
import { OUTREACH_TEMPLATES, OutreachTemplateId } from '@/lib/whatsapp-templates';
import type { ActivityEntry } from './ActivityTimeline';

const ICONS: Record<OutreachTemplateId, LucideIcon> = {
  INTERVIEW_INVITE: CalendarClock,
  PORTFOLIO_REQUEST: FolderGit2,
  STATUS_CHECK: MessageCircleQuestion,
};

type SendState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'failed'; message: string; code?: string };

interface WhatsAppOutreachProps {
  applicationId: number;
  candidateName?: string | null;
  phone?: string | null;
  onLogged: (entry: ActivityEntry) => void;
}

/** Local datetime-local value for "tomorrow at 10:00". */
function defaultInterviewTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function WhatsAppOutreach({ applicationId, candidateName, phone, onLogged }: WhatsAppOutreachProps) {
  const toast = useToast();
  const mobile = normalizeSaMobile(phone);
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<OutreachTemplateId>('INTERVIEW_INVITE');
  const [proposedTime, setProposedTime] = useState(defaultInterviewTime());
  const [includeTime, setIncludeTime] = useState(true);
  const [preview, setPreview] = useState<{ text: string; waLink: string } | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [state, setState] = useState<SendState>({ kind: 'idle' });

  const firstName = candidateName?.split(' ')[0] || 'the candidate';
  const timeParam = templateId === 'INTERVIEW_INVITE' && includeTime && proposedTime ? new Date(proposedTime).toISOString() : null;

  // Is API sending available? Decides which button leads.
  useEffect(() => {
    if (!open || configured !== null) return;
    fetch('/api/brevo/whatsapp')
      .then((r) => r.json())
      .then((j) => setConfigured(Boolean(j.configured)))
      .catch(() => setConfigured(false));
  }, [open, configured]);

  // Server-built preview, so what you see is exactly what's sent
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreviewError('');
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/brevo/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, templateId, proposedTime: timeParam, mode: 'preview' }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error);
        setPreview(json);
      } catch (err: any) {
        if (!cancelled) setPreviewError(err.message || 'Could not prepare this message.');
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, applicationId, templateId, timeParam]);

  if (!mobile) return null;

  const close = () => {
    setOpen(false);
    setState({ kind: 'idle' });
  };

  const send = async () => {
    setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/brevo/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, templateId, proposedTime: timeParam, mode: 'api' }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.fallback?.waLink) setPreview((p) => (p ? { ...p, waLink: json.fallback.waLink } : p));
        if (json.code === 'NOT_CONFIGURED') setConfigured(false);
        setState({ kind: 'failed', message: json.error, code: json.code });
        return;
      }
      onLogged(json.activity);
      setState({ kind: 'sent' });
      toast.success(`WhatsApp sent to ${firstName}`);
      setTimeout(close, 1200);
    } catch {
      setState({ kind: 'failed', message: 'Could not reach the server. Try the direct chat instead.' });
    }
  };

  // Fire-and-forget log; the <a> opens WhatsApp synchronously so popup blockers don't interfere
  const logDirect = () => {
    fetch('/api/brevo/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, templateId, proposedTime: timeParam, mode: 'direct' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.activity && onLogged(json.activity))
      .catch(() => {});
    close();
  };

  const apiUnavailable = configured === false || state.kind === 'failed';
  const directPrimary = apiUnavailable;

  const directButton = (
    <a
      href={preview?.waLink || '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => (preview ? logDirect() : e.preventDefault())}
      aria-disabled={!preview}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors',
        directPrimary ? 'bg-[#25D366] text-white hover:bg-[#1EBE5A]' : 'text-brand-navy ring-1 ring-inset ring-slate-200 hover:bg-slate-50',
        !preview && 'pointer-events-none opacity-50',
      )}
    >
      <ExternalLink className="h-4 w-4" />
      Open WhatsApp Web (direct chat)
    </a>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-[#25D366] px-3.5 text-[13px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(37,211,102,0.8)] transition-colors hover:bg-[#1EBE5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 focus-visible:ring-offset-2"
      >
        <WhatsAppIcon className="h-4 w-4" />
        WhatsApp outreach
      </button>

      <Modal
        open={open}
        onClose={close}
        size="lg"
        title={
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] text-white">
              <WhatsAppIcon className="h-4 w-4" />
            </span>
            Message {firstName} on WhatsApp
          </span>
        }
        description={`To ${formatSaMobile(mobile)}`}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {directButton}
            {!directPrimary && (
              <Button
                variant="primary"
                icon={state.kind === 'sent' ? CheckCircle2 : undefined}
                loading={state.kind === 'sending'}
                disabled={!preview || state.kind === 'sent' || configured === null}
                onClick={send}
              >
                {state.kind === 'sent' ? 'Sent' : state.kind === 'sending' ? 'Sending…' : 'Send via WhatsApp'}
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          <div role="radiogroup" aria-label="Message template" className="grid gap-2">
            {OUTREACH_TEMPLATES.map((t) => {
              const Icon = ICONS[t.id];
              const selected = t.id === templateId;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setTemplateId(t.id);
                    setState({ kind: 'idle' });
                  }}
                  className={cx(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                    selected ? 'border-brand-navy bg-brand-navy/[0.03] shadow-[0_0_0_3px_rgba(10,27,61,0.06)]' : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-brand-navy text-brand-lime' : 'bg-slate-100 text-slate-500')}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-brand-navy">{t.label}</span>
                    <span className="block text-xs text-slate-500">{t.description}</span>
                  </span>
                  <span className={cx('h-4 w-4 shrink-0 rounded-full border-2', selected ? 'border-brand-navy bg-brand-navy shadow-[inset_0_0_0_2.5px_white]' : 'border-slate-300')} />
                </button>
              );
            })}
          </div>

          <AnimatePresence initial={false}>
            {templateId === 'INTERVIEW_INVITE' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-navy">
                    <input type="checkbox" checked={includeTime} onChange={(e) => setIncludeTime(e.target.checked)} className="h-4 w-4 accent-brand-navy" />
                    Propose a time
                  </label>
                  {includeTime && (
                    <div className="mt-3">
                      <Field label="Interview date and time" htmlFor="wa-time" hint="South African time. Leave unticked to ask for their availability instead.">
                        <Input id="wa-time" type="datetime-local" value={proposedTime} min={defaultInterviewTime().slice(0, 10) + 'T00:00'} onChange={(e) => setProposedTime(e.target.value)} />
                      </Field>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp-style preview */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Preview</p>
            <div className="rounded-2xl bg-[#EFEAE2] p-4">
              {previewError ? (
                <p className="text-sm text-rose-700">{previewError}</p>
              ) : preview ? (
                <motion.div
                  key={preview.text}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ml-auto max-w-[88%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2.5 text-[14px] leading-relaxed text-[#111B21] shadow-sm"
                >
                  {preview.text}
                </motion.div>
              ) : (
                <div className="ml-auto max-w-[88%] space-y-2 rounded-2xl bg-white/60 p-3.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-11/12" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              )}
            </div>
          </div>

          {configured === false && state.kind !== 'failed' && (
            <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200/70">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              Automatic WhatsApp sending isn’t set up yet, so this opens a direct chat with the message ready to send.
            </p>
          )}

          {state.kind === 'failed' && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-600/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                {state.message}{' '}
                {state.code === 'CREDITS_EXHAUSTED' || state.code === 'NOT_CONFIGURED' || state.code === 'REJECTED' || state.code === 'NETWORK'
                  ? 'You can still reach them now with a direct chat.'
                  : ''}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
