'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, MapPin, Send } from 'lucide-react';
import { Spinner } from '@/components/PortalLoader';
import { cx } from '@/components/portal/ui';
import type { TalentCandidate, TalentPoolResponse } from '@/lib/talent';

interface InviteMenuProps {
  candidate: TalentCandidate;
  roles: TalentPoolResponse['openRoles'];
  onInvite: (candidate: TalentCandidate, jobId: number) => Promise<boolean>;
  /** Open upwards (e.g. in a drawer footer). */
  placement?: 'down' | 'up';
  fullWidth?: boolean;
}

export default function InviteMenu({ candidate, roles, onInvite, placement = 'down', fullWidth = false }: InviteMenuProps) {
  const [open, setOpen] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const invitedCount = roles.filter((r) => candidate.invitedJobIds.includes(r.id)).length;

  const invite = async (jobId: number) => {
    setSendingId(jobId);
    const ok = await onInvite(candidate, jobId);
    setSendingId(null);
    if (ok) setOpen(false);
  };

  return (
    <div ref={ref} className={cx('relative', fullWidth && 'w-full')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cx(
          'inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-3.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(10,27,61,0.2)] transition-colors hover:bg-[#13295A]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 focus-visible:ring-offset-2',
          fullWidth && 'w-full',
        )}
      >
        <Send className="h-3.5 w-3.5" />
        {invitedCount > 0 ? `Invited to ${invitedCount}` : 'Invite to apply'}
        <ChevronDown className={cx('h-3.5 w-3.5 opacity-70 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: placement === 'down' ? -6 : 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === 'down' ? -4 : 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cx(
              'absolute right-0 z-30 w-72 origin-top-right rounded-2xl bg-white p-1.5 shadow-[0_20px_48px_-16px_rgba(10,27,61,0.35)] ring-1 ring-slate-200',
              placement === 'down' ? 'top-full mt-2' : 'bottom-full mb-2',
            )}
          >
            <p className="px-3 pb-1.5 pt-2 text-xs font-medium text-slate-500">Invite {candidate.name.split(' ')[0]} to apply for</p>

            {roles.length === 0 ? (
              <div className="px-3 pb-3 pt-1">
                <p className="text-sm text-slate-600">You need a live role to send invitations.</p>
                <div className="mt-3 flex gap-2">
                  <Link href="/employer/new" className="inline-flex h-8 items-center rounded-lg bg-brand-lime px-3 text-xs font-semibold text-brand-navy hover:bg-brand-lime-soft">
                    Post a job
                  </Link>
                  <Link href="/employer/delete" className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">
                    Publish a draft
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="max-h-72 overflow-y-auto">
                {roles.map((role) => {
                  const applied = candidate.appliedJobIds.includes(role.id);
                  const invited = candidate.invitedJobIds.includes(role.id);
                  const disabled = applied || invited || sendingId !== null;
                  return (
                    <li key={role.id}>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={disabled}
                        onClick={() => invite(role.id)}
                        className={cx(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                          disabled ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className={cx('block truncate text-sm font-medium', applied || invited ? 'text-slate-400' : 'text-brand-navy')}>{role.title}</span>
                          {role.location && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                              <MapPin className="h-3 w-3" /> {role.location}
                            </span>
                          )}
                        </span>
                        {sendingId === role.id ? (
                          <Spinner className="h-4 w-4 text-brand-navy" />
                        ) : applied ? (
                          <span className="text-[11px] font-medium text-emerald-700">Applied</span>
                        ) : invited ? (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                            <Check className="h-3 w-3" /> Invited
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
