import { ArrowRight, MessagesSquare, ListChecks, ShieldCheck, UserCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { Container, Cta, MockAvatar, SectionHeading } from "./primitives";
import { TALENT_CATEGORIES } from "@/lib/content/talent-categories";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "A role calibrated with you",
    body: "We talk through the role, the must-haves and what would rule someone out, so the search starts from what you actually need.",
  },
  {
    icon: UserCheck,
    title: "3–5 screened candidates",
    body: "A short, considered shortlist for serviceable roles within five working days, instead of hundreds of unfiltered CVs.",
  },
  {
    icon: Wallet,
    title: "Nothing to pay upfront",
    body: "Submitting a vacancy and receiving your shortlist are free. A placement fee applies only when you hire.",
  },
  {
    icon: ShieldCheck,
    title: "Replacement guarantee",
    body: "If a hire doesn’t work out early on, we run a replacement search at no additional placement fee, subject to our terms.",
  },
];

const COLUMNS = [
  { title: "Shortlist", people: [{ n: "Thabo N", s: "Screened" }, { n: "Zanele P", s: "Screened" }] },
  { title: "Interviewing", people: [{ n: "Lerato M", s: "Thu 10:00" }, { n: "Sipho D", s: "Fri 14:00" }] },
  { title: "Offer", people: [{ n: "Ayanda K", s: "Offer made" }] },
];

function PipelinePreview() {
  return (
    <div className="relative rounded-[28px] bg-gradient-to-br from-slate-100 to-slate-50 p-3 ring-1 ring-slate-200/80 sm:p-4">
      <div className="rounded-[22px] bg-white shadow-[0_32px_64px_-32px_rgba(10,27,61,0.35)] ring-1 ring-slate-200/70">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[13px] font-semibold text-brand-navy">Junior Marketing Coordinator</p>
            <p className="text-[11px] text-slate-500">Johannesburg · Hybrid · 0–2 years</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">Shortlist sent</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {COLUMNS.map((col, ci) => (
            <div key={col.title} className="rounded-2xl bg-slate-50 p-2.5">
              <p className="flex items-center justify-between px-1 text-[11px] font-medium text-slate-500">
                {col.title}
                <span className="tabular-nums text-slate-400">{col.people.length}</span>
              </p>
              <ul className="mt-2.5 space-y-2">
                {col.people.map((p, pi) => (
                  <li key={p.n} className="rounded-xl bg-white p-2.5 shadow-[0_1px_2px_rgba(10,27,61,0.06)] ring-1 ring-slate-200/70">
                    <div className="flex items-center gap-2">
                      <MockAvatar name={p.n} tone={ci + pi} />
                      <span className="min-w-0 truncate text-[12px] font-medium text-brand-navy">{p.n}.</span>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">{p.s}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">Illustrative example of a hiring pipeline with LaunchPath.</p>
    </div>
  );
}

export const EmployersSection = () => (
  <section id="employers" className="scroll-mt-20 bg-canvas py-24 md:py-32">
    <Container>
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="LaunchPath Hire"
              title="Hire the right junior talent, without the weekend of CVs."
              description="A managed recruitment service for junior and early-career roles in Sales, Marketing, Business Operations, Technology and Finance. Hiring for something else? Tell us anyway and we’ll let you know if we can help."
            />
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Roles we hire for">
              {TALENT_CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/hire/${c.slug}`}
                    className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[14px] font-medium text-brand-navy ring-1 ring-inset ring-slate-200 transition-colors hover:ring-brand-navy/40"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={i * 70}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-navy shadow-[0_1px_2px_rgba(10,27,61,0.08)] ring-1 ring-slate-200">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold text-brand-navy">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{body}</p>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Cta href="/find-candidates" variant="navy" arrow track={{ cta: "find_candidates", location: "employers" }}>
                Find Candidates
              </Cta>
              <Cta href="/#pricing" variant="outline-dark" track={{ cta: "pricing", location: "employers" }}>
                See pricing
              </Cta>
            </div>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <PipelinePreview />
          {/* Recruiter callout */}
          <Link
            href="/#contact"
            data-track-cta="bulk_hiring"
            data-track-location="employers"
            className="group mt-5 flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-[0_8px_24px_-16px_rgba(10,27,61,0.3)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-lime text-brand-navy">
              <ListChecks className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-brand-navy">Hiring several people at once?</span>
              <span className="block text-sm text-slate-500">Intakes, multiple seats or recurring roles: let’s plan the search together.</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-navy" />
          </Link>
        </Reveal>
      </div>
    </Container>
  </section>
);
