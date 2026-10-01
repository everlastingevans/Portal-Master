'use client';

import { useMemo, useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { useAdmin } from '../AdminContext';
import { useConfirm } from '../_components/overlay';
import { PageHeader, Button, IconButton, SearchInput, Card, Identity, StatusBadge, EmptyState , EMPTY } from '../_components/ui';
import SuperadminEmployerModal from '../dashboard/SuperadminEmployerModal';

export default function AdminEmployersPage() {
  const { data, runOverride } = useAdmin();
  const confirm = useConfirm();
  const toast = useToast();
  const employers: any[] = data?.employers ?? EMPTY;

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employers.filter((e) => !q || [e.name, e.email].some((v) => v?.toLowerCase().includes(q)));
  }, [employers, query]);

  const handleDelete = async (emp: any) => {
    const jobCount = emp.jobs_posted?.length || 0;
    const ok = await confirm({
      title: `Delete ${emp.name || 'this employer'}?`,
      description:
        jobCount > 0
          ? `This also deletes their ${jobCount} job post${jobCount === 1 ? '' : 's'} and every application to them. This cannot be undone.`
          : 'Their account will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Delete employer',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await runOverride('DELETE_EMPLOYER', { employerId: emp.id });
    if (res.success) toast.success('Employer deleted');
    else toast.error(res.error || 'Could not delete employer');
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employers"
        description={`${employers.length} employer account${employers.length === 1 ? '' : 's'} and the jobs they’ve posted.`}
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreate}>
            Add employer
          </Button>
        }
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Search company or email" className="sm:max-w-sm" />

      {rows.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Building2}
            title={query ? 'No employers match your search' : 'No employers yet'}
            description={query ? 'Try a different name or email.' : 'Add an employer to let them post jobs.'}
            action={!query ? <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>Add employer</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {rows.map((emp) => {
            const jobs: any[] = emp.jobs_posted || [];
            return (
              <Card key={emp.id} padded={false} className="flex flex-col transition-colors hover:border-white/[0.1]">
                <div className="flex items-start justify-between gap-3 p-5">
                  <Identity name={emp.name} sub={emp.email} />
                  <div className="flex shrink-0 gap-1">
                    <IconButton
                      icon={Pencil}
                      label="Edit employer"
                      onClick={() => {
                        setEditing(emp);
                        setModalOpen(true);
                      }}
                    />
                    <IconButton icon={Trash2} label="Delete employer" tone="danger" onClick={() => handleDelete(emp)} />
                  </div>
                </div>

                <div className="flex-1 border-t border-white/[0.06] px-5 py-4">
                  <p className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <Briefcase className="h-3.5 w-3.5" />
                    {jobs.length === 0 ? 'No jobs posted' : `${jobs.length} job${jobs.length === 1 ? '' : 's'} posted`}
                  </p>
                  {jobs.length > 0 && (
                    <ul className="space-y-2">
                      {jobs.slice(0, 4).map((job) => (
                        <li key={job.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-slate-200">
                            {job.title}
                            {job.location && <span className="text-slate-500"> · {job.location}</span>}
                          </span>
                          <StatusBadge status={job.status || 'ACTIVE'} />
                        </li>
                      ))}
                      {jobs.length > 4 && <li className="text-xs text-slate-500">+{jobs.length - 4} more</li>}
                    </ul>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SuperadminEmployerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} editingEmp={editing} onSubmit={runOverride} />
    </div>
  );
}
