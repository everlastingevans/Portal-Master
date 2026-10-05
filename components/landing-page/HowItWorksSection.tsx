import { Check, ClipboardList, Handshake, UserCheck } from "lucide-react";
import { Reveal } from "./Reveal";
import { Container, Cta, SectionHeading } from "./primitives";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us who you need",
    body: "Share the role in a short form. It’s free and you don’t need an account. We’ll call you to calibrate what good looks like for your team.",
  },
  {
    icon: UserCheck,
    title: "Meet your shortlist",
    body: "Within five working days for serviceable roles, we send you 3–5 screened candidates who fit the brief. You choose who to interview.",
  },
  {
    icon: Handshake,
    title: "Hire",
    body: "Make your offer. You only pay a placement fee once someone starts, and every placement is backed by our replacement guarantee.",
  },
];

const SCREENING = [
  "Role-relevant skills",
  "Communication",
  "Attitude and readiness to work",
  "Experience relevance",
  "Location and commute",
  "Salary expectations",
  "Availability to start",
  "Your must-haves",
];

export const HowItWorksSection = () => (
  <section id="how-it-works" className="scroll-mt-20 bg-white py-24 md:py-32">
    <Container>
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Three steps to your next junior hire."
            description="Built for South African employers hiring for junior and early-career roles, typically 0–3 years’ experience. We do the searching and screening; you meet the people worth meeting."
          />
        </Reveal>
        <Reveal delay={80} className="shrink-0">
          <Cta href="/find-candidates" variant="navy" arrow track={{ cta: "find_candidates", location: "how_it_works" }}>
            Find Candidates
          </Cta>
        </Reveal>
      </div>

      <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
        {/* Connector line on desktop */}
        <span aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 md:block" />
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <Reveal as="li" key={title} delay={i * 110} className="relative">
            <div className="flex items-center gap-4">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-brand-lime shadow-[0_0_0_8px_white]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium tabular-nums text-slate-400">Step {i + 1}</span>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-brand-navy">{title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{body}</p>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={120}>
        <div className="relative mt-20 overflow-hidden rounded-[32px] bg-brand-navy p-8 sm:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(166,242,60,0.18),transparent_65%)]" />
          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <h3 className="text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[34px]">Screened by people, for your role.</h3>
              <p className="mt-4 text-[16px] leading-relaxed text-white/70">
                Every candidate on your shortlist has been screened by the LaunchPath team against the brief we agreed with you, not just filtered by keywords.
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
              {SCREENING.map((f) => (
                <li key={f} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3.5 text-[15px] text-white/90 ring-1 ring-inset ring-white/[0.08]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </Container>
  </section>
);
