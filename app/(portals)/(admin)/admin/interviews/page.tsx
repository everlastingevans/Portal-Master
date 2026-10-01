'use client';

import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { PageHeader, SearchInput, Segmented, Table, THead, Th, TBody, Tr, Td, Identity, StatusBadge, EmptyState , EMPTY } from '../_components/ui';

type Filter = 'all' | 'upcoming' | 'past';

export default function AdminInterviewsPage() {
  const { data } = useAdmin();
  const interviews: any[] = data?.interviews ?? EMPTY;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('upcoming');

  const now = Date.now();
  const isUpcoming = (iv: any) => new Date(iv.proposed_time).getTime() >= now;

  const counts = {
    all: interviews.length,
    upcoming: interviews.filter(isUpcoming).length,
    past: interviews.filter((iv) => !isUpcoming(iv)).length,
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return interviews
      .filter((iv) => (filter === 'all' ? true : filter === 'upcoming' ? isUpcoming(iv) : !isUpcoming(iv)))
      .filter((iv) =>
        !q ||
        [iv.candidate?.name, iv.candidate?.email, iv.employer?.name, iv.application?.job?.title, iv.application?.job?.company]
          .some((v) => v?.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const diff = new Date(a.proposed_time).getTime() - new Date(b.proposed_time).getTime();
        return filter === 'past' ? -diff : diff;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviews, query, filter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Interviews" description="Every interview employers have scheduled with candidates, and its confirmation status." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { value: 'past', label: 'Past', count: counts.past },
            { value: 'all', label: 'All', count: counts.all },
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search candidate, employer or role" className="sm:w-80" />
      </div>

      <Table
        empty={
          rows.length === 0 && (
            <EmptyState
              icon={CalendarClock}
              title={query ? 'No interviews match your search' : filter === 'upcoming' ? 'No upcoming interviews' : 'No interviews yet'}
              description={query ? 'Try a different name or role.' : 'Interviews appear here once employers schedule them.'}
            />
          )
        }
      >
        <THead>
          <Th>Candidate</Th>
          <Th>Employer</Th>
          <Th>Role</Th>
          <Th>Scheduled for</Th>
          <Th align="right">Status</Th>
        </THead>
        <TBody>
          {rows.map((iv) => {
            const when = new Date(iv.proposed_time);
            return (
              <Tr key={iv.id}>
                <Td>
                  <Identity name={iv.candidate?.name || 'Incomplete profile'} sub={iv.candidate?.email} />
                </Td>
                <Td>
                  <p className="text-white">{iv.employer?.name || '—'}</p>
                  <p className="text-xs text-slate-500">{iv.employer?.email}</p>
                </Td>
                <Td>
                  <p className="text-slate-200">{iv.application?.job?.title || 'Job removed'}</p>
                  <p className="text-xs text-slate-500">{iv.application?.job?.company}</p>
                </Td>
                <Td>
                  <p className="tabular-nums text-slate-200">{when.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs tabular-nums text-slate-500">{when.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
                </Td>
                <Td align="right">
                  <StatusBadge status={iv.status} />
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
