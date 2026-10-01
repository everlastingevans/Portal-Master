'use client';

import { ReactNode, forwardRef, InputHTMLAttributes, useState } from 'react';
import Link from 'next/link';
import { Check, Eye, EyeOff, Lock } from 'lucide-react';
import LaunchPathLogo from '@/components/LaunchPathLogo';
import { Input, cx } from '@/components/portal/ui';

export type AuthAudience = 'talent' | 'employer' | 'neutral';

const PANEL_COPY: Record<AuthAudience, { headline: ReactNode; body: string; points: string[] }> = {
  neutral: {
    headline: (
      <>
        Where early-career talent meets <span className="text-brand-lime">growing businesses</span>.
      </>
    ),
    body: 'LaunchPath connects South African graduates with SMEs through AI matching, verified profiles and faster hiring.',
    points: ['AI-matched roles and candidates', 'Video interviews and readiness scores', 'Email, SMS and WhatsApp updates'],
  },
  talent: {
    headline: (
      <>
        Your first role starts with the <span className="text-brand-lime">right match</span>.
      </>
    ),
    body: 'Upload your CV once. We match you to roles that fit your skills and keep you updated at every step.',
    points: ['Jobs ranked by how well you fit', 'Practise interviews and build your readiness score', 'Track every application in one place'],
  },
  employer: {
    headline: (
      <>
        Hire entry-level talent <span className="text-brand-lime">faster and smarter</span>.
      </>
    ),
    body: 'Post a role in minutes and review pre-matched candidates with CVs, scores and video answers.',
    points: ['AI-drafted job posts', 'Ranked, pre-screened applicants', 'Schedule interviews with automatic reminders'],
  },
};

/**
 * Split-screen layout shared by login, sign-up and the portal chooser.
 * Brand panel on the left (lg+), focused form on the right.
 */
export default function AuthLayout({
  children,
  audience = 'neutral',
  topRight,
}: {
  children: ReactNode;
  audience?: AuthAudience;
  topRight?: ReactNode;
}) {
  const copy = PANEL_COPY[audience];

  return (
    <div className="flex min-h-screen bg-white font-sans antialiased">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden bg-brand-navy p-12 lg:flex xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(166,242,60,0.16),transparent_65%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]"
        />

        <div className="relative">
          <LaunchPathLogo className="h-11" />
        </div>

        <div key={audience} className="relative max-w-md animate-fade-in">
          <h2 className="text-[34px] font-semibold leading-[1.15] tracking-tight text-white xl:text-[40px]">{copy.headline}</h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/70">{copy.body}</p>
          <ul className="mt-8 space-y-3.5">
            {copy.points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-lime/15 text-brand-lime">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} LaunchPath · Built in South Africa</p>
      </aside>

      {/* Form panel */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center justify-between gap-4 bg-brand-navy px-5 lg:bg-transparent lg:px-10">
          <div className="lg:hidden">
            <LaunchPathLogo className="h-8" />
          </div>
          <Link href="/" className="hidden text-sm text-slate-500 transition-colors hover:text-brand-navy lg:inline">
            ← Back to site
          </Link>
          <div className="text-sm text-white/80 lg:text-slate-500">{topRight}</div>
        </div>

        <div className="flex flex-1 items-start justify-center px-5 py-10 sm:items-center sm:py-12">
          <div className="w-full max-w-[420px] animate-fade-in">{children}</div>
        </div>

        <p className="px-5 pb-6 text-center text-xs text-slate-400 lg:hidden">© {new Date().getFullYear()} LaunchPath</p>
      </main>
    </div>
  );
}

/** Heading block used at the top of each auth form. */
export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-[28px] font-semibold tracking-tight text-brand-navy">{title}</h1>
      {description && <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{description}</p>}
    </div>
  );
}

/** Link styled for use in the top-right of the auth layout (lime on navy mobile bar, navy on white desktop). */
export function AuthTopLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand-lime transition-colors hover:text-brand-lime-soft lg:text-brand-navy lg:hover:text-brand-navy/70">
      {children}
    </Link>
  );
}

/* ----------------------------- Password input ---------------------------- */

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} icon={Lock} type={visible ? 'text' : 'password'} className="pr-11" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-navy"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

/** Lightweight strength hint, never blocking beyond the 8-character minimum the API enforces. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return <p className="text-xs text-slate-500">Use at least 8 characters.</p>;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  const level = password.length < 8 ? 0 : Math.min(3, score);
  const labels = ['Too short', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-rose-500', 'bg-amber-400', 'bg-sky-500', 'bg-emerald-500'];
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx('h-1 flex-1 rounded-full transition-colors', i < Math.max(1, level) ? colors[level] : 'bg-slate-200')} />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-slate-500">{labels[level]}</span>
    </div>
  );
}

/** Divider with centered label. */
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      {children}
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

/** Only allow same-site relative redirects, e.g. "/employer/new". */
export function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login') || next.startsWith('/register')) return null;
  return next;
}

export function portalFor(role?: string) {
  const r = String(role || '').toUpperCase();
  if (r === 'SUPERADMIN') return '/admin/dashboard';
  if (r === 'EMPLOYER' || r === 'CLIENT') return '/employer/dashboard';
  return '/candidate/dashboard';
}
