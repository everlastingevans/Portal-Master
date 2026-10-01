'use client';

import { forwardRef, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Search, X, LucideIcon } from 'lucide-react';
import { Spinner } from '@/components/PortalLoader';

/* -------------------------------------------------------------------------- */
/*  Candidate & employer portal design system (light)                         */
/*  Canvas bg-canvas · cards white + slate-200 hairline · ink brand-navy      */
/*  Primary = navy. Accent = lime, used for ONE hero action per screen.       */
/*  Same component API as the admin kit (app/(portals)/(admin)/admin/_components/ui.tsx). */
/* -------------------------------------------------------------------------- */

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/** Stable fallback for missing lists, so memoised selectors don't recompute every render. */
export const EMPTY: any[] = [];

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/* ------------------------------- Layout ---------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-xs font-medium text-slate-500">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-brand-navy sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  padded = true,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(10,27,61,0.04)]',
        padded && 'p-6',
        interactive && 'transition-all hover:border-slate-300 hover:shadow-[0_4px_16px_-6px_rgba(10,27,61,0.12)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-brand-navy">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Thin divider with optional label, for separating form sections inside a card. */
export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-6 border-t border-slate-100 py-8 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-3">
      <div>
        <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="space-y-4 md:col-span-2">{children}</div>
    </section>
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
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cx(
        'group w-full rounded-2xl border bg-white p-5 text-left shadow-[0_1px_2px_rgba(10,27,61,0.04)] transition-all',
        tone === 'attention' ? 'border-amber-300/70' : 'border-slate-200/80',
        onClick && cx('cursor-pointer hover:border-slate-300 hover:shadow-[0_4px_16px_-6px_rgba(10,27,61,0.12)]', FOCUS),
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon && (
          <span
            className={cx(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              tone === 'attention' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500 group-hover:bg-brand-navy group-hover:text-brand-lime',
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy">{value}</p>
      {hint && <div className="mt-1.5 text-xs text-slate-500">{hint}</div>}
    </Comp>
  );
}

/* -------------------------------- Badge ---------------------------------- */

export type BadgeTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'brand';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  brand: 'bg-brand-lime/25 text-brand-navy ring-brand-lime/60',
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
    case 'ACCEPTED':
      return 'success';
    case 'INTERVIEWING':
    case 'REVIEWED':
    case 'RESCHEDULED':
    case 'PROCESSING':
    case 'SHORTLISTED':
      return 'info';
    case 'PENDING':
    case 'DRAFT':
    case 'PENDING_REVIEW':
    case 'PROPOSED':
      return 'warning';
    case 'REJECTED':
    case 'CANCELLED':
    case 'DECLINED':
    case 'CLOSED':
    case 'FAILED':
    case 'WITHDRAWN':
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

/** Match-score pill used on job cards and candidate lists. */
export function MatchScore({ score }: { score?: number | null }) {
  if (score === null || score === undefined) return null;
  const tone: BadgeTone = score >= 85 ? 'brand' : score >= 70 ? 'info' : 'neutral';
  return (
    <Badge tone={tone}>
      <span className="tabular-nums">{Math.round(score)}% match</span>
    </Badge>
  );
}

/* -------------------------------- Buttons -------------------------------- */

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-navy text-white hover:bg-[#13295A] shadow-[0_1px_2px_rgba(10,27,61,0.2)]',
  accent: 'bg-brand-lime text-brand-navy hover:bg-brand-lime-soft shadow-[0_1px_2px_rgba(10,27,61,0.12)]',
  secondary: 'bg-white text-brand-navy ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-brand-navy',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    loading?: boolean;
    fullWidth?: boolean;
  }
>(function Button({ variant = 'secondary', size = 'md', icon: Icon, loading, fullWidth, className, children, disabled, ...props }, ref) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-medium transition-all',
        FOCUS,
        'disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className={iconSize} /> : Icon && <Icon className={iconSize} />}
      {children}
    </button>
  );
});

/** Same look as Button, for navigation (renders an <a>). Pass a Next <Link> via `as` when needed. */
export function buttonClasses({ variant = 'secondary', size = 'md', fullWidth }: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {}) {
  return cx(
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-medium transition-all',
    FOCUS,
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    fullWidth && 'w-full',
  );
}

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
        'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors',
        FOCUS,
        tone === 'danger' ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-slate-100 hover:text-brand-navy',
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
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-brand-navy placeholder:text-slate-400 shadow-[0_1px_1px_rgba(10,27,61,0.03)] transition-colors focus:border-brand-navy/40 focus:outline-none focus:ring-4 focus:ring-brand-navy/[0.06] disabled:bg-slate-50 disabled:text-slate-500';

export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional,
  action,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  optional?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">
          {label}
          {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
        </label>
        {action}
      </div>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon; invalid?: boolean }>(
  function Input({ className, icon: Icon, invalid, ...props }, ref) {
    const input = (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(FIELD_BASE, 'h-11', Icon && 'pl-10', invalid && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10', className)}
        {...props}
      />
    );
    if (!Icon) return input;
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {input}
      </div>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cx(FIELD_BASE, 'py-2.5 leading-relaxed', className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cx(FIELD_BASE, 'h-11 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
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
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-brand-navy"
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
  size = 'md',
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number; icon?: LucideIcon }[];
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100/80 p-1 ring-1 ring-inset ring-slate-200/60">
      {options.map(({ value: v, label, count, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={active}
            className={cx(
              'inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-white text-brand-navy shadow-[0_1px_3px_rgba(10,27,61,0.12)]' : 'text-slate-500 hover:text-brand-navy',
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
            {count !== undefined && <span className={cx('tabular-nums', active ? 'text-slate-500' : 'text-slate-400')}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Choice cards (radio group) e.g. account type, channel. */
export function ChoiceCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        'relative flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all',
        FOCUS,
        selected ? 'border-brand-navy bg-brand-navy/[0.03] shadow-[0_0_0_3px_rgba(10,27,61,0.06)]' : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      <span
        className={cx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
          selected ? 'bg-brand-navy text-brand-lime' : 'bg-slate-100 text-slate-500',
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-brand-navy">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          'absolute right-4 top-4 h-4 w-4 rounded-full border-2 transition-colors',
          selected ? 'border-brand-navy bg-brand-navy shadow-[inset_0_0_0_2.5px_white]' : 'border-slate-300',
        )}
      />
    </button>
  );
}

/** Inline alert box for form errors / notices. */
export function Alert({ tone = 'danger', children, icon: Icon }: { tone?: 'danger' | 'success' | 'info' | 'warning'; children: ReactNode; icon?: LucideIcon }) {
  const tones = {
    danger: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    info: 'bg-sky-50 text-sky-800 ring-sky-600/15',
    warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  };
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ring-1 ring-inset', tones[tone])}>
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* --------------------------------- Table --------------------------------- */

/** `empty` renders below the header row when there are no rows (pass an EmptyState). */
export function Table({ children, empty }: { children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(10,27,61,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
      {empty}
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-200/80 bg-slate-50/60">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <th
      scope="col"
      className={cx(
        'whitespace-nowrap px-5 py-3 text-xs font-medium text-slate-500',
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
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({ children, onClick, selected }: { children: ReactNode; onClick?: () => void; selected?: boolean }) {
  return (
    <tr onClick={onClick} className={cx('transition-colors hover:bg-slate-50/70', onClick && 'cursor-pointer', selected && 'bg-slate-50')}>
      {children}
    </tr>
  );
}

export function Td({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <td className={cx('px-5 py-4 align-middle text-slate-600', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}>{children}</td>
  );
}

export function Avatar({ name, src, size = 'md' }: { name?: string | null; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-8 w-8 text-[11px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-base' }[size];
  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name || ''} className={cx('shrink-0 rounded-xl bg-white object-cover ring-1 ring-slate-200', dims)} />;
  }
  return (
    <span className={cx('flex shrink-0 items-center justify-center rounded-xl bg-brand-navy font-semibold text-brand-lime', dims)}>{initials}</span>
  );
}

/** Two-line identity: avatar + primary/secondary text. */
export function Identity({ name, sub, src, avatar = true }: { name?: string | null; sub?: ReactNode; src?: string | null; avatar?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatar && <Avatar name={name} src={src} />}
      <div className="min-w-0">
        <p className="truncate font-medium text-brand-navy">{name || 'Unnamed'}</p>
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
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200/80">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-brand-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------- Skeletons ------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('relative overflow-hidden rounded-lg bg-slate-200/60', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

/** Skeleton for a content area while its data loads (inside the shell). */
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

/** Rich skeleton list for job/candidate cards. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Chart theme ------------------------------ */
/* For charts on white cards: deep lime + blue (dataviz-validated pair).      */

export const chartTheme = {
  series1: '#5E8C14',
  series2: '#2A78D6',
  grid: '#EEF1F5',
  axis: '#94A3B8',
  tooltip: {
    contentStyle: {
      backgroundColor: '#0A1B3D',
      border: 'none',
      borderRadius: 12,
      boxShadow: '0 12px 32px -12px rgba(10,27,61,0.45)',
      fontSize: 12,
      padding: '8px 12px',
    },
    labelStyle: { color: '#ffffff', fontWeight: 500, marginBottom: 4 },
    itemStyle: { color: '#cbd5e1', padding: 0 },
    cursor: { fill: 'rgba(10,27,61,0.04)' },
  },
} as const;
