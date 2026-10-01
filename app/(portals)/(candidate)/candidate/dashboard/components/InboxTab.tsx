'use client';

import { useMemo, useState } from 'react';
import { Bell, Briefcase, CalendarClock, CheckCheck, Inbox, LucideIcon } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader, Segmented, cx } from '@/components/portal/ui';

export interface InboxTabProps {
  notifications: any[];
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

type Filter = 'all' | 'unread';

const TYPE_META: Record<string, { icon: LucideIcon; label: string; tile: string }> = {
  APPLICATION: { icon: Briefcase, label: 'Application update', tile: 'bg-sky-50 text-sky-700 ring-sky-600/15' },
  INTERVIEW: { icon: CalendarClock, label: 'Interview', tile: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
  INFO: { icon: Bell, label: 'Notice', tile: 'bg-slate-50 text-slate-600 ring-slate-200' },
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function relativeTime(iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  const ms = date.getTime();
  if (Number.isNaN(ms)) return '';
  const diff = Date.now() - ms;
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export default function InboxTab({ notifications = [], markAllAsRead, markAsRead }: InboxTabProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const unread = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);
  const visible = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const onMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Messages"
        description="Updates on your applications, interview invites and news from the LaunchPath team."
        actions={
          unread > 0 ? (
            <Button variant="secondary" size="sm" icon={CheckCheck} loading={markingAll} onClick={onMarkAll}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {notifications.length > 0 && (
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: notifications.length },
            { value: 'unread', label: 'Unread', count: unread },
          ]}
        />
      )}

      <Card padded={false} className="overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={notifications.length === 0 ? 'No messages yet' : 'You are all caught up'}
            description={
              notifications.length === 0
                ? 'When you apply for a role or an employer invites you to an interview, you will hear about it here.'
                : 'You have read every message. Nice one.'
            }
            action={
              notifications.length > 0 ? (
                <Button variant="secondary" onClick={() => setFilter('all')}>
                  Show all messages
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((n: any) => {
              const meta = TYPE_META[String(n.type || 'INFO').toUpperCase()] || TYPE_META.INFO;
              const Icon = meta.icon;
              const isUnread = !n.is_read;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => isUnread && markAsRead(n.id)}
                    className={cx(
                      'flex w-full cursor-pointer gap-4 px-5 py-4 text-left transition-colors focus-visible:bg-slate-50 focus-visible:outline-none sm:px-6',
                      isUnread ? 'bg-slate-50/70 hover:bg-slate-100/70' : 'hover:bg-slate-50/70',
                    )}
                  >
                    <span className={cx('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', meta.tile)} title={meta.label}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{meta.label}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className={cx('text-sm text-brand-navy', isUnread ? 'font-semibold' : 'font-medium')}>{n.title}</span>
                        <span className="flex shrink-0 items-center gap-2 pt-0.5">
                          <time
                            dateTime={n.created_at}
                            title={n.created_at ? new Date(n.created_at).toLocaleString('en-ZA') : undefined}
                            className="whitespace-nowrap text-xs text-slate-500"
                          >
                            {relativeTime(n.created_at)}
                          </time>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-brand-navy" aria-hidden="true" />
                          )}
                          {isUnread && <span className="sr-only">Unread</span>}
                        </span>
                      </span>
                      {n.content && <span className="mt-1 block text-sm leading-relaxed text-slate-600">{n.content}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
