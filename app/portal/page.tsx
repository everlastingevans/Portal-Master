'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap, Building2, LucideIcon } from 'lucide-react';
import AuthLayout, { AuthHeading, AuthTopLink, AuthDivider } from '@/components/auth/AuthLayout';
import { buttonClasses } from '@/components/portal/ui';

function PathCard({ href, icon: Icon, title, description, points }: { href: string; icon: LucideIcon; title: string; description: string; points: string[] }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-navy hover:shadow-[0_8px_24px_-12px_rgba(10,27,61,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-brand-navy transition-colors group-hover:bg-brand-navy group-hover:text-brand-lime">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center justify-between gap-2 text-[15px] font-semibold text-brand-navy">
            {title}
            <ArrowRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-navy" />
          </p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {points.map((p) => (
              <li key={p} className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200/70">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Link>
  );
}

export default function PortalChooserPage() {
  return (
    <AuthLayout
      topRight={
        <>
          <span className="hidden sm:inline">Already have an account? </span>
          <AuthTopLink href="/login">Log in</AuthTopLink>
        </>
      }
    >
      <AuthHeading title="Get started with LaunchPath" description="Choose how you’d like to use LaunchPath. You can sign up in under a minute." />

      <div className="space-y-3">
        <PathCard
          href="/register?type=talent"
          icon={GraduationCap}
          title="I’m looking for work"
          description="For graduates and early-career job seekers."
          points={['AI job matches', 'Interview practice', 'Free']}
        />
        <PathCard
          href="/register?type=client"
          icon={Building2}
          title="I’m hiring"
          description="For businesses hiring entry-level talent."
          points={['AI-drafted job posts', 'Ranked applicants', 'Video screening']}
        />
      </div>

      <AuthDivider>Already on LaunchPath?</AuthDivider>
      <Link href="/login" className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true })}>
        Log in
      </Link>
    </AuthLayout>
  );
}
