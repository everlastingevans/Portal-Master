import type { Metadata } from "next";
import Link from "next/link";
import { Check, ClipboardList, Handshake, ShieldCheck, UserCheck } from "lucide-react";
import { Header } from "@/components/landing-page/Header";
import { EmployerAnalytics } from "@/components/landing-page/EmployerAnalytics";
import { Container, Eyebrow } from "@/components/landing-page/primitives";
import { VacancyForm } from "@/components/hire/VacancyForm";
import { getHireTerms } from "@/lib/hire/settings";
import { formatRand, formatRate } from "@/lib/hire/terms";
import { ROLE_CATEGORIES } from "@/lib/hire/vacancy";

// Reads ?category= to preselect the role category, so this renders per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find Candidates | LaunchPath",
  description: "Submit your vacancy for free. We’ll send you 3–5 screened junior candidates within five working days. You only pay if you hire.",
  // Prefill query strings (?category=, ?role=) all point at one canonical page
  alternates: { canonical: "/find-candidates" },
};

const STEPS = [
  { icon: ClipboardList, title: "Tell us who you need", body: "Submit this form. We’ll call to calibrate the role with you." },
  { icon: UserCheck, title: "Meet your shortlist", body: "3–5 screened candidates, targeted within five working days for serviceable roles." },
  { icon: Handshake, title: "Hire", body: "Pay a placement fee only when you hire." },
];

export default async function FindCandidatesPage({ searchParams }: { searchParams: { category?: string; role?: string } }) {
  // Role title prefilled from a role page link; plain text, length-limited, still editable and validated on submit
  const initialRoleTitle = typeof searchParams.role === "string" ? searchParams.role.replace(/[^A-Za-z0-9 &/(),.'-]/g, "").slice(0, 120) : undefined;
  const terms = await getHireTerms();

  return (
    <div className="min-h-screen bg-canvas font-sans text-slate-600 antialiased">
      <EmployerAnalytics page="find_candidates" />
      <Header />

      <div className="relative overflow-hidden bg-brand-navy pb-40 pt-32 sm:pt-36">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(166,242,60,0.14),transparent_62%)]" />
        <Container className="relative">
          <Eyebrow tone="dark">LaunchPath Hire</Eyebrow>
          <h1 className="mt-5 max-w-3xl text-[36px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[48px]">Find great junior talent for your team.</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/70">
            Tell us who you’re hiring. It’s free, there’s no account to create and no payment details to enter. You only pay if you hire.
          </p>
        </Container>
      </div>

      <main>
        <Container className="relative -mt-28 pb-24">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-8">
              <VacancyForm
                initialCategory={ROLE_CATEGORIES.some((c) => c.value === searchParams.category) ? searchParams.category : undefined}
                initialRoleTitle={initialRoleTitle}
              />
            </div>

            <aside className="space-y-5 lg:col-span-4" aria-label="How LaunchPath Hire works">
              <div className="rounded-[28px] bg-white p-7 ring-1 ring-slate-200/70">
                <p className="text-[15px] font-semibold text-brand-navy">How it works</p>
                <ol className="mt-5 space-y-5">
                  {STEPS.map(({ icon: Icon, title, body }) => (
                    <li key={title} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-lime">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold text-brand-navy">{title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-[28px] bg-white p-7 ring-1 ring-slate-200/70">
                <p className="text-[15px] font-semibold text-brand-navy">What it costs</p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                  {[
                    "R0 upfront. Free to submit and to receive your shortlist.",
                    `On a successful hire: ${formatRate(terms.feeRateBps)} of annual cost to company.`,
                    `Minimum ${formatRand(terms.feeMin)}, maximum ${formatRand(terms.feeMax)}.`,
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5E8C14]" strokeWidth={3} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] bg-brand-navy p-7 text-white/75">
                <p className="flex items-center gap-2 text-[15px] font-semibold text-white">
                  <ShieldCheck className="h-5 w-5 text-brand-lime" /> {terms.guaranteeDays}-day replacement guarantee
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  If your hire leaves voluntarily, or is legitimately dismissed for performance, within {terms.guaranteeDays} days, we’ll run one replacement search at no additional
                  placement fee. Subject to our final employer terms.
                </p>
              </div>

              <p className="px-2 text-sm text-slate-500">
                Questions first?{" "}
                <Link href="/#faq" className="font-medium text-brand-navy underline underline-offset-2">
                  Read the FAQs
                </Link>{" "}
                or{" "}
                <Link href="/#contact" className="font-medium text-brand-navy underline underline-offset-2">
                  contact us
                </Link>
                .
              </p>
            </aside>
          </div>
        </Container>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <Container className="flex flex-col gap-3 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LaunchPath. All rights reserved.</p>
          <p>We process personal information in line with POPIA.</p>
        </Container>
      </footer>
    </div>
  );
}
