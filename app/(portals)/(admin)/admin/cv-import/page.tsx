'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileUp, History } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { Modal } from '../_components/overlay';
import { Badge, Card, EmptyState, PageHeader, Segmented, Skeleton, Table, TBody, THead, Td, Th, Tr } from '../_components/ui';
import { IMPORT_STATUS_UI, ImportStatusBadge, Source, readJson } from './_shared';
import SingleImport from './_SingleImport';
import BulkImport from './_BulkImport';

type BatchSummary = {
  id: number;
  label: string | null;
  mode: 'SINGLE' | 'BULK';
  source: { id: number; name: string } | null;
  talentPoolVisible: boolean;
  createdAt: string;
  processed: number;
  total: number;
  counts: Record<string, number>;
  state: 'IN_PROGRESS' | 'INCOMPLETE' | 'COMPLETED';
};

const fmt = (d: string) => new Date(d).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function BatchState({ b }: { b: BatchSummary }) {
  if (b.state === 'COMPLETED') return <span className="tabular-nums text-slate-300">{b.total}</span>;
  return (
    <Badge tone={b.state === 'INCOMPLETE' ? 'warning' : 'info'}>
      <span className="tabular-nums">
        {b.processed}/{b.total}
      </span>{' '}
      {b.state === 'INCOMPLETE' ? 'interrupted' : 'running'}
    </Badge>
  );
}

function BatchDetail({ id, onClose }: { id: number | null; onClose: () => void }) {
  const [data, setData] = useState<{ batch: BatchSummary; items: { id: number; fileName: string; status: string; message: string | null; candidateId: number | null }[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setData(null);
    setError('');
    fetch(`/api/superadmin/cv-import/batches/${id}`)
      .then(readJson)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  const b = data?.batch;
  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      size="lg"
      title={b ? b.label || `Import #${b.id}` : `Import #${id}`}
      description={b ? [b.source?.name || 'No organisation', fmt(b.createdAt), b.talentPoolVisible ? 'Visible to employers' : 'Hidden from employers until sign-in'].join(' · ') : undefined}
      footer={
        b && (
          <Link
            href={`/admin/talent?batch=${b.id}`}
            className="inline-flex h-10 items-center rounded-xl bg-brand-lime px-4 text-sm font-medium text-brand-navy hover:bg-brand-lime-soft"
          >
            View candidates
          </Link>
        )
      }
    >
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {!data && !error && (
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      )}
      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.batch.counts).map(([status, n]) => (
              <Badge key={status} tone={n ? IMPORT_STATUS_UI[status]?.tone : 'neutral'}>
                {IMPORT_STATUS_UI[status]?.label}: <span className="tabular-nums">{n}</span>
              </Badge>
            ))}
            {data.batch.state !== 'COMPLETED' && (
              <Badge tone="warning">
                {data.batch.total - data.batch.processed} file{data.batch.total - data.batch.processed === 1 ? '' : 's'} not processed
              </Badge>
            )}
          </div>
          <ul className="divide-y divide-white/[0.06] rounded-xl ring-1 ring-inset ring-white/[0.06]">
            {data.items.map((i) => (
              <li key={i.id} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">{i.fileName}</p>
                  {i.message && <p className="mt-0.5 text-xs text-slate-500">{i.message}</p>}
                </div>
                <div className="shrink-0">
                  <ImportStatusBadge status={i.status} />
                </div>
              </li>
            ))}
            {data.items.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No files were processed.</li>}
          </ul>
        </div>
      )}
    </Modal>
  );
}

function CvImportView() {
  const { fetchDashboardData } = useAdmin();
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<'single' | 'bulk'>(params.get('mode') === 'bulk' ? 'bulk' : 'single');
  const [sources, setSources] = useState<Source[]>([]);
  const [batches, setBatches] = useState<BatchSummary[] | null>(null);
  const [detail, setDetail] = useState<number | null>(Number(params.get('batch')) || null);

  const load = useCallback(async () => {
    const [s, b] = await Promise.all([
      fetch('/api/superadmin/cv-import/sources').then(readJson).catch(() => ({ sources: [] })),
      fetch('/api/superadmin/cv-import/batches').then(readJson).catch(() => ({ batches: [] })),
    ]);
    setSources(s.sources);
    setBatches(b.batches);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // New profiles should appear on the Talent page without a manual refresh
  const onImported = useCallback(() => {
    load();
    fetchDashboardData();
  }, [load, fetchDashboardData]);

  const closeDetail = () => {
    setDetail(null);
    if (params.get('batch')) router.replace('/admin/cv-import');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CV import"
        description="Upload CVs and let AI build candidate profiles. Tag imports with the school or training organisation they came from to filter them on the Talent page."
      />

      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'single', label: 'Single CV' },
          { value: 'bulk', label: 'Bulk upload' },
        ]}
      />

      {/* Both stay mounted so switching tabs never interrupts a running import */}
      <div className={mode === 'single' ? '' : 'hidden'}>
        <SingleImport sources={sources} onImported={onImported} />
      </div>
      <div className={mode === 'bulk' ? '' : 'hidden'}>
        <BulkImport sources={sources} onImported={onImported} />
      </div>

      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-white">Recent imports</h2>
        </div>
        {batches === null ? (
          <Card>
            <Skeleton className="h-24" />
          </Card>
        ) : (
          <Table empty={batches.length === 0 && <EmptyState icon={FileUp} title="No imports yet" description="CVs you import will be listed here." />}>
            <THead>
              <Th>Import</Th>
              <Th>Organisation</Th>
              <Th align="center">CVs</Th>
              <Th>Outcome</Th>
            </THead>
            <TBody>
              {batches.map((b) => (
                <Tr key={b.id} onClick={() => setDetail(b.id)}>
                  <Td className="min-w-[200px]">
                    <p className="text-slate-200">{b.label || (b.mode === 'SINGLE' ? 'Single CV' : `Bulk import #${b.id}`)}</p>
                    <p className="text-xs text-slate-500">{fmt(b.createdAt)}</p>
                  </Td>
                  <Td className="min-w-[160px] text-slate-300">{b.source?.name || <span className="text-slate-600">None</span>}</Td>
                  <Td align="center">
                    <BatchState b={b} />
                  </Td>
                  <Td className="min-w-[260px]">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(b.counts)
                        .filter(([, n]) => n > 0)
                        .map(([status, n]) => (
                          <Badge key={status} tone={IMPORT_STATUS_UI[status]?.tone}>
                            <span className="tabular-nums">{n}</span> {IMPORT_STATUS_UI[status]?.label.toLowerCase()}
                          </Badge>
                        ))}
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      <BatchDetail id={detail} onClose={closeDetail} />
    </div>
  );
}

export default function CvImportPage() {
  return (
    <Suspense>
      <CvImportView />
    </Suspense>
  );
}
