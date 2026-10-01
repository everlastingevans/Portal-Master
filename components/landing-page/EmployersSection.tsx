import { ArrowRight, CalendarClock, FileText, ListChecks, Users, Video } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { Container, Cta, MockAvatar, SectionHeading } from "./primitives";

const FEATURES = [
  {
    icon: FileText,
    title: "Post a role in minutes",
    body: "Define the title, skills, salary band, location and work style. Our assistant drafts the post for you.",
  },
  {
    icon: Users,
    title: "Ranked, pre-screened applicants",
    body: "Candidates are surfaced by verified skills fit, location and availability, with the reasons they matched.",
  },
  {
    icon: Video,
    title: "See ability, not buzzwords",
    body: "Review CVs, readiness scores and recorded video answers before you spend time on a call.",
  },
  {
    icon: CalendarClock,
    title: "Interviews without the admin",
    body: "Propose times and candidates are notified by email, SMS and WhatsApp automatically.",
  },
];

const COLUMNS = [
  { title: "New", count: 12, people: [{ n: "Thabo N", s: 91 }, { n: "Zanele P", s: 84 }] },
  { title: "Shortlisted", count: 4, people: [{ n: "Lerato M", s: 94 }, { n: "Sipho D", s: 89 }] },
  { title: "Interviewing", count: 2, people: [{ n: "Ayanda K", s: 86 }] },
];

function PipelinePreview() {
  return (
    <div className="relative rounded-[28px] bg-gradient-to-br from-slate-100 to-slate-50 p-3 ring-1 ring-slate-200/80 sm:p-4">
      <div className="rounded-[22px] bg-white shadow-[0_32px_64px_-32px_rgba(10,27,61,0.35)] ring-1 ring-slate-200/70">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[13px] font-semibold text-brand-navy">Junior Data Analyst</p>
            <p className="text-[11px] text-slate-500">Johannesburg · Hybrid · R14k – R18k</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">Live</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {COLUMNS.map((col, ci) => (
            <div key={col.title} className="rounded-2xl bg-slate-50 p-2.5">
              <p className="flex items-center justify-between px-1 text-[11px] font-medium text-slate-500">
                {col.title}
                <span className="tabular-nums text-slate-400">{col.count}</span>
              </p>
              <ul className="mt-2.5 space-y-2">
                {col.people.map((p, pi) => (
                  <li key={p.n} className="rounded-xl bg-white p-2.5 shadow-[0_1px_2px_rgba(10,27,61,0.06)] ring-1 ring-slate-200/70">
                    <div className="flex items-center gap-2">
                      <MockAvatar name={p.n} tone={ci + pi} />
                      <span className="min-w-0 truncate text-[12px] font-medium text-brand-navy">{p.n}.</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#5E8C14]" style={{ width: `${p.s}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] tabular-nums text-slate-500">{p.s}% match</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">Illustrative preview of the employer hiring pipeline.</p>
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
              eyebrow="For employers and recruiters"
              title="Hire the right junior talent, without the weekend of CVs."
              description="From your first hire to a full graduate programme, LaunchPath gives lean teams a hiring pipeline that does the filtering for them."
            />
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
              <Cta href="/register?type=client" variant="navy" arrow>
                Start hiring
              </Cta>
              <Cta href="/#pricing" variant="outline-dark">
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
            className="group mt-5 flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-[0_8px_24px_-16px_rgba(10,27,61,0.3)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-lime text-brand-navy">
              <ListChecks className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-brand-navy">Recruiter, agency or BPO?</span>
              <span className="block text-sm text-slate-500">Source vetted early-career candidates for your clients. Let’s talk volume.</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-navy" />
          </Link>
        </Reveal>
      </div>
    </Container>
  </section>
);
