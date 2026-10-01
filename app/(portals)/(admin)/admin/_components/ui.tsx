'use client';

import { forwardRef, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Search, X, LucideIcon } from 'lucide-react';
import { Spinner } from '@/components/PortalLoader';

/* -------------------------------------------------------------------------- */
/*  Admin console design system                                               */
/*  Surfaces: ink-950 page · ink-900 cards · ink-850 raised/hover             */
/*  Hairlines: white/[0.06] · Accent: brand-lime (UI only, never chart marks) */
/* -------------------------------------------------------------------------- */

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/** Stable fallback for missing lists, so memoised selectors don't recompute every render. */
export const EMPTY: any[] = [];

/* ------------------------------- Layout ---------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={cx('rounded-2xl border border-white/[0.06] bg-ink-900', padded && 'p-6', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------- Stats ---------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: 'default' | 'attention';
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const Comp = interactive ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cx(
        'group relative w-full rounded-2xl border bg-ink-900 p-5 text-left transition-colors',
        tone === 'attention' ? 'border-amber-400/25' : 'border-white/[0.06]',
        interactive && 'cursor-pointer hover:border-white/[0.12] hover:bg-ink-850 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/60',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        {Icon && (
          <span
            className={cx(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              tone === 'attention' ? 'bg-amber-400/10 text-amber-300' : 'bg-white/[0.04] text-slate-400 group-hover:text-brand-lime',
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {hint && <div className="mt-1.5 text-xs text-slate-500">{hint}</div>}
    </Comp>
  );
}

/* -------------------------------- Badge ---------------------------------- */

export type BadgeTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'brand';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-white/[0.05] text-slate-300 ring-white/10',
  success: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  info: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  warning: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  danger: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  brand: 'bg-brand-lime/10 text-brand-lime ring-brand-lime/25',
};

export function Badge({ tone = 'neutral', children, dot = false }: { tone?: BadgeTone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', BADGE_TONES[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Maps any status string used across the platform to a consistent badge tone. */
export function statusTone(status?: string | null): BadgeTone {
  switch (String(status || '').toUpperCase()) {
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'OFFERED':
    case 'COMPLETED':
    case 'GRADED':
      return 'success';
    case 'INTERVIEWING':
    case 'REVIEWED':
    case 'RESCHEDULED':
    case 'PROCESSING':
      return 'info';
    case 'PENDING':
    case 'DRAFT':
    case 'PENDING_REVIEW':
      return 'warning';
    case 'REJECTED':
    case 'CANCELLED':
    case 'CLOSED':
    case 'FAILED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function StatusBadge({ status }: { status?: string | null }) {
  const label = String(status || 'Unknown').replace(/_/g, ' ').toLowerCase();
  return (
    <Badge tone={statusTone(status)} dot>
      <span className="capitalize">{label}</span>
    </Badge>
  );
}

/* -------------------------------- Buttons -------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-lime text-brand-navy hover:bg-brand-lime-soft shadow-[0_0_0_1px_rgba(166,242,60,0.3),0_8px_24px_-12px_rgba(166,242,60,0.5)]',
  secondary: 'bg-white/[0.04] text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08] hover:text-white',
  ghost: 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
  danger: 'bg-rose-500/90 text-white hover:bg-rose-500',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    loading?: boolean;
  }
>(function Button({ variant = 'secondary', size = 'md', icon: Icon, loading, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
        'disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> : Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  );
});

export function IconButton({
  icon: Icon,
  label,
  tone = 'default',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cx(
        'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/60',
        tone === 'danger' ? 'hover:bg-rose-500/10 hover:text-rose-300' : 'hover:bg-white/[0.06] hover:text-white',
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* --------------------------------- Forms --------------------------------- */

const FIELD_BASE =
  'w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-brand-lime/50 focus:outline-none focus:ring-4 focus:ring-brand-lime/10 disabled:opacity-50';

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-300">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cx(FIELD_BASE, 'h-10', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cx(FIELD_BASE, 'py-2.5 leading-relaxed', className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cx(FIELD_BASE, 'h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}
    >
      {children}
    </select>
  );
});

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(FIELD_BASE, 'h-10 pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Segmented control for filters (e.g. All / Active / Pending). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex rounded-xl bg-ink-950/60 p-1 ring-1 ring-inset ring-white/[0.06]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors',
              active ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-400 hover:text-white',
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cx('tabular-nums', active ? 'text-brand-lime' : 'text-slate-500')}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Table --------------------------------- */

/** `empty` renders below the header row when there are no rows (pass an EmptyState). */
export function Table({ children, empty }: { children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
      {empty}
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-white/[0.06] bg-white/[0.02]">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <th
      scope="col"
      className={cx(
        'whitespace-nowrap px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-slate-500',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-white/[0.04]">{children}</tbody>;
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick} className={cx('transition-colors hover:bg-white/[0.02]', onClick && 'cursor-pointer')}>
      {children}
    </tr>
  );
}

export function Td({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <td className={cx('px-5 py-4 align-middle', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}>
      {children}
    </td>
  );
}

/** Two-line identity cell: avatar initials + primary/secondary text. */
export function Identity({ name, sub, avatar = true }: { name?: string | null; sub?: ReactNode; avatar?: boolean }) {
  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatar && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-700 to-ink-800 text-xs font-semibold text-slate-200 ring-1 ring-inset ring-white/10">
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-white">{name || 'Unnamed'}</p>
        {sub && <div className="truncate text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

/* ------------------------------ Empty states ----------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500 ring-1 ring-inset ring-white/[0.06]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-medium text-white">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------- Skeletons ------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('relative overflow-hidden rounded-lg bg-white/[0.04]', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
    </div>
  );
}

/** Skeleton for the content area, shown inside the shell while data loads. */
export function PageSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in" role="status" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[118px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

/* ------------------------------ Chart theme ------------------------------ */
/* Validated (dataviz validator, dark, surface #0B1529): series pass lightness */
/* band, CVD and contrast checks. Data marks never use the UI lime accent.    */

export const chartTheme = {
  series1: '#6FA31A', // deep lime
  series2: '#3987E5', // blue
  grid: '#16233D',
  axis: '#64748B',
  tooltip: {
    contentStyle: {
      backgroundColor: '#0B1529',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      boxShadow: '0 12px 32px -12px rgba(0,0,0,0.6)',
      fontSize: 12,
      padding: '8px 12px',
    },
    labelStyle: { color: '#ffffff', fontWeight: 500, marginBottom: 4 },
    itemStyle: { color: '#cbd5e1', padding: 0 },
    cursor: { fill: 'rgba(255,255,255,0.03)' },
  },
} as const;

export function LegendKey({ color, label, value }: { color: string; label: string; value?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-400">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
      {value !== undefined && <span className="font-medium tabular-nums text-white">{value}</span>}
    </span>
  );
}
