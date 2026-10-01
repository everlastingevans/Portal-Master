'use client';

import Image from 'next/image';
import LaunchPathMark from '@/assets/logo/launchpath-main.png';

interface PortalLoaderProps {
  portal?: 'ADMIN' | 'EMPLOYER' | 'CANDIDATE';
  title?: string;
  subtitle?: string;
}

const PORTAL_LABEL: Record<NonNullable<PortalLoaderProps['portal']>, string> = {
  ADMIN: 'Admin Console',
  EMPLOYER: 'Employer Workspace',
  CANDIDATE: 'Candidate Portal',
};

/**
 * Full-screen branded loader. Use for initial page/session loads in every portal
 * so the first frame always looks the same: navy canvas, logo, indeterminate bar.
 */
export default function PortalLoader({ portal, title = 'Loading', subtitle }: PortalLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-brand-navy px-6 select-none animate-fade-in"
      role="status"
      aria-live="polite"
      id="portal-loader-root"
    >
      {/* Soft brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(166,242,60,0.08),transparent_70%)]"
      />

      <div className="relative flex flex-col items-center text-center">
        <Image src={LaunchPathMark} alt="LaunchPath" priority className="h-16 w-auto sm:h-20" />

        <div className="mt-10 h-[3px] w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/5 rounded-full bg-brand-lime animate-loader-bar" />
        </div>

        <p className="mt-6 text-sm font-medium text-white">{title}</p>
        <p className="mt-1.5 min-h-[1rem] text-xs text-white/50">
          {subtitle ?? (portal ? PORTAL_LABEL[portal] : '')}
        </p>
      </div>
    </div>
  );
}

/** Small inline spinner for buttons and compact areas. Inherits text colour. */
export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** In-page loader for a panel or tab while its own data loads. */
export function SectionLoader({ label = 'Loading', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in ${className}`} role="status">
      <div className="h-[3px] w-32 overflow-hidden rounded-full bg-slate-500/20">
        <div className="h-full w-2/5 rounded-full bg-brand-lime animate-loader-bar" />
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
