import { Check, ShieldCheck, Target, Wallet } from "lucide-react";
import { Reveal } from "./Reveal";
import { Container, Cta, SectionHeading } from "./primitives";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "We vet",
    body: "Every candidate is screened by a real person, not just an algorithm. We check skills, attitude, communication and readiness to work.",
  },
  {
    icon: Target,
    title: "We match",
    body: "You tell us what you actually need. We send a shortlist of candidates who fit, usually within five working days.",
  },
  {
    icon: Wallet,
    title: "We make it affordable",
    body: "Our pricing is built for SMEs, not corporate recruitment budgets. One flat fee per role, no placement commission.",
  },
];

const FACTORS = [
  "Skills overlap",
  "Experience relevance",
  "Geography and commute",
  "Salary alignment",
  "Qualification level",
  "Industry fit",
  "Behavioural signals",
  "Employer preferences",
];

export const HowItWorksSection = () => (
  <section id="how-it-works" className="scroll-mt-20 bg-white py-24 md:py-32">
    <Container>
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="A simpler way to hire junior talent."
            description="Built for South African employers who need to hire well without burning weeks doing it. We do three things, and we do them properly."
          />
        </Reveal>
        <Reveal delay={80} className="shrink-0">
          <Cta href="/register?type=client" variant="navy" arrow>
            Post a role
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
              <span className="text-sm font-medium tabular-nums text-slate-400">0{i + 1}</span>
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
              <h3 className="text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[34px]">Matching that goes beyond keywords.</h3>
              <p className="mt-4 text-[16px] leading-relaxed text-white/70">
                Traditional job boards rely on crude keyword filters. LaunchPath weighs several signals together to connect the right candidate to the right role.
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
              {FACTORS.map((f) => (
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
