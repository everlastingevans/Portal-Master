'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  MapPin,
  Banknote,
  GraduationCap,
  Building2,
  Check,
  CheckCircle2,
  Plus,
  Sparkles,
  Search,
  SearchX,
  FileText,
  X,
  ArrowUpRight,
  MousePointerClick,
} from 'lucide-react';
import { Drawer } from '@/components/portal/overlay';
import { Badge, Button, Card, EmptyState, IconButton, MatchScore, PageHeader, SearchInput, Select, cx } from '@/components/portal/ui';
import { CompanyLogo } from './DashboardHelpers';

export interface JobFeedTabProps {
  user: any;
  allJobs: any[];
  matches: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedJob: any;
  setSelectedJob: (job: any) => void;
  savedJobsMap: Record<number, boolean>;
  handleSaveJob: (e: React.MouseEvent, jobId: number) => void;
  handleApply: (jobId: number) => void | Promise<void>;
  applications: any[];
}

type SortKey = 'match' | 'newest' | 'salary';

/* --------------------------------- Helpers -------------------------------- */

const sanitizeHtml = (html: string) => {
  // Basic sanitiser: strip script tags before rendering employer-supplied HTML.
  if (!html) return '';
  return html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
};

const looksLikeHtml = (text: string) => /<\/?[a-z][\s\S]*?>/i.test(text || '');

const formatRand = (n: number) => `R${Number(n).toLocaleString('en-ZA')}`;

const formatSalary = (min?: number | null, max?: number | null) => {
  if (!min && !max) return null;
  if (!min) return `Up to ${formatRand(max!)}`;
  if (!max) return `From ${formatRand(min)}`;
  return `${formatRand(min)} – ${formatRand(max)}`;
};

const formatExperience = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isNaN(n)) return n === 0 ? 'No experience needed' : `${n}+ year${n === 1 ? '' : 's'} experience`;
  const s = String(value);
  return /year/i.test(s) ? s : `${s} years experience`;
};

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []);

const uniq = (list: string[]) => {
  const seen = new Set<string>();
  return list.filter((s) => {
    const k = s.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const hasMatch = (job: any) => Number(job?.match_score) > 0;

/** Skills the employer listed, falling back to the AI-extracted ones. */
const jobSkills = (job: any) => {
  const listed = uniq([...asList(job?.mandatory_skills_db), ...asList(job?.tech_stack_db)]);
  if (listed.length) return listed;
  return hasMatch(job) ? uniq([...asList(job?.matched_skills), ...asList(job?.missing_skills)]) : [];
};

const matchedSet = (job: any) => new Set(asList(job?.matched_skills).map((s) => s.toLowerCase()));

const matchLabel = (score: number) => (score >= 85 ? 'Strong match' : score >= 70 ? 'Good match' : score >= 50 ? 'Partial match' : 'Low match');

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

function SkillChip({ label, matched }: { label: string; matched?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        matched ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' : 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      {matched && <Check className="h-3 w-3 shrink-0" aria-label="You have this skill" />}
      <span className="truncate">{label}</span>
    </span>
  );
}

/* --------------------------------- Component ------------------------------ */

export default function JobFeedTab({
  user,
  allJobs = [],
  matches = [],
  activeTab,
  setActiveTab,
  selectedJob,
  setSelectedJob,
  savedJobsMap,
  handleSaveJob,
  handleApply,
  applications = [],
}: JobFeedTabProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('all');
  const [sort, setSort] = useState<SortKey>(activeTab === 'Jobs' && matches.length > 0 ? 'match' : 'newest');
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const isWide = useMediaQuery('(min-width: 1280px)');

  const noMatchesYet = matches.length === 0;
  const savedCount = Object.keys(savedJobsMap).filter((k) => savedJobsMap[Number(k)]).length;

  const appliedIds = useMemo(() => new Set((applications || []).map((a: any) => a.job?.id).filter(Boolean)), [applications]);

  // Source list per mode. Saved uses the full job list (enriched with match data where it exists)
  // so bookmarks still show for candidates who have not uploaded a CV yet.
  const baseJobs = useMemo(() => {
    if (activeTab === 'Saved') {
      const pool = allJobs.length ? allJobs : matches;
      return pool.filter((j: any) => savedJobsMap[j.job_id]);
    }
    if (activeTab === 'AllJobs' || noMatchesYet) return allJobs;
    return matches;
  }, [activeTab, allJobs, matches, savedJobsMap, noMatchesYet]);

  const locations = useMemo(
    () => uniq(baseJobs.map((j: any) => String(j.location || '').trim()).filter(Boolean)).sort((a, b) => a.localeCompare(b)),
    [baseJobs],
  );

  const displayedJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = baseJobs.filter((j: any) => {
      if (location !== 'all' && String(j.location || '').trim().toLowerCase() !== location.toLowerCase()) return false;
      if (!q) return true;
      return [j.title, j.company, j.location].some((f) => String(f || '').toLowerCase().includes(q));
    });
    const sorted = [...filtered];
    if (sort === 'match') sorted.sort((a, b) => (Number(b.match_score) || 0) - (Number(a.match_score) || 0));
    if (sort === 'newest') sorted.sort((a, b) => (Number(b.job_id) || 0) - (Number(a.job_id) || 0));
    if (sort === 'salary') sorted.sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    return sorted;
  }, [baseJobs, query, location, sort]);

  const filtersActive = query.trim() !== '' || location !== 'all';
  const clearFilters = () => {
    setQuery('');
    setLocation('all');
  };

  /** Switch tab and close any open job so it does not reopen when the candidate comes back. */
  const goTo = (tab: string) => {
    setSelectedJob(null);
    setActiveTab(tab);
  };

  const onApply = async (jobId: number) => {
    setApplyingId(jobId);
    try {
      await handleApply(jobId);
    } finally {
      setApplyingId(null);
    }
  };

  /* ------------------------------ Header copy ------------------------------ */

  const firstName = String(user?.name || '').split(' ')[0];
  const header =
    activeTab === 'Saved'
      ? { title: 'Saved jobs', description: 'Roles you have bookmarked. Apply when you are ready.' }
      : activeTab === 'AllJobs'
        ? { title: 'Browse jobs', description: `Every open role on LaunchPath. ${allJobs.length} ${allJobs.length === 1 ? 'role' : 'roles'} available right now.` }
        : {
            title: firstName ? `Jobs for you, ${firstName}` : 'Jobs for you',
            description: noMatchesYet
              ? 'Add your CV and we will rank every role by how well it fits you.'
              : 'Ranked by how well each role fits you. Your match score compares the skills in your CV with what the employer is looking for, so you can focus on the best fits.',
          };

  /* -------------------------------- Pieces --------------------------------- */

  const renderCard = (job: any) => {
    const isSaved = !!savedJobsMap[job.job_id];
    const applied = appliedIds.has(job.job_id);
    const selected = selectedJob?.job_id === job.job_id;
    const salary = formatSalary(job.salary_min, job.salary_max);
    const skills = jobSkills(job);
    const matched = matchedSet(job);
    const shown = skills.slice(0, 3);
    const extra = skills.length - shown.length;

    return (
      <article
        key={job.id || job.job_id}
        className={cx(
          'group relative rounded-2xl border bg-white p-5 transition-all',
          selected
            ? 'border-brand-navy/60 shadow-[0_0_0_3px_rgba(10,27,61,0.06)]'
            : 'border-slate-200/80 shadow-[0_1px_2px_rgba(10,27,61,0.04)] hover:border-slate-300 hover:shadow-[0_4px_16px_-6px_rgba(10,27,61,0.12)]',
        )}
      >
        <div className="flex items-start gap-3.5">
          <CompanyLogo companyName={job.company} logo={job.tenantLogo} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-snug text-brand-navy">
              <button
                type="button"
                onClick={() => setSelectedJob(job)}
                aria-current={selected ? 'true' : undefined}
                className="cursor-pointer text-left after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-navy/30"
              >
                <span className="line-clamp-2">{job.title}</span>
              </button>
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {job.company}
              {job.location && <span className="text-slate-400"> · {job.location}</span>}
            </p>
          </div>
          <IconButton
            icon={isSaved ? BookmarkCheck : Bookmark}
            label={isSaved ? 'Remove from saved' : 'Save job'}
            aria-pressed={isSaved}
            onClick={(e) => handleSaveJob(e, job.job_id)}
            className={cx('relative z-10 -mr-1.5 -mt-1', isSaved && 'text-brand-navy')}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasMatch(job) && <MatchScore score={job.match_score} />}
          {applied && (
            <Badge tone="success">
              <CheckCircle2 className="h-3 w-3" /> Applied
            </Badge>
          )}
          {salary && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
              <Banknote className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {salary}
            </span>
          )}
        </div>

        {shown.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shown.map((s) => (
              <SkillChip key={s} label={s} matched={matched.has(s.toLowerCase())} />
            ))}
            {extra > 0 && <span className="inline-flex items-center px-1 text-xs font-medium text-slate-500">+{extra} more</span>}
          </div>
        )}
      </article>
    );
  };

  const renderActions = (job: any) => {
    const isSaved = !!savedJobsMap[job.job_id];
    const applied = appliedIds.has(job.job_id);
    return (
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Button variant="secondary" icon={isSaved ? BookmarkCheck : Bookmark} aria-pressed={isSaved} onClick={(e) => handleSaveJob(e, job.job_id)}>
          {isSaved ? 'Saved' : 'Save'}
        </Button>
        {applied ? (
          <Button variant="secondary" icon={CheckCircle2} disabled className="flex-1 sm:flex-none">
            Applied
          </Button>
        ) : (
          <Button variant="accent" onClick={() => onApply(job.job_id)} loading={applyingId === job.job_id} className="flex-1 sm:flex-none">
            Apply now
            {applyingId !== job.job_id && <ArrowUpRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  };

  const renderDetailHeader = (job: any) => {
    const salary = formatSalary(job.salary_min, job.salary_max);
    const experience = formatExperience(job.years_experience);
    return (
      <div className="flex items-start gap-4">
        <CompanyLogo companyName={job.company} logo={job.tenantLogo} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-brand-navy sm:text-xl">{job.title}</h2>
          <p className="mt-0.5 text-sm font-medium text-slate-600">{job.company}</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-slate-500">
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {job.location || 'Location not listed'}
            </li>
            {salary && (
              <li className="inline-flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {salary}
              </li>
            )}
            {experience && (
              <li className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {experience}
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderDetailBody = (job: any) => {
    const scored = hasMatch(job);
    const score = Math.round(Number(job.match_score) || 0);
    const matchedSkills = asList(job.matched_skills);
    const missingSkills = asList(job.missing_skills);
    const mandatory = uniq(asList(job.mandatory_skills_db));
    const tech = uniq(asList(job.tech_stack_db));
    const matched = matchedSet(job);
    const experience = formatExperience(job.years_experience);
    const description = String(job.job_description || job.description || '');

    return (
      <div className="space-y-8">
        {/* Match breakdown */}
        {scored ? (
          <section aria-labelledby={`match-${job.job_id}`} className="rounded-2xl bg-slate-50/80 p-5 ring-1 ring-inset ring-slate-200/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id={`match-${job.job_id}`} className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <Sparkles className="h-4 w-4 text-slate-500" aria-hidden="true" />
                How you match
              </h3>
              <span className="text-sm font-medium text-brand-navy">
                <span className="tabular-nums">{score}%</span>
                <span className="text-slate-500"> · {matchLabel(score)}</span>
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-navy transition-[width] duration-700 ease-out" style={{ width: `${score}%` }} />
            </div>
            {job.fit_summary && <p className="mt-4 text-sm leading-relaxed text-slate-600">{job.fit_summary}</p>}

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Skills you have ({matchedSkills.length})</p>
                {matchedSkills.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((s) => (
                      <SkillChip key={s} label={s} matched />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">None found in your CV yet.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Skills to build ({missingSkills.length})</p>
                {missingSkills.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Nothing missing. You tick every box.</p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl bg-slate-50/80 p-5 ring-1 ring-inset ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-brand-navy">See how you match</p>
                <p className="mt-0.5 text-sm text-slate-500">Add your CV and we will show which skills you already have for this role.</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" icon={FileText} onClick={() => goTo('Profile')}>
              Add your CV
            </Button>
          </div>
        )}

        {/* Requirements */}
        {(mandatory.length > 0 || tech.length > 0 || experience) && (
          <section>
            <h3 className="text-sm font-semibold text-brand-navy">What they are looking for</h3>
            <dl className="mt-3 space-y-4">
              {experience && (
                <div>
                  <dt className="text-xs font-medium text-slate-500">Experience</dt>
                  <dd className="mt-1 text-sm text-slate-600">{experience}</dd>
                </div>
              )}
              {mandatory.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-slate-500">Must-have skills</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {mandatory.map((s) => (
                      <SkillChip key={s} label={s} matched={matched.has(s.toLowerCase())} />
                    ))}
                  </dd>
                </div>
              )}
              {tech.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-slate-500">Tools and technologies</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {tech.map((s) => (
                      <SkillChip key={s} label={s} matched={matched.has(s.toLowerCase())} />
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Description */}
        <section>
          <h3 className="text-sm font-semibold text-brand-navy">About the role</h3>
          {description ? (
            looksLikeHtml(description) ? (
              <div
                className="prose prose-sm prose-slate mt-3 max-w-none text-slate-600 prose-headings:text-brand-navy prose-a:text-brand-navy prose-strong:text-brand-navy"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
              />
            ) : (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{description}</p>
            )
          ) : (
            <p className="mt-3 text-sm text-slate-500">The employer has not added a description yet.</p>
          )}
        </section>

        <section className="flex items-start gap-3 border-t border-slate-100 pt-6">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="text-sm text-slate-500">
            Posted by <span className="font-medium text-slate-600">{job.company}</span>
            {job.location ? ` in ${job.location}` : ''}.
          </p>
        </section>
      </div>
    );
  };

  /* ------------------------------ Empty states ----------------------------- */

  const renderEmpty = () => {
    if (filtersActive) {
      return (
        <EmptyState
          icon={SearchX}
          title="No jobs match your search"
          description="Try a different keyword or location."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      );
    }
    if (activeTab === 'Saved') {
      return (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="Tap the bookmark on any job to keep it here for later."
          action={
            <Button variant="primary" icon={Search} onClick={() => goTo('AllJobs')}>
              Browse jobs
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={Search}
        title="No open roles right now"
        description="New roles are added every week. Make sure your profile is up to date so you are ready to apply."
        action={
          <Button variant="secondary" onClick={() => goTo('Profile')}>
            Update your profile
          </Button>
        }
      />
    );
  };

  /* --------------------------------- Render -------------------------------- */

  const showDrawer = !isWide && !!selectedJob;

  return (
    <div className="space-y-6">
      <PageHeader
        title={header.title}
        description={header.description}
        actions={
          activeTab === 'Saved' ? (
            <Badge tone="neutral">
              <span className="tabular-nums">{savedCount}</span> saved
            </Badge>
          ) : undefined
        }
      />

      {activeTab === 'Jobs' && noMatchesYet && allJobs.length > 0 && (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-lime">
              <FileText className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-navy">Add your CV to see your matches</p>
              <p className="mt-0.5 text-sm text-slate-500">We will score every role against your skills. Until then, here are all open roles.</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => goTo('Profile')} className="self-start sm:self-center">
            Upload your CV
          </Button>
        </Card>
      )}

      {baseJobs.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by title, company or location" className="flex-1" />
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Select aria-label="Filter by location" value={location} onChange={(e) => setLocation(e.target.value)} className="h-10 sm:w-48">
              <option value="all">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
            <Select aria-label="Sort jobs" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-10 sm:w-44">
              {!noMatchesYet && <option value="match">Best match</option>}
              <option value="newest">Newest</option>
              <option value="salary">Highest salary</option>
            </Select>
          </div>
        </div>
      )}

      {baseJobs.length > 0 && (
        <p className="text-xs text-slate-500" aria-live="polite">
          Showing <span className="font-medium tabular-nums text-slate-600">{displayedJobs.length}</span> of{' '}
          <span className="tabular-nums">{baseJobs.length}</span> {baseJobs.length === 1 ? 'role' : 'roles'}
          {filtersActive && (
            <>
              {' · '}
              <button type="button" onClick={clearFilters} className="cursor-pointer font-medium text-brand-navy underline-offset-2 hover:underline">
                Clear filters
              </button>
            </>
          )}
        </p>
      )}

      {displayedJobs.length === 0 ? (
        <Card padded={false}>{renderEmpty()}</Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">{displayedJobs.map(renderCard)}</div>

          {/* Split-view detail (wide screens) */}
          <div className="hidden xl:sticky xl:top-6 xl:block">
            {selectedJob ? (
              <Card padded={false} className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden">
                <div className="flex items-start gap-3 border-b border-slate-100 p-6">
                  <div className="min-w-0 flex-1">{renderDetailHeader(selectedJob)}</div>
                  <IconButton icon={X} label="Close job details" onClick={() => setSelectedJob(null)} className="-mr-2 -mt-1" />
                </div>
                <div key={selectedJob.job_id} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 animate-fade-in">
                  {renderDetailBody(selectedJob)}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
                  <p className="hidden text-xs text-slate-500 2xl:block">Your profile and CV are shared with the employer when you apply.</p>
                  <div className="ml-auto">{renderActions(selectedJob)}</div>
                </div>
              </Card>
            ) : (
              <Card padded={false} className="border-dashed">
                <EmptyState
                  icon={MousePointerClick}
                  title="Select a job to see the details"
                  description="You will see the full description, what the employer is looking for and how your skills compare."
                />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Drawer detail (smaller screens) */}
      <Drawer
        open={showDrawer}
        onClose={() => setSelectedJob(null)}
        title={selectedJob ? renderDetailHeader(selectedJob) : ''}
        footer={selectedJob ? renderActions(selectedJob) : undefined}
      >
        {selectedJob && renderDetailBody(selectedJob)}
      </Drawer>
    </div>
  );
}
