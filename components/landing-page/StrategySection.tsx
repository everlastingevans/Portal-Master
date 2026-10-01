import { Briefcase, GraduationCap, Rocket, Target } from "lucide-react";
import { Reveal } from "./Reveal";
import { Container, Cta, SectionHeading } from "./primitives";

const ITEMS = [
  {
    icon: GraduationCap,
    title: "Graduate matching",
    sub: "Vetted shortlists, ready to interview.",
    body: "We screen, assess and shortlist graduates from across South Africa, so you only meet people genuinely fit for the role and your team.",
  },
  {
    icon: Briefcase,
    title: "SME hiring toolkit",
    sub: "Hire well, even with a lean team.",
    body: "Job templates, structured interview kits and offer guidance that help small teams hire confidently without a full HR function.",
  },
  {
    icon: Target,
    title: "Practical skills assessment",
    sub: "See ability, not buzzwords.",
    body: "Short, role-relevant tasks reveal how candidates actually think and work. Fairer for graduates and more useful for SMEs.",
  },
  {
    icon: Rocket,
    title: "Onboarding and mentoring",
    sub: "Turn day one into a real career start.",
    body: "Onboarding frameworks and mentor pairings improve first-year retention and help graduates hit their stride faster.",
  },
];

export const StrategySection = () => (
  <section className="bg-canvas py-24 md:py-32">
    <Container>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Hiring and growth options"
              title="Support beyond the shortlist."
              description="Whether it’s your first hire, a graduate programme or an early team, we tailor support so you hire better and keep your people."
            />
            <div className="mt-8">
              <Cta href="/#contact" variant="outline-dark" arrow>
                Talk to us
              </Cta>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {ITEMS.map(({ icon: Icon, title, sub, body }, i) => (
            <Reveal key={title} delay={i * 80}>
              <article className="group h-full rounded-3xl border border-slate-200/80 bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_40px_-24px_rgba(10,27,61,0.35)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-brand-navy transition-colors duration-300 group-hover:bg-brand-navy group-hover:text-brand-lime">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-lg font-semibold text-brand-navy">{title}</h3>
                <p className="mt-1 text-[15px] font-medium text-slate-500">{sub}</p>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Container>
  </section>
);
