'use client';

import { ReactNode, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Plus, X } from 'lucide-react';
import { SearchInput, cx } from '@/components/portal/ui';
import { AVAILABILITY_OPTIONS, LOCATION_FILTERS } from '@/lib/talent';

export interface TalentFilters {
  q: string;
  locations: string[];
  skills: string[];
  availability: string[];
  minScore: number;
}

export const EMPTY_FILTERS: TalentFilters = { q: '', locations: [], skills: [], availability: [], minScore: 0 };

export function activeFilterCount(f: TalentFilters) {
  return f.locations.length + f.skills.length + f.availability.length + (f.minScore > 0 ? 1 : 0) + (f.q.trim() ? 1 : 0);
}

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

function Group({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between">
        <legend className="text-[13px] font-semibold text-brand-navy">{title}</legend>
        {action}
      </div>
      {children}
    </fieldset>
  );
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-slate-600 transition-colors hover:text-brand-navy">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cx(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-navy/40',
          checked ? 'bg-brand-navy text-white ring-brand-navy' : 'bg-white ring-slate-300',
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}

interface FilterPanelProps {
  filters: TalentFilters;
  onChange: (next: TalentFilters) => void;
  skillFacets: { name: string; count: number }[];
}

export default function FilterPanel({ filters, onChange, skillFacets }: FilterPanelProps) {
  const [skillQuery, setSkillQuery] = useState('');
  const [showAllSkills, setShowAllSkills] = useState(false);
  const set = (patch: Partial<TalentFilters>) => onChange({ ...filters, ...patch });

  const selectedLower = filters.skills.map((s) => s.toLowerCase());
  const suggestions = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    return skillFacets.filter((f) => !selectedLower.includes(f.name.toLowerCase()) && (!q || f.name.toLowerCase().includes(q)));
  }, [skillFacets, skillQuery, selectedLower]);
  const visible = showAllSkills || skillQuery ? suggestions : suggestions.slice(0, 10);

  const addSkill = (skill: string) => {
    const clean = skill.trim();
    if (!clean || selectedLower.includes(clean.toLowerCase())) return;
    set({ skills: [...filters.skills, clean] });
    setSkillQuery('');
  };

  return (
    <div>
      <Group title="Search">
        <SearchInput value={filters.q} onChange={(q) => set({ q })} placeholder="Name, skills or bio" />
      </Group>

      <Group title="Location" action={filters.locations.length > 0 && <ClearButton onClick={() => set({ locations: [] })} />}>
        <div className="space-y-0.5">
          {LOCATION_FILTERS.map((l) => (
            <CheckRow key={l.value} label={l.label} checked={filters.locations.includes(l.value)} onChange={() => set({ locations: toggle(filters.locations, l.value) })} />
          ))}
        </div>
      </Group>

      <Group title="Skills" action={filters.skills.length > 0 && <ClearButton onClick={() => set({ skills: [] })} />}>
        <AnimatePresence initial={false}>
          {filters.skills.length > 0 && (
            <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 flex flex-wrap gap-1.5">
              {filters.skills.map((s) => (
                <motion.li key={s} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                  <button
                    type="button"
                    onClick={() => set({ skills: filters.skills.filter((x) => x !== s) })}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-brand-navy py-1 pl-2.5 pr-1.5 text-xs font-medium text-white hover:bg-[#13295A]"
                    aria-label={`Remove ${s}`}
                  >
                    {s} <X className="h-3 w-3 opacity-70" />
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addSkill(suggestions[0]?.name || skillQuery);
          }}
        >
          <input
            value={skillQuery}
            onChange={(e) => setSkillQuery(e.target.value)}
            placeholder="Add a skill"
            aria-label="Add a skill filter"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-brand-navy placeholder:text-slate-400 focus:border-brand-navy/40 focus:outline-none focus:ring-4 focus:ring-brand-navy/[0.06]"
          />
        </form>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {visible.map((f) => (
            <li key={f.name}>
              <button
                type="button"
                onClick={() => addSkill(f.name)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-200 hover:text-brand-navy"
              >
                <Plus className="h-3 w-3" /> {f.name}
                <span className="tabular-nums text-slate-400">{f.count}</span>
              </button>
            </li>
          ))}
          {skillQuery.trim() && !suggestions.some((s) => s.name.toLowerCase() === skillQuery.trim().toLowerCase()) && (
            <li>
              <button
                type="button"
                onClick={() => addSkill(skillQuery)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-navy border border-dashed border-slate-300 hover:bg-slate-50"
              >
                <Plus className="h-3 w-3" /> Search for “{skillQuery.trim()}”
              </button>
            </li>
          )}
        </ul>
        {!skillQuery && suggestions.length > 10 && (
          <button type="button" onClick={() => setShowAllSkills((v) => !v)} className="mt-2 cursor-pointer text-xs font-medium text-slate-500 hover:text-brand-navy">
            {showAllSkills ? 'Show fewer' : `Show all ${suggestions.length} skills`}
          </button>
        )}
      </Group>

      <Group title="Availability" action={filters.availability.length > 0 && <ClearButton onClick={() => set({ availability: [] })} />}>
        <div className="space-y-0.5">
          {AVAILABILITY_OPTIONS.map((a) => (
            <CheckRow key={a.value} label={a.label} checked={filters.availability.includes(a.value)} onChange={() => set({ availability: toggle(filters.availability, a.value) })} />
          ))}
        </div>
      </Group>

      <Group title="Minimum readiness score" action={filters.minScore > 0 && <ClearButton onClick={() => set({ minScore: 0 })} />}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">AI video interview</span>
          <span className="font-semibold tabular-nums text-brand-navy">{filters.minScore > 0 ? `${filters.minScore}+` : 'Any'}</span>
        </div>
        <input
          type="range"
          min={0}
          max={90}
          step={10}
          value={filters.minScore}
          onChange={(e) => set({ minScore: Number(e.target.value) })}
          aria-label="Minimum readiness score"
          className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-navy"
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
          <span>Any</span>
          <span>50</span>
          <span>90+</span>
        </div>
        {filters.minScore > 0 && <p className="mt-2 text-xs text-slate-500">Only candidates with an assessed video interview.</p>}
      </Group>
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer text-xs font-medium text-slate-400 hover:text-brand-navy">
      Clear
    </button>
  );
}
