'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, SlidersHorizontal, Users, X } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import PortalLoader from '@/components/PortalLoader';
import { Drawer } from '@/components/portal/overlay';
import { Button, Card, EmptyState, PageHeader, Skeleton, cx } from '@/components/portal/ui';
import { useToast } from '@/components/ToastNotification';
import { availabilityLabel, LOCATION_FILTERS, TalentCandidate, TalentPoolResponse } from '@/lib/talent';
import CandidateCard from './CandidateCard';
import FilterPanel, { activeFilterCount, EMPTY_FILTERS, TalentFilters } from './FilterPanel';
import ProfileDrawer from './ProfileDrawer';

function toQuery(f: TalentFilters, page = 1) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  f.locations.forEach((v) => p.append('location', v));
  f.skills.forEach((v) => p.append('skill', v));
  f.availability.forEach((v) => p.append('availability', v));
  if (f.minScore > 0) p.set('minScore', String(f.minScore));
  if (page > 1) p.set('page', String(page));
  return p;
}

function fromQuery(search: string): TalentFilters {
  const p = new URLSearchParams(search);
  return {
    q: p.get('q') || '',
    locations: p.getAll('location'),
    skills: p.getAll('skill'),
    availability: p.getAll('availability'),
    minScore: Number(p.get('minScore')) || 0,
  };
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-start gap-3.5">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="mt-5 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="mt-6 h-9 w-full rounded-xl" />
    </div>
  );
}

export default function TalentPoolPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  const [filters, setFilters] = useState<TalentFilters>(EMPTY_FILTERS);
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<TalentPoolResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<TalentCandidate | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Session guard
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const { user } = await res.json();
        const role = String(user?.role || '').toUpperCase();
        if (!user) return router.replace('/login?next=/employer/talent-pool');
        if (!['EMPLOYER', 'CLIENT'].includes(role) && String(user.realRole).toUpperCase() !== 'SUPERADMIN') return router.replace('/');
        setUser(user);
      } catch {
        router.replace('/login?next=/employer/talent-pool');
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  // Restore filters from the URL once
  useEffect(() => {
    setFilters(fromQuery(window.location.search));
    setHydrated(true);
  }, []);

  const load = useCallback(async (f: TalentFilters, page: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    page === 1 ? setLoading(true) : setLoadingMore(true);
    setError('');
    try {
      const res = await fetch(`/api/employer/candidates?${toQuery(f, page)}`, { signal: controller.signal });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load the talent pool.');
      setData((prev) => (page > 1 && prev ? { ...json, candidates: [...prev.candidates, ...json.candidates] } : json));
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // Re-query when filters change (search text is debounced); keep the URL shareable
  useEffect(() => {
    if (!hydrated || !user) return;
    const qs = toQuery(filters).toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    const t = setTimeout(() => load(filters, 1), filters.q ? 300 : 0);
    return () => clearTimeout(t);
  }, [filters, hydrated, user, load]);

  const handleInvite = useCallback(
    async (candidate: TalentCandidate, jobId: number) => {
      try {
        const res = await fetch('/api/employer/candidates/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: candidate.id, jobId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Could not send the invitation.');
        const markInvited = (c: TalentCandidate) => (c.id === candidate.id ? { ...c, invitedJobIds: [...c.invitedJobIds, jobId] } : c);
        setData((prev) => (prev ? { ...prev, candidates: prev.candidates.map(markInvited) } : prev));
        setViewing((v) => (v ? markInvited(v) : v));
        const role = data?.openRoles.find((r) => r.id === jobId);
        toast.success(`Invitation sent to ${candidate.name.split(' ')[0]}${role ? ` for ${role.title}` : ''}`);
        return true;
      } catch (err: any) {
        toast.error(err.message);
        return false;
      }
    },
    [data?.openRoles, toast],
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
  };

  if (checking || !user) return <PortalLoader portal="EMPLOYER" title="Loading the talent pool" />;

  const count = activeFilterCount(filters);
  const candidates = data?.candidates || [];
  const roles = data?.openRoles || [];

  const chips = [
    ...filters.locations.map((v) => ({ key: `l-${v}`, label: LOCATION_FILTERS.find((l) => l.value === v)?.label || v, remove: () => setFilters({ ...filters, locations: filters.locations.filter((x) => x !== v) }) })),
    ...filters.skills.map((v) => ({ key: `s-${v}`, label: v, remove: () => setFilters({ ...filters, skills: filters.skills.filter((x) => x !== v) }) })),
    ...filters.availability.map((v) => ({ key: `a-${v}`, label: availabilityLabel(v) || v, remove: () => setFilters({ ...filters, availability: filters.availability.filter((x) => x !== v) }) })),
    ...(filters.minScore > 0 ? [{ key: 'score', label: `Readiness ${filters.minScore}+`, remove: () => setFilters({ ...filters, minScore: 0 }) }] : []),
  ];

  const filterPanel = <FilterPanel filters={filters} onChange={setFilters} skillFacets={data?.facets.skills || []} />;

  return (
    <PortalShell portal="employer" user={user} onLogout={handleLogout} title="Talent pool">
      <div className="space-y-6">
        <PageHeader
          title="Talent pool"
          description="Search early-career candidates across LaunchPath and invite the right people to apply to your live roles."
          actions={
            <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)} className="lg:hidden">
              Filters{count > 0 ? ` (${count})` : ''}
            </Button>
          }
        />

        {roles.length === 0 && data && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2.5 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              You can browse the pool now. To invite candidates, you’ll need at least one live role.
            </p>
            <Button size="sm" variant="primary" onClick={() => router.push('/employer/new')}>
              Post a job
            </Button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[264px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-0 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-navy">Filters</p>
                {count > 0 && (
                  <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="cursor-pointer text-xs font-medium text-slate-500 hover:text-brand-navy">
                    Reset all
                  </button>
                )}
              </div>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex min-h-[32px] flex-wrap items-center gap-2">
              <p className="mr-2 text-sm text-slate-500" aria-live="polite">
                {loading && !data ? (
                  'Searching…'
                ) : (
                  <>
                    <span className="font-semibold tabular-nums text-brand-navy">{data?.total ?? 0}</span> candidate{data?.total === 1 ? '' : 's'}
                  </>
                )}
              </p>
              <AnimatePresence initial={false}>
                {chips.map((chip) => (
                  <motion.button
                    key={chip.key}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    type="button"
                    onClick={chip.remove}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white py-1 pl-3 pr-2 text-xs font-medium text-brand-navy ring-1 ring-inset ring-slate-200 hover:ring-slate-300"
                  >
                    {chip.label} <X className="h-3 w-3 text-slate-400" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Slim progress bar while refining results */}
            <div className="relative mb-4 h-0.5 overflow-hidden rounded-full">
              {loading && data && <div className="absolute inset-y-0 w-1/3 rounded-full bg-brand-navy/60 animate-loader-bar" />}
            </div>

            {error ? (
              <Card>
                <EmptyState icon={AlertTriangle} title="We couldn’t load candidates" description={error} action={<Button onClick={() => load(filters, 1)}>Try again</Button>} />
              </Card>
            ) : loading && !data ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <Card padded={false}>
                <EmptyState
                  icon={Users}
                  title={count > 0 ? 'No candidates match these filters' : 'No candidates yet'}
                  description={count > 0 ? 'Try removing a skill or widening the location.' : 'Candidates appear here as they build their profiles.'}
                  action={count > 0 ? <Button onClick={() => setFilters(EMPTY_FILTERS)}>Reset filters</Button> : undefined}
                />
              </Card>
            ) : (
              <>
                <motion.div layout className={cx('grid gap-4 md:grid-cols-2 2xl:grid-cols-3 transition-opacity', loading && 'opacity-60')}>
                  <AnimatePresence mode="popLayout">
                    {candidates.map((c, i) => (
                      <CandidateCard key={c.id} candidate={c} index={i} roles={roles} highlightSkills={filters.skills} onView={setViewing} onInvite={handleInvite} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {data && candidates.length < data.total && (
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <Button variant="secondary" loading={loadingMore} onClick={() => load(filters, data.page + 1)}>
                      Load more candidates
                    </Button>
                    <p className="text-xs text-slate-400">
                      Showing {candidates.length} of {data.total}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ProfileDrawer candidate={viewing} roles={roles} onClose={() => setViewing(null)} onInvite={handleInvite} />

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        width="max-w-sm"
        footer={
          <div className="flex w-full gap-2">
            <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)} disabled={count === 0}>
              Reset
            </Button>
            <Button variant="primary" fullWidth onClick={() => setFiltersOpen(false)}>
              Show {data?.total ?? 0} candidates
            </Button>
          </div>
        }
      >
        {filterPanel}
      </Drawer>
    </PortalShell>
  );
}
