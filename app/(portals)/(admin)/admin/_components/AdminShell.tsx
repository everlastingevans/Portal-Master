'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileBarChart,
  Users,
  Building2,
  Briefcase,
  Inbox,
  Layers,
  Handshake,
  SlidersHorizontal,
  CalendarClock,
  Sparkles,
  BellRing,
  LogOut,
  Menu,
  X,
  RefreshCw,
  LucideIcon,
} from 'lucide-react';
import LaunchPathLogo from '@/components/LaunchPathLogo';
import PortalLoader from '@/components/PortalLoader';
import { ThanosSidebarWidget } from '@/components/ThanosSidebarWidget';
import { useAdmin } from '../AdminContext';
import { ConfirmProvider } from './overlay';
import { cx } from './ui';

type NavItem = { href: string; label: string; icon: LucideIcon; count?: number };

function useRelativeTime(date: Date | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!date) return 'Not synced';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return 'Synced just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Synced ${minutes}m ago`;
  return `Synced ${Math.round(minutes / 60)}h ago`;
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const { data, loading, refreshing, lastSyncedAt, user, fetchDashboardData, handleLogout } = useAdmin();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const syncedLabel = useRelativeTime(lastSyncedAt);

  // Close the drawer on navigation
  useEffect(() => setMobileOpen(false), [pathname]);

  if (loading) {
    return <PortalLoader portal="ADMIN" title="Loading admin console" />;
  }

  const pendingVideos = data?.stats?.pendingVideoInterviewsCount || 0;
  const pendingJobs = (data?.jobs || []).filter((j: any) => ['PENDING', 'DRAFT'].includes(String(j.status).toUpperCase())).length;

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Overview',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
      ],
    },
    {
      label: 'Manage',
      items: [
        { href: '/admin/vacancies', label: 'Vacancies', icon: Inbox },
        { href: '/admin/programmes', label: 'Programmes', icon: Layers },
        { href: '/admin/partner', label: 'Companies & Partner', icon: Handshake },
        { href: '/admin/talent', label: 'Talent', icon: Users, count: pendingVideos },
        { href: '/admin/corporate', label: 'Employers', icon: Building2 },
        { href: '/admin/jobs', label: 'Jobs', icon: Briefcase, count: pendingJobs },
        { href: '/admin/interviews', label: 'Interviews', icon: CalendarClock },
      ],
    },
    {
      label: 'Tools',
      items: [
        { href: '/admin/matcher', label: 'Matchmaker', icon: Sparkles },
        { href: '/admin/notifications', label: 'Notifications', icon: BellRing },
        { href: '/admin/setup', label: 'Commercial setup', icon: SlidersHorizontal },
      ],
    },
  ];

  const allItems = groups.flatMap((g) => g.items);
  const current = allItems.find((i) => pathname?.startsWith(i.href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <LaunchPathLogo href="/admin/dashboard" className="h-9" />
        <span className="rounded-md bg-brand-lime/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-lime ring-1 ring-inset ring-brand-lime/25">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-medium text-white/35">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, count }) => {
                const active = pathname?.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cx(
                        'group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                        active ? 'bg-white/[0.07] font-medium text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
                      )}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-lime" />}
                      <Icon className={cx('h-4 w-4 shrink-0', active ? 'text-brand-lime' : 'text-white/40 group-hover:text-white/70')} />
                      <span className="flex-1 truncate">{label}</span>
                      {!!count && (
                        <span className="min-w-[20px] rounded-full bg-amber-400/15 px-1.5 text-center text-[11px] font-medium tabular-nums text-amber-300">
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <ThanosSidebarWidget currentRole="SUPERADMIN" />

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-lime text-xs font-semibold text-brand-navy">
            {(user?.name || 'Admin').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name || 'Administrator'}</p>
            <p className="truncate text-xs text-white/40">{user?.email || 'Super admin'}</p>
          </div>
          <button
            onClick={handleLogout}
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
      <div className="h-app flex w-full overflow-hidden bg-ink-950 font-sans text-slate-300 antialiased">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-brand-navy lg:block">{sidebar}</aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
            <aside className="h-app relative w-72 max-w-[calc(100vw-4.5rem)] overflow-hidden border-r border-white/10 bg-brand-navy shadow-2xl animate-fade-in">
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
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-ink-950/80 px-4 backdrop-blur sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="-ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
                <span className="hidden text-slate-500 sm:inline">Admin</span>
                <span className="hidden text-slate-700 sm:inline">/</span>
                <span className="truncate font-medium text-white">{current?.label || 'Dashboard'}</span>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                <span className={cx('h-1.5 w-1.5 rounded-full', refreshing ? 'bg-amber-300' : 'bg-emerald-400')} />
                {refreshing ? 'Syncing…' : syncedLabel}
              </span>
              <button
                onClick={() => fetchDashboardData()}
                disabled={refreshing}
                title="Refresh data"
                aria-label="Refresh data"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-wait"
              >
                <RefreshCw className={cx('h-4 w-4', refreshing && 'animate-spin')} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div key={pathname} className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
