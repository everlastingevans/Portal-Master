'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Inbox, MapPin, RefreshCw, Repeat, Settings2 } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { Badge, Button, EmptyState, PageHeader, PageSkeleton, SearchInput, Segmented, Select, Table, TBody, Td, Th, THead, Tr } from '../_components/ui';
import { CLOSED_STATUSES, INVOICE_STATUSES, PLACED_STATUSES, ROLE_CATEGORIES, VACANCY_STATUSES, labelFor } from '@/lib/hire/vacancy';
import { HireTerms, formatRand } from '@/lib/hire/terms';
import { TermsModal, daysSince, fmtDate, vacancyTone } from './_shared';

type Owner = { id: number; name: string | null; email: string };
type Stage = 'open' | 'placed' | 'closed' | 'all';

function stage(status: string): Exclude<Stage, 'all'> {
  if ((CLOSED_STATUSES as string[]).includes(status)) return 'closed';
  if ((PLACED_STATUSES as string[]).includes(status)) return 'placed';
  return 'open';
}

function VacanciesView() {
  const params = useSearchParams();
  const router = useRouter();
  const { error: toastError } = useToast();
  const [vacancies, setVacancies] = useState<any[] | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [terms, setTerms] = useState<HireTerms | null>(null);
  const [loading, setLoading] = useState(false);
  const [stageFilter, setStageFilter] = useState<Stage>('open');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [owner, setOwner] = useState('');
  const [query, setQuery] = useState('');
  const [termsOpen, setTermsOpen] = useState(false);

  // Old deep links (/admin/vacancies?id=12) go to the detail page
  useEffect(() => {
    const id = Number(params.get('id'));
    if (id) router.replace(`/admin/vacancies/${id}`);
  }, [params, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/vacancies');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load vacancies');
      setVacancies(data.vacancies);
      setOwners(data.owners);
      setTerms(data.terms);
    } catch (err: any) {
      toastError(err.message);
      setVacancies((v) => v ?? []);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => vacancies ?? [], [vacancies]);
  const counts = useMemo(() => {
    const c = { open: 0, placed: 0, closed: 0, all: list.length };
    list.forEach((v) => c[stage(v.status)]++);
    return c;
  }, [list]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    return list
      .filter((v) => stageFilter === 'all' || stage(v.status) === stageFilter)
      .filter((v) => !status || v.status === status)
      .filter((v) => !category || v.role_category === category)
      .filter((v) => !owner || (owner === 'none' ? !v.owner_id : String(v.owner_id) === owner))
      .filter((v) => !q || [v.role_title, v.company_name, v.contact_name, v.contact_email, v.location, String(v.id)].some((s) => s?.toLowerCase().includes(q)));
  }, [list, stageFilter, status, category, owner, query]);

  const ownerName = (id?: number | null) => {
    const o = owners.find((x) => x.id === id);
    return o ? o.name || o.email : null;
  };
  const filtered = Boolean(query || status || category || owner || stageFilter !== 'open');

  if (!vacancies) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vacancies"
        description="Roles submitted through Find Candidates. Open a vacancy to build and send shortlists, track interviews and offers, and record placements."
        actions={
          <>
            <Link href="/admin/vacancies/report" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/[0.04] px-4 text-sm font-medium text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08]">
              <BarChart3 className="h-4 w-4" /> Hiring report
            </Link>
            <Button icon={RefreshCw} onClick={load} loading={loading}>
              Refresh
            </Button>
            <Button icon={Settings2} onClick={() => setTermsOpen(true)} disabled={!terms}>
              Hire terms
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Segmented
            value={stageFilter}
            onChange={setStageFilter}
            options={[
              { value: 'open', label: 'In progress', count: counts.open },
              { value: 'placed', label: 'Placed', count: counts.placed },
              { value: 'closed', label: 'Closed', count: counts.closed },
              { value: 'all', label: 'All', count: counts.all },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="Search role, company, contact or #ref" className="md:w-80" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {VACANCY_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {ROLE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value === 'OTHER' ? 'Other' : c.label}
              </option>
            ))}
          </Select>
          <Select aria-label="Filter by owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">All owners</option>
            <option value="none">Unassigned</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name || o.email}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Table
        empty={
          rows.length === 0 && (
            <EmptyState
              icon={Inbox}
              title={filtered ? 'No vacancies match these filters' : 'No open vacancies'}
              description={list.length === 0 ? 'Vacancies submitted on the website will appear here.' : 'Try clearing the filters or switching tabs.'}
            />
          )
        }
      >
        <THead>
          <Th>Received</Th>
          <Th>Role</Th>
          <Th>Owner</Th>
          <Th>Status</Th>
          <Th align="right">Placement</Th>
        </THead>
        <TBody>
          {rows.map((v) => {
            const fee = v.placements.reduce((a: number, p: any) => a + p.placement_fee, 0);
            return (
              <Tr key={v.id} onClick={() => router.push(`/admin/vacancies/${v.id}`)}>
                <Td className="whitespace-nowrap">
                  <p className="text-slate-200">{fmtDate(v.created_at)}</p>
                  <p className="text-xs tabular-nums text-slate-500">
                    #{v.id} · {daysSince(v.created_at)}d
                  </p>
                </Td>
                <Td className="min-w-[260px]">
                  <Link href={`/admin/vacancies/${v.id}`} className="font-medium text-white hover:underline" onClick={(e) => e.stopPropagation()}>
                    {v.role_title}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-slate-300">{v.company_name}</span>
                    {v.employer_vacancy_count > 1 && (
                      <span className="inline-flex items-center gap-1 text-sky-300" title="This contact has submitted other vacancies">
                        <Repeat className="h-3 w-3" /> {v.employer_vacancy_count} roles
                      </span>
                    )}
                    <span>·</span>
                    <MapPin className="h-3 w-3" />
                    {v.location}
                    <span>·</span>
                    {v.role_category === 'OTHER' ? v.role_category_other : labelFor(ROLE_CATEGORIES, v.role_category)}
                  </p>
                </Td>
                <Td>{ownerName(v.owner_id) ? <span className="text-slate-200">{ownerName(v.owner_id)}</span> : <Badge tone="warning">Unassigned</Badge>}</Td>
                <Td>
                  <Badge tone={vacancyTone(v.status)} dot>
                    {labelFor(VACANCY_STATUSES, v.status)}
                  </Badge>
                  <p className="mt-1 text-xs text-slate-500">
                    {v._count.shortlists} shortlist{v._count.shortlists === 1 ? '' : 's'} · {v._count.interview_requests} interview request{v._count.interview_requests === 1 ? '' : 's'}
                  </p>
                </Td>
                <Td align="right" className="whitespace-nowrap tabular-nums">
                  {v.placements.length ? (
                    <>
                      <p className="text-slate-200">{formatRand(fee)}</p>
                      <p className="text-xs text-slate-500">{v.placements.map((p: any) => labelFor(INVOICE_STATUSES, p.invoice_status)).join(', ')}</p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>

      {terms && termsOpen && <TermsModal terms={terms} onClose={() => setTermsOpen(false)} onSaved={setTerms} />}
    </div>
  );
}

export default function AdminVacanciesPage() {
  return (
    <Suspense>
      <VacanciesView />
    </Suspense>
  );
}
