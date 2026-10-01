'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Briefcase, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { useAdmin } from '../AdminContext';
import { useConfirm } from '../_components/overlay';
import { PageHeader, Button, IconButton, SearchInput, Segmented, Table, THead, Th, TBody, Tr, Td, StatusBadge, EmptyState , EMPTY } from '../_components/ui';
import SuperadminJobModal from '../dashboard/SuperadminJobModal';

type StatusFilter = 'all' | 'active' | 'pending' | 'closed';

function normaliseStatus(status?: string): StatusFilter {
  const s = String(status || 'ACTIVE').toUpperCase();
  if (s === 'ACTIVE') return 'active';
  if (s === 'PENDING' || s === 'DRAFT') return 'pending';
  return 'closed';
}

function formatSalary(min?: number | null, max?: number | null) {
  const fmt = (n: number) => `R${new Intl.NumberFormat('en-ZA', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function JobsView() {
  const { data, runOverride } = useAdmin();
  const params = useSearchParams();
  const confirm = useConfirm();
  const toast = useToast();

  const jobs: any[] = data?.jobs ?? EMPTY;
  const employers: any[] = data?.employers ?? EMPTY;

  const initial = (params.get('status') as StatusFilter) || 'all';
  const [filter, setFilter] = useState<StatusFilter>(['all', 'active', 'pending', 'closed'].includes(initial) ? initial : 'all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const counts = useMemo(() => {
    const c = { all: jobs.length, active: 0, pending: 0, closed: 0 };
    jobs.forEach((j) => c[normaliseStatus(j.status)]++);
    return c;
  }, [jobs]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => filter === 'all' || normaliseStatus(j.status) === filter)
      .filter((j) => !q || [j.title, j.company, j.location, j.employer?.name].some((v) => v?.toLowerCase().includes(q)));
  }, [jobs, filter, query]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleDelete = async (job: any) => {
    const ok = await confirm({
      title: 'Delete this job?',
      description: `“${job.title}” at ${job.company} will be permanently removed, along with its applications and matches.`,
      confirmLabel: 'Delete job',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await runOverride('DELETE_JOB', { jobId: job.id });
    if (res.success) toast.success('Job deleted');
    else toast.error(res.error || 'Could not delete job');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Every job on the platform. Create, edit, approve or remove postings for any employer."
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreate}>
            New job
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'active', label: 'Live', count: counts.active },
            { value: 'pending', label: 'Pending', count: counts.pending },
            { value: 'closed', label: 'Closed', count: counts.closed },
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search title, company or location" className="md:w-80" />
      </div>

      <Table
        empty={
          rows.length === 0 && (
            <EmptyState
              icon={Briefcase}
              title={query || filter !== 'all' ? 'No jobs match these filters' : 'No jobs yet'}
              description={query || filter !== 'all' ? 'Try clearing the search or switching tabs.' : 'Create the first job posting to get started.'}
              action={!query && filter === 'all' ? <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>New job</Button> : undefined}
            />
          )
        }
      >
        <THead>
          <Th>Role</Th>
          <Th>Requirements</Th>
          <Th>Owner</Th>
          <Th>Status</Th>
          <Th align="right">
            <span className="sr-only">Actions</span>
          </Th>
        </THead>
        <TBody>
          {rows.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max);
            const skills: string[] = job.mandatory_skills || [];
            return (
              <Tr key={job.id}>
                <Td className="min-w-[220px]">
                  <p className="font-medium text-white">{job.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-slate-300">{job.company}</span>
                    {job.location && (
                      <>
                        <span>·</span>
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </>
                    )}
                  </p>
                </Td>
                <Td className="min-w-[220px]">
                  <p className="text-xs text-slate-400">
                    {[job.years_experience && `${job.years_experience} experience`, salary].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {skills.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {skills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-slate-400 ring-1 ring-inset ring-white/[0.06]">
                          {s}
                        </span>
                      ))}
                      {skills.length > 3 && <span className="px-1 text-[11px] text-slate-500">+{skills.length - 3}</span>}
                    </div>
                  )}
                </Td>
                <Td>
                  {job.employer ? (
                    <>
                      <p className="text-slate-200">{job.employer.name}</p>
                      <p className="text-xs text-slate-500">{job.employer.email}</p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">Posted by LaunchPath</span>
                  )}
                </Td>
                <Td>
                  <StatusBadge status={job.status || 'ACTIVE'} />
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <IconButton
                      icon={Pencil}
                      label="Edit job"
                      onClick={() => {
                        setEditing(job);
                        setModalOpen(true);
                      }}
                    />
                    <IconButton icon={Trash2} label="Delete job" tone="danger" onClick={() => handleDelete(job)} />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>

      <SuperadminJobModal isOpen={modalOpen} onClose={() => setModalOpen(false)} editingJob={editing} employers={employers} onSubmit={runOverride} />
    </div>
  );
}

export default function AdminJobsPage() {
  return (
    <Suspense>
      <JobsView />
    </Suspense>
  );
}
