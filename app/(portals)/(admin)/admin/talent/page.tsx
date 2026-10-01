'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Plus, Pencil, Trash2, Video, Eye, Linkedin, Github } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { useAdmin } from '../AdminContext';
import { useConfirm } from '../_components/overlay';
import { PageHeader, Button, IconButton, SearchInput, Segmented, Table, THead, Th, TBody, Tr, Td, Identity, Badge, EmptyState , EMPTY } from '../_components/ui';
import SuperadminCandidateInspector from '../dashboard/SuperadminCandidateInspector';
import SuperadminCandidateModal from '../dashboard/SuperadminCandidateModal';

type Filter = 'all' | 'pending-video' | 'with-cv' | 'no-cv';

const hasPendingVideo = (c: any) => c.video_interviews?.some((v: any) => v.status === 'PENDING_REVIEW');

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
  const [inspect, setInspect] = useState<any>(null);
  const [inspectTab, setInspectTab] = useState('profile');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const counts = useMemo(
    () => ({
      all: candidates.length,
      'pending-video': candidates.filter(hasPendingVideo).length,
      'with-cv': candidates.filter((c) => c.resume_text).length,
      'no-cv': candidates.filter((c) => !c.resume_text).length,
    }),
    [candidates],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((c) => {
        if (filter === 'pending-video') return hasPendingVideo(c);
        if (filter === 'with-cv') return Boolean(c.resume_text);
        if (filter === 'no-cv') return !c.resume_text;
        return true;
      })
      .filter((c) => !q || [c.name, c.email, c.professional_title, c.experience_level].some((v) => v?.toLowerCase().includes(q)));
  }, [candidates, filter, query]);

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
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, email or title" className="lg:w-80" />
      </div>

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
                    {!c.resume_text && <Badge tone="warning">No CV</Badge>}
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
