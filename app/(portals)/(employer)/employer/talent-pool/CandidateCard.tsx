'use client';

import { motion } from 'motion/react';
import { BadgeCheck, Clock, FileCheck2, GraduationCap, Linkedin, MapPin, ShieldCheck, Sparkles, FolderGit2, LucideIcon } from 'lucide-react';
import { Avatar, cx } from '@/components/portal/ui';
import { availabilityLabel, TalentCandidate, TalentPoolResponse } from '@/lib/talent';
import InviteMenu from './InviteMenu';

/** Credential badges, ordered strongest-first. Only "assessed" ones were checked by LaunchPath. */
export function credentialList(c: TalentCandidate): { key: string; label: string; icon: LucideIcon; assessed?: boolean }[] {
  const list: { key: string; label: string; icon: LucideIcon; assessed?: boolean }[] = [];
  if (c.credentials.videoAssessed) list.push({ key: 'video', label: 'Interview assessed', icon: BadgeCheck, assessed: true });
  if (c.credentials.cvOnFile) list.push({ key: 'cv', label: 'CV on file', icon: FileCheck2 });
  if (c.credentials.policeClearance) list.push({ key: 'police', label: 'Police clearance', icon: ShieldCheck });
  if (c.credentials.certificates) list.push({ key: 'certs', label: 'Certificates', icon: GraduationCap });
  if (c.credentials.linkedin) list.push({ key: 'linkedin', label: 'LinkedIn', icon: Linkedin });
  if (c.credentials.portfolio) list.push({ key: 'portfolio', label: 'Portfolio', icon: FolderGit2 });
  return list;
}

export function AvailabilityPill({ value }: { value: string | null }) {
  const label = availabilityLabel(value, true);
  if (!label) return null;
  const immediate = value === 'IMMEDIATE';
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        immediate ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' : 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      {immediate ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <Clock className="h-3 w-3" />}
      {immediate ? 'Available now' : `In ${label}`}
    </span>
  );
}

export function ReadinessBadge({ score, size = 'md' }: { score: number | null; size?: 'md' | 'lg' }) {
  if (score === null) return null;
  const big = size === 'lg';
  const r = big ? 26 : 18;
  const circ = 2 * Math.PI * r;
  const box = big ? 64 : 44;
  return (
    <div className="flex shrink-0 flex-col items-center" title="AI video readiness score">
      <div className="relative" style={{ width: box, height: box }}>
        <svg viewBox={`0 0 ${box} ${box}`} className="-rotate-90" width={box} height={box} aria-hidden>
          <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="#EEF1F5" strokeWidth={big ? 6 : 4} />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={r}
            fill="none"
            stroke="#5E8C14"
            strokeWidth={big ? 6 : 4}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
          />
        </svg>
        <span className={cx('absolute inset-0 flex items-center justify-center font-semibold tabular-nums text-brand-navy', big ? 'text-lg' : 'text-[13px]')}>{score}</span>
      </div>
      <span className="mt-1 text-[10px] font-medium text-slate-400">Readiness</span>
    </div>
  );
}

interface CandidateCardProps {
  candidate: TalentCandidate;
  roles: TalentPoolResponse['openRoles'];
  highlightSkills: string[];
  onView: (c: TalentCandidate) => void;
  onInvite: (c: TalentCandidate, jobId: number) => Promise<boolean>;
  index: number;
}

export default function CandidateCard({ candidate: c, roles, highlightSkills, onView, onInvite, index }: CandidateCardProps) {
  const credentials = credentialList(c);
  const wanted = highlightSkills.map((s) => s.toLowerCase());
  // Show skills the employer filtered for first, then the rest
  const skills = [...c.skills].sort((a, b) => Number(wanted.some((w) => b.toLowerCase().includes(w))) - Number(wanted.some((w) => a.toLowerCase().includes(w))));
  const top = skills.slice(0, 4);
  const extra = c.skills.length - top.length;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.035, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(10,27,61,0.04)] transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-[0_12px_32px_-16px_rgba(10,27,61,0.22)]"
    >
      <div className="flex items-start gap-3.5">
        <Avatar name={c.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-brand-navy">{c.name}</h3>
          <p className="truncate text-sm text-slate-500">{c.title || 'Open to opportunities'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {c.location || 'Location not specified'}
            </span>
            <AvailabilityPill value={c.availability} />
          </div>
        </div>
        <ReadinessBadge score={c.readinessScore} />
      </div>

      {credentials.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Credentials">
          {credentials.slice(0, 3).map(({ key, label, icon: Icon, assessed }) => (
            <li
              key={key}
              className={cx(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                assessed ? 'bg-brand-lime/20 text-brand-navy ring-brand-lime/60' : 'bg-slate-50 text-slate-600 ring-slate-200/80',
              )}
            >
              <Icon className="h-3 w-3" /> {label}
            </li>
          ))}
          {credentials.length > 3 && <li className="px-1 text-[11px] text-slate-400">+{credentials.length - 3}</li>}
        </ul>
      )}

      <div className="mt-4 min-h-[52px]">
        {top.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Top skills">
            {top.map((s) => {
              const match = wanted.some((w) => s.toLowerCase().includes(w));
              return (
                <li
                  key={s}
                  className={cx(
                    'rounded-lg px-2 py-1 text-xs',
                    match ? 'bg-brand-navy font-medium text-white' : 'bg-slate-100 text-slate-700',
                  )}
                >
                  {s}
                </li>
              );
            })}
            {extra > 0 && <li className="px-1 py-1 text-xs text-slate-400">+{extra} more</li>}
          </ul>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5" /> Skills not listed yet
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onView(c)}
          className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-xl text-[13px] font-medium text-brand-navy ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50 hover:ring-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
        >
          View full profile
        </button>
        <InviteMenu candidate={c} roles={roles} onInvite={onInvite} />
      </div>
    </motion.article>
  );
}
