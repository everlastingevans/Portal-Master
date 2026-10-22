'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { FileText, Loader2, Play, RotateCcw, Trash2, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { MAX_BULK_FILES, MAX_CV_BYTES } from '@/lib/cv-import/profile';
import { Badge, Button, Card, IconButton, Table, TBody, THead, Td, Th, Tr, cx } from '../_components/ui';
import {
  DEFAULT_SETTINGS,
  IMPORT_STATUS_UI,
  ImportResult,
  ImportSettings,
  ImportSettingsFields,
  ImportStatusBadge,
  Source,
  settingsError,
  startBatch,
  uploadToBatch,
} from './_shared';

/** How many CVs are read at once. Each takes 5–15 seconds of AI time. */
const CONCURRENCY = 3;
const MAX_MB = MAX_CV_BYTES / 1024 / 1024;

type Row = { key: string; file: File; state: 'queued' | 'working' | 'done'; result?: ImportResult; error?: string };

const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;

export default function BulkImport({ sources, onImported }: { sources: Source[]; onImported: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [settings, setSettings] = useState<ImportSettings>(DEFAULT_SETTINGS);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [rejected, setRejected] = useState<string[]>([]);
  const cancelled = useRef(false);

  // Leaving the page stops the import (the browser sends the files), so warn while it runs
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);

  const started = batchId !== null;
  const finished = started && !running;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_CV_BYTES,
    disabled: started,
    onDrop: (accepted, rejections) => {
      setError('');
      setRejected(rejections.map((r) => `${r.file.name}: ${r.errors[0]?.code === 'file-too-large' ? `over ${MAX_MB} MB` : 'not a PDF'}`));
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.key));
        const added = accepted.filter((f) => !seen.has(fileKey(f))).map((f) => ({ key: fileKey(f), file: f, state: 'queued' as const }));
        const next = [...prev, ...added];
        if (next.length > MAX_BULK_FILES) setError(`You can import up to ${MAX_BULK_FILES} CVs at a time. Only the first ${MAX_BULK_FILES} were added.`);
        return next.slice(0, MAX_BULK_FILES);
      });
    },
  });

  const update = (key: string, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const run = async () => {
    const problem = settingsError(settings);
    if (problem) return setError(problem);
    if (!rows.length) return setError('Add at least one CV.');
    setError('');
    setRunning(true);
    cancelled.current = false;

    let id: number;
    try {
      id = await startBatch(settings, 'BULK', rows.length);
      setBatchId(id);
    } catch (e) {
      setError((e as Error).message);
      setRunning(false);
      return;
    }

    const queue = [...rows];
    const worker = async () => {
      for (let row = queue.shift(); row && !cancelled.current; row = queue.shift()) {
        update(row.key, { state: 'working' });
        try {
          update(row.key, { state: 'done', result: await uploadToBatch(id, row.file) });
        } catch (e) {
          update(row.key, { state: 'done', error: (e as Error).message });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, rows.length) }, worker));

    setRunning(false);
    onImported();
    toast.success(cancelled.current ? 'Import stopped' : 'Import finished');
  };

  const reset = () => {
    setRows([]);
    setBatchId(null);
    setError('');
    setRejected([]);
    setSettings((s) => ({ ...DEFAULT_SETTINGS, sourceId: s.sourceId === 'new' ? '' : s.sourceId }));
  };

  const summary = useMemo(() => {
    const counts: Record<string, number> = { CREATED: 0, EXISTING: 0, NEEDS_REVIEW: 0, FAILED: 0 };
    let done = 0;
    for (const r of rows) {
      if (r.state !== 'done') continue;
      done++;
      counts[r.result?.status ?? 'FAILED']++;
    }
    return { done, counts };
  }, [rows]);

  const pct = rows.length ? Math.round((summary.done / rows.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {!started && (
        <Card>
          <h3 className="text-sm font-semibold text-white">1. Add CVs</h3>
          <p className="mt-1 text-xs text-slate-500">
            PDFs up to {MAX_MB} MB each, up to {MAX_BULK_FILES} at a time. Each CV gets its own profile.
          </p>
          <div
            {...getRootProps()}
            className={cx(
              'mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
              isDragActive ? 'border-brand-lime/60 bg-brand-lime/[0.04]' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.02]',
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="h-8 w-8 text-slate-500" />
            <p className="mt-3 text-sm font-medium text-white">{isDragActive ? 'Drop the CVs here' : 'Drag CVs here, or click to choose'}</p>
            <p className="mt-1 text-xs text-slate-500">You can add more files before you start.</p>
          </div>
          {rejected.length > 0 && (
            <div className="mt-3 text-xs text-amber-300">
              <p className="font-medium">Skipped {rejected.length} file{rejected.length === 1 ? '' : 's'}:</p>
              <ul className="mt-1 list-inside list-disc text-amber-300/80">
                {rejected.slice(0, 5).map((r) => (
                  <li key={r}>{r}</li>
                ))}
                {rejected.length > 5 && <li>and {rejected.length - 5} more</li>}
              </ul>
            </div>
          )}
        </Card>
      )}

      {!started && rows.length > 0 && (
        <Card>
          <h3 className="mb-5 text-sm font-semibold text-white">2. Import settings</h3>
          <ImportSettingsFields value={settings} onChange={setSettings} sources={sources} showLabel />
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Keep this page open while the import runs. It takes about {Math.max(1, Math.round((rows.length * 10) / CONCURRENCY / 60))} min.</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={reset}>
                Clear
              </Button>
              <Button variant="primary" icon={Play} onClick={run} disabled={!settings.consent}>
                Import {rows.length} CV{rows.length === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {started && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{running ? 'Importing…' : cancelled.current ? 'Import stopped' : 'Import finished'}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {summary.done} of {rows.length} processed
                {running && ' · keep this page open'}
              </p>
            </div>
            <div className="flex gap-2">
              {running ? (
                <Button variant="ghost" onClick={() => (cancelled.current = true)}>
                  Stop after current files
                </Button>
              ) : (
                <>
                  <Link
                    href={`/admin/talent?batch=${batchId}`}
                    className="inline-flex h-10 items-center rounded-xl bg-white/[0.04] px-4 text-sm font-medium text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08] hover:text-white"
                  >
                    View candidates
                  </Link>
                  <Button variant="primary" icon={RotateCcw} onClick={reset}>
                    New import
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-brand-lime transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(summary.counts).map(([status, n]) => (
              <Badge key={status} tone={n ? IMPORT_STATUS_UI[status].tone : 'neutral'}>
                {IMPORT_STATUS_UI[status].label}: <span className="tabular-nums">{n}</span>
              </Badge>
            ))}
          </div>
          {finished && summary.counts.FAILED > 0 && (
            <p className="mt-3 text-xs text-slate-500">To retry failed CVs, start a new import with just those files.</p>
          )}
        </Card>
      )}

      {rows.length > 0 && (
        <Table>
          <THead>
            <Th>File</Th>
            <Th>Result</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </THead>
          <TBody>
            {rows.map((r) => (
              <Tr key={r.key}>
                <Td className="min-w-[220px]">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="truncate text-slate-200">{r.result?.candidate?.name || r.file.name}</p>
                      {r.result?.candidate?.name && <p className="truncate text-xs text-slate-500">{r.file.name}</p>}
                    </div>
                  </div>
                </Td>
                <Td className="min-w-[260px]">
                  {r.state === 'queued' && <span className="text-xs text-slate-500">{started ? 'Waiting' : `${(r.file.size / 1024).toFixed(0)} KB`}</span>}
                  {r.state === 'working' && (
                    <span className="inline-flex items-center gap-2 text-xs text-sky-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading CV…
                    </span>
                  )}
                  {r.state === 'done' && (
                    <div className="space-y-1">
                      <ImportStatusBadge status={r.result?.status ?? 'FAILED'} />
                      {(r.result?.message || r.error) && <p className="text-xs text-slate-500">{r.result?.message || r.error}</p>}
                    </div>
                  )}
                </Td>
                <Td align="right">
                  {!started && <IconButton icon={Trash2} label={`Remove ${r.file.name}`} onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))} />}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
