'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, Plus, Pencil, Trash2, Video, Eye, Linkedin, Github, FileUp, X } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { isPlaceholderEmail } from '@/lib/cv-import/profile';
import { useAdmin } from '../AdminContext';
import { useConfirm } from '../_components/overlay';
import { PageHeader, Button, IconButton, SearchInput, Segmented, Select, Table, THead, Th, TBody, Tr, Td, Identity, Badge, EmptyState , EMPTY } from '../_components/ui';
import SuperadminCandidateInspector from '../dashboard/SuperadminCandidateInspector';
import SuperadminCandidateModal from '../dashboard/SuperadminCandidateModal';

type Filter = 'all' | 'pending-video' | 'with-cv' | 'no-cv';

const hasPendingVideo = (c: any) => c.video_interviews?.some((v: any) => v.status === 'PENDING_REVIEW');

/** Source filter values: '' = all, 'none' = no organisation, otherwise a source id. */
const matchesSource = (c: any, source: string) => (!source ? true : source === 'none' ? !c.source_id : String(c.source_id) === source);

function TalentView() {
  const { data, runOverride, fetchDashboardData } = useAdmin();
  const params = useSearchParams();
  const confirm = useConfirm();
  const toast = useToast();

  const candidates: any[] = data?.candidates ?? EMPTY;
  const interviews: any[] = data?.interviews ?? EMPTY;

  const initial = params.get('filter') as Filter;
  const [filter, setFilter] = useState<Filter>(['pending-video', 'with-cv', 'no-cv'].includes(initial) ? initial : 'all');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState(params.get('source') || '');
  const [batch, setBatch] = useState(params.get('batch') || '');
  const [inspect, setInspect] = useState<any>(null);
  const [inspectTab, setInspectTab] = useState('profile');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // Organisations that candidates on the platform came from, with how many each
  const sources = useMemo(() => {
    const map = new Map<number, { id: number; name: string; count: number }>();
    for (const c of candidates) {
      if (!c.source) continue;
      const s = map.get(c.source.id) || { id: c.source.id, name: c.source.name, count: 0 };
      s.count++;
      map.set(c.source.id, s);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [candidates]);

  // Status tab counts respect the source and import filters, so the numbers match the table
  const scoped = useMemo(
    () => candidates.filter((c) => matchesSource(c, source) && (!batch || String(c.import_batch_id) === batch)),
    [candidates, source, batch],
  );

  const counts = useMemo(
    () => ({
      all: scoped.length,
      'pending-video': scoped.filter(hasPendingVideo).length,
      'with-cv': scoped.filter((c) => c.resume_text).length,
      'no-cv': scoped.filter((c) => !c.resume_text).length,
    }),
    [scoped],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped
      .filter((c) => {
        if (filter === 'pending-video') return hasPendingVideo(c);
        if (filter === 'with-cv') return Boolean(c.resume_text);
        if (filter === 'no-cv') return !c.resume_text;
        return true;
      })
      .filter((c) => !q || [c.name, c.email, c.professional_title, c.experience_level, c.source?.name].some((v) => v?.toLowerCase().includes(q)));
  }, [scoped, filter, query]);

  const openInspector = (candidate: any, tab: string) => {
    setInspectTab(tab);
    setInspect(candidate);
  };

  const handleDelete = async (c: any) => {
    const ok = await confirm({
      title: `Delete ${c.name || 'this candidate'}?`,
      description: 'Their profile, CV, applications and matches will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Delete candidate',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await runOverride('DELETE_CANDIDATE', { candidateId: c.id });
    if (res.success) toast.success('Candidate deleted');
    else toast.error(res.error || 'Could not delete candidate');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talent"
        description="All registered candidates: profiles, CVs, matches and video interviews."
        actions={
          <>
            <Link
              href="/admin/cv-import"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/[0.04] px-4 text-sm font-medium text-slate-200 ring-1 ring-inset ring-white/10 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              <FileUp className="h-4 w-4" />
              Import CVs
            </Link>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              Add candidate
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'pending-video', label: 'Needs review', count: counts['pending-video'] },
            { value: 'with-cv', label: 'CV on file', count: counts['with-cv'] },
            { value: 'no-cv', label: 'No CV', count: counts['no-cv'] },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by school or organisation" className="sm:w-64">
            <option value="">All schools and organisations</option>
            {sources.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name} ({s.count})
              </option>
            ))}
            <option value="none">No organisation</option>
          </Select>
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, title or organisation" className="sm:w-80" />
        </div>
      </div>

      {batch && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-400/[0.06] px-4 py-2.5 text-sm text-sky-200 ring-1 ring-inset ring-sky-400/20">
          <span>
            Showing candidates from import #{batch}.{' '}
            <Link href={`/admin/cv-import?batch=${batch}`} className="underline underline-offset-2 hover:text-white">
              View import
            </Link>
          </span>
          <IconButton icon={X} label="Show all imports" onClick={() => setBatch('')} />
        </div>
      )}

      <Table
        empty={
          rows.length === 0 && (
            <EmptyState
              icon={Users}
              title={filter === 'pending-video' && !query ? 'No videos waiting for review' : 'No candidates match these filters'}
              description={filter === 'pending-video' && !query ? 'You’re all caught up.' : 'Try clearing the search or switching tabs.'}
            />
          )
        }
      >
        <THead>
          <Th>Candidate</Th>
          <Th>Profile</Th>
          <Th align="center">Applications</Th>
          <Th align="center">Best match</Th>
          <Th align="right">
            <span className="sr-only">Actions</span>
          </Th>
        </THead>
        <TBody>
          {rows.map((c) => {
            const pending = hasPendingVideo(c);
            const best = Math.max(0, ...(c.job_matches || []).map((m: any) => m.match_score || 0));
            return (
              <Tr key={c.id}>
                <Td className="min-w-[240px]">
                  <Identity
                    name={c.name}
                    sub={
                      <span className="flex items-center gap-2">
                        {c.email}
                        {c.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-slate-500 hover:text-white">
                            <Linkedin className="h-3 w-3" />
                          </a>
                        )}
                        {c.github_url && (
                          <a href={c.github_url} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-slate-500 hover:text-white">
                            <Github className="h-3 w-3" />
                          </a>
                        )}
                      </span>
                    }
                  />
                </Td>
                <Td className="min-w-[200px]">
                  <p className="text-slate-200">{c.professional_title || <span className="text-slate-500">No title</span>}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {c.experience_level && <Badge>{c.experience_level}</Badge>}
                    {c.source && <Badge tone="info">{c.source.name}</Badge>}
                    {!c.resume_text && <Badge tone="warning">No CV</Badge>}
                    {isPlaceholderEmail(c.email) && <Badge tone="warning">No email</Badge>}
                    {c.talent_pool_visible === false && <Badge>Hidden from employers</Badge>}
                    {pending && (
                      <Badge tone="warning" dot>
                        Video to review
                      </Badge>
                    )}
                  </div>
                </Td>
                <Td align="center" className="tabular-nums text-slate-300">
                  {c.applications?.length || 0}
                </Td>
                <Td align="center">
                  {best > 0 ? (
                    <Badge tone={best >= 85 ? 'success' : best >= 70 ? 'info' : 'neutral'}>
                      <span className="tabular-nums">{best}%</span>
                    </Badge>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-1">
                    {pending ? (
                      <Button size="sm" variant="primary" icon={Video} onClick={() => openInspector(c, 'video')}>
                        Review
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" icon={Eye} onClick={() => openInspector(c, 'profile')}>
                        View
                      </Button>
                    )}
                    <IconButton
                      icon={Pencil}
                      label="Edit candidate"
                      onClick={() => {
                        setEditing(c);
                        setModalOpen(true);
                      }}
                    />
                    <IconButton icon={Trash2} label="Delete candidate" tone="danger" onClick={() => handleDelete(c)} />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>

      <SuperadminCandidateInspector
        inspectCandidate={inspect}
        setInspectCandidate={setInspect}
        inspectTab={inspectTab}
        setInspectTab={setInspectTab}
        interviews={interviews}
        onRefresh={fetchDashboardData}
      />
      <SuperadminCandidateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} editingCand={editing} onSubmit={runOverride} />
    </div>
  );
}

export default function AdminTalentPage() {
  return (
    <Suspense>
      <TalentView />
    </Suspense>
  );
}
