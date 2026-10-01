'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ExternalLink, History, NotebookPen } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { Skeleton, cx } from '@/components/portal/ui';

export interface ActivityEntry {
  id: number;
  type: string;
  channel: string | null;
  summary: string;
  created_at: string;
  actor: { name: string | null } | null;
}

const TYPE_STYLE: Record<string, { icon: JSX.Element; tile: string }> = {
  WHATSAPP_SENT: { icon: <WhatsAppIcon className="h-3.5 w-3.5" />, tile: 'bg-[#25D366]/15 text-[#128C4B]' },
  WHATSAPP_DIRECT: { icon: <ExternalLink className="h-3.5 w-3.5" />, tile: 'bg-slate-100 text-slate-600' },
  WHATSAPP_FAILED: { icon: <AlertCircle className="h-3.5 w-3.5" />, tile: 'bg-rose-50 text-rose-600' },
  NOTE_ADDED: { icon: <NotebookPen className="h-3.5 w-3.5" />, tile: 'bg-brand-navy/[0.06] text-brand-navy' },
};

function when(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Application history. New entries can be pushed in via `latest` without refetching. */
export default function ActivityTimeline({ applicationId, latest }: { applicationId: number; latest: ActivityEntry[] }) {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setFailed(false);
    fetch(`/api/employer/applications/${applicationId}/activity`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => !cancelled && setEntries(json.activities || []))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  // Merge freshly logged entries (newest first, no duplicates)
  const merged = [...latest, ...(entries || [])].filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i);

  if (entries === null && !failed && latest.length === 0) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-4/5 rounded-xl" />
      </div>
    );
  }

  if (merged.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <History className="h-4 w-4 text-slate-400" />
        {failed ? 'History couldn’t be loaded.' : 'No outreach yet. Messages you send will appear here.'}
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-slate-200">
      <AnimatePresence initial={false}>
        {merged.map((e) => {
          const style = TYPE_STYLE[e.type] || { icon: <History className="h-3.5 w-3.5" />, tile: 'bg-slate-100 text-slate-600' };
          return (
            <motion.li key={e.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="relative flex gap-3">
              <span className={cx('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white', style.tile)}>{style.icon}</span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm text-brand-navy">{e.summary}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {when(e.created_at)}
                  {e.actor?.name && ` · ${e.actor.name}`}
                </p>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
