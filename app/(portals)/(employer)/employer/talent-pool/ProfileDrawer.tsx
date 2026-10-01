'use client';

import { ReactNode } from 'react';
import { Briefcase, Compass, GraduationCap, Heart, Lock, MapPin, UserRound } from 'lucide-react';
import { Drawer } from '@/components/portal/overlay';
import { Avatar, Badge, cx } from '@/components/portal/ui';
import type { TalentCandidate, TalentPoolResponse } from '@/lib/talent';
import { AvailabilityPill, ReadinessBadge, credentialList } from './CandidateCard';
import InviteMenu from './InviteMenu';

function Block({ icon: Icon, title, children }: { icon: typeof Briefcase; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-100 py-6 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
        <Icon className="h-4 w-4 text-slate-400" /> {title}
      </h3>
      <div className="mt-3 text-[15px] leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return <p className="whitespace-pre-line">{text}</p>;
}

interface ProfileDrawerProps {
  candidate: TalentCandidate | null;
  roles: TalentPoolResponse['openRoles'];
  onClose: () => void;
  onInvite: (c: TalentCandidate, jobId: number) => Promise<boolean>;
}

export default function ProfileDrawer({ candidate: c, roles, onClose, onInvite }: ProfileDrawerProps) {
  if (!c) return null;
  const credentials = credentialList(c);
  const education = [c.education.qualifications, c.education.specialisation, c.education.institution].filter(Boolean);

  return (
    <Drawer
      open={Boolean(c)}
      onClose={onClose}
      width="max-w-xl"
      title={
        <div className="flex items-start gap-4">
          <Avatar name={c.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-brand-navy">{c.name}</h2>
            <p className="truncate text-sm text-slate-500">{c.title || 'Open to opportunities'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {c.location || 'Location not specified'}
              </span>
              <AvailabilityPill value={c.availability} />
              {c.experienceLevel && <Badge>{c.experienceLevel}</Badge>}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
            <Lock className="h-3.5 w-3.5" /> Contact details are shared when they apply
          </p>
          <InviteMenu candidate={c} roles={roles} onInvite={onInvite} placement="up" />
        </div>
      }
    >
      {(c.readinessScore !== null || credentials.length > 0) && (
        <div className="mb-6 flex items-center gap-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70">
          <ReadinessBadge score={c.readinessScore} size="lg" />
          <ul className="flex flex-1 flex-wrap gap-1.5">
            {credentials.map(({ key, label, icon: Icon, assessed }) => (
              <li
                key={key}
                className={cx(
                  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                  assessed ? 'bg-brand-lime/20 text-brand-navy ring-brand-lime/60' : 'bg-white text-slate-600 ring-slate-200',
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {c.bio && (
        <Block icon={UserRound} title="About">
          <Prose text={c.bio} />
        </Block>
      )}

      <Block icon={Briefcase} title="Skills">
        {c.skills.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {c.skills.map((s) => (
              <li key={s} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[13px] text-slate-700">
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">Not listed yet.</p>
        )}
      </Block>

      {education.length > 0 && (
        <Block icon={GraduationCap} title="Education">
          <ul className="space-y-1">
            {education.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Block>
      )}

      {c.workExperience && (
        <Block icon={Briefcase} title="Experience">
          <Prose text={c.workExperience} />
        </Block>
      )}

      {(c.seekingRoles || c.careerDirection) && (
        <Block icon={Compass} title="Looking for">
          {c.seekingRoles && <Prose text={c.seekingRoles} />}
          {c.careerDirection && <p className="mt-2 whitespace-pre-line text-slate-500">{c.careerDirection}</p>}
        </Block>
      )}

      {c.interests && (
        <Block icon={Heart} title="Interests">
          <Prose text={c.interests} />
        </Block>
      )}
    </Drawer>
  );
}
