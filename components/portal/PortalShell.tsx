'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Search,
  Bookmark,
  Briefcase,
  Inbox,
  Video,
  UserRound,
  Settings,
  LayoutDashboard,
  Users,
  UserSearch,
  CalendarClock,
  ListChecks,
  Building2,
  Plus,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';
import LaunchPathLogo from '@/components/LaunchPathLogo';
import { ThanosSidebarWidget } from '@/components/ThanosSidebarWidget';
import { ConfirmProvider } from './overlay';
import { Avatar, cx } from './ui';

export type PortalKind = 'candidate' | 'employer';

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Dashboard tab this item selects (rendered as a button on the dashboard, a link elsewhere). */
  tab?: string;
  /** Standalone route. */
  href?: string;
};

const NAV: Record<PortalKind, { dashboard: string; groups: { label: string; items: NavItem[] }[] }> = {
  candidate: {
    dashboard: '/candidate/dashboard',
    groups: [
      {
        label: 'Discover',
        items: [
          { id: 'Jobs', label: 'For you', icon: Sparkles, tab: 'Jobs' },
          { id: 'AllJobs', label: 'Browse jobs', icon: Search, tab: 'AllJobs' },
          { id: 'Saved', label: 'Saved', icon: Bookmark, tab: 'Saved' },
        ],
      },
      {
        label: 'Your search',
        items: [
          { id: 'Applications', label: 'Applications', icon: Briefcase, tab: 'Applications' },
          { id: 'Inbox', label: 'Messages', icon: Inbox, tab: 'Inbox' },
          { id: 'Practice', label: 'Interview practice', icon: Video, href: '/candidate/readiness-interview' },
        ],
      },
      {
        label: 'Account',
        items: [
          { id: 'Profile', label: 'Profile & CV', icon: UserRound, tab: 'Profile' },
          { id: 'Settings', label: 'Settings', icon: Settings, tab: 'Settings' },
        ],
      },
    ],
  },
  employer: {
    dashboard: '/employer/dashboard',
    groups: [
      {
        label: 'Hiring',
        items: [
          { id: 'Overview', label: 'Overview', icon: LayoutDashboard, tab: 'Overview' },
          { id: 'Applicants', label: 'Applicants', icon: Users, tab: 'Applicants' },
          { id: 'TalentPool', label: 'Talent pool', icon: UserSearch, href: '/employer/talent-pool' },
          { id: 'Interviews', label: 'Interviews', icon: CalendarClock, href: '/employer/update' },
          { id: 'Listings', label: 'Manage listings', icon: ListChecks, href: '/employer/delete' },
        ],
      },
      {
        label: 'Company',
        items: [
          { id: 'Profile', label: 'Company profile', icon: Building2, tab: 'Profile' },
          { id: 'Settings', label: 'Settings', icon: Settings, tab: 'Settings' },
        ],
      },
    ],
  },
};

export interface PortalShellProps {
  portal: PortalKind;
  user: any;
  onLogout: () => void;
  children: ReactNode;
  /** Current dashboard tab (dashboards only). */
  activeTab?: string;
  /** Called when a tab nav item is clicked while on the dashboard. */
  onTabChange?: (tab: string) => void;
  /** Count badges keyed by nav item id, e.g. { Applications: 3, Inbox: 2 }. */
  badges?: Partial<Record<string, number>>;
  /** Overrides the top-bar title (defaults to the active nav item's label). */
  title?: string;
  /** Extra controls rendered on the right of the top bar. */
  actions?: ReactNode;
  /** Let content span the full width (e.g. split-pane job feeds). */
  fullWidth?: boolean;
}

export default function PortalShell({
  portal,
  user,
  onLogout,
  children,
  activeTab,
  onTabChange,
  badges = {},
  title,
  actions,
  fullWidth = false,
}: PortalShellProps) {
  const pathname = usePathname() || '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = NAV[portal];
  const onDashboard = pathname.startsWith(config.dashboard);

  useEffect(() => setMobileOpen(false), [pathname, activeTab]);

  const isActive = (item: NavItem) => {
    if (item.href) return pathname.startsWith(item.href);
    return onDashboard && activeTab === item.tab;
  };

  const allItems = config.groups.flatMap((g) => g.items);
  const current = allItems.find(isActive);
  const pageTitle = title || current?.label || (portal === 'employer' ? 'Employer workspace' : 'Your dashboard');

  const navItem = (item: NavItem) => {
    const active = isActive(item);
    const count = badges[item.id];
    const content = (
      <>
        {active && <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-lime" />}
        <item.icon className={cx('h-4 w-4 shrink-0', active ? 'text-brand-lime' : 'text-white/40 group-hover:text-white/70')} />
        <span className="flex-1 truncate">{item.label}</span>
        {!!count && (
          <span className="min-w-[20px] rounded-full bg-brand-lime px-1.5 text-center text-[11px] font-semibold tabular-nums text-brand-navy">{count}</span>
        )}
      </>
    );
    const classes = cx(
      'group relative flex h-9 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors',
      active ? 'bg-white/[0.08] font-medium text-white' : 'text-white/60 hover:bg-white/[0.05] hover:text-white',
    );

    if (item.tab && onDashboard && onTabChange) {
      return (
        <button type="button" onClick={() => onTabChange(item.tab!)} aria-current={active ? 'page' : undefined} className={classes}>
          {content}
        </button>
      );
    }
    return (
      <Link href={item.href || `${config.dashboard}?tab=${item.tab}`} aria-current={active ? 'page' : undefined} className={classes}>
        {content}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <LaunchPathLogo href={config.dashboard} className="h-9" />
        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60 ring-1 ring-inset ring-white/10">
          {portal === 'employer' ? 'Employer' : 'Talent'}
        </span>
      </div>

      {portal === 'employer' && (
        <div className="px-4 pt-3">
          <Link
            href="/employer/new"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-lime text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-lime-soft"
          >
            <Plus className="h-4 w-4" /> Post a job
          </Link>
        </div>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main">
        {config.groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-medium text-white/35">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.id}>{navItem(item)}</li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {String(user?.realRole || '').toUpperCase() === 'SUPERADMIN' && (
        <ThanosSidebarWidget currentRole={portal === 'employer' ? 'EMPLOYER' : 'CANDIDATE'} />
      )}

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-lime text-xs font-semibold text-brand-navy">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name || 'Your account'}</p>
            <p className="truncate text-xs text-white/40">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ConfirmProvider>
      <div className="h-app flex w-full overflow-hidden bg-canvas font-sans text-slate-600 antialiased">
        <aside className="hidden w-64 shrink-0 bg-brand-navy lg:block">{sidebar}</aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
            <aside className="h-app relative w-72 max-w-[calc(100vw-4.5rem)] overflow-hidden bg-brand-navy shadow-2xl ring-1 ring-white/10 animate-fade-in">
              {sidebar}
            </aside>
            {/* Close sits on the backdrop, clear of the logo and badge */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute left-[min(18rem,calc(100vw-4.5rem))] top-4 ml-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-brand-navy shadow-lg animate-fade-in"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="-ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-navy lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <p className="truncate text-sm font-semibold text-brand-navy">{pageTitle}</p>
            </div>

            <div className="flex items-center gap-1.5">
              {actions}
              {portal === 'candidate' && (
                <NotificationsLink count={badges.Inbox} onDashboard={onDashboard} onTabChange={onTabChange} />
              )}
              <AccountMenu portal={portal} user={user} onLogout={onLogout} dashboard={config.dashboard} onDashboard={onDashboard} onTabChange={onTabChange} />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div
              key={`${pathname}-${activeTab ?? ''}`}
              className={cx('w-full animate-fade-in', fullWidth ? 'h-full' : 'mx-auto max-w-7xl px-4 py-8 sm:px-8')}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}

function initials(name?: string) {
  return (name || 'You')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function NotificationsLink({ count, onDashboard, onTabChange }: { count?: number; onDashboard: boolean; onTabChange?: (tab: string) => void }) {
  const classes = 'relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-navy';
  const dot = !!count && (
    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
      {count > 9 ? '9+' : count}
    </span>
  );
  if (onDashboard && onTabChange) {
    return (
      <button type="button" onClick={() => onTabChange('Inbox')} aria-label="Messages" className={classes}>
        <Bell className="h-[18px] w-[18px]" />
        {dot}
      </button>
    );
  }
  return (
    <Link href="/candidate/dashboard?tab=Inbox" aria-label="Messages" className={classes}>
      <Bell className="h-[18px] w-[18px]" />
      {dot}
    </Link>
  );
}

function AccountMenu({
  portal,
  user,
  onLogout,
  dashboard,
  onDashboard,
  onTabChange,
}: {
  portal: PortalKind;
  user: any;
  onLogout: () => void;
  dashboard: string;
  onDashboard: boolean;
  onTabChange?: (tab: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (tab: string) => {
    setOpen(false);
    if (onDashboard && onTabChange) onTabChange(tab);
    else window.location.href = `${dashboard}?tab=${tab}`;
  };

  const itemClass = 'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-navy';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex cursor-pointer items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
      >
        <Avatar name={user?.name} size="sm" />
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-brand-navy sm:block">{user?.name?.split(' ')[0] || 'Account'}</span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(10,27,61,0.25)] ring-1 ring-slate-200 animate-scale-in">
          <div className="border-b border-slate-100 px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-medium text-brand-navy">{user?.name || 'Your account'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <div className="py-1">
            <button role="menuitem" className={itemClass} onClick={() => go('Profile')}>
              {portal === 'employer' ? <Building2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
              {portal === 'employer' ? 'Company profile' : 'Profile & CV'}
            </button>
            <button role="menuitem" className={itemClass} onClick={() => go('Settings')}>
              <Settings className="h-4 w-4" /> Settings
            </button>
          </div>
          <div className="border-t border-slate-100 pt-1">
            <button role="menuitem" className={cx(itemClass, 'hover:text-rose-600')} onClick={onLogout}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
