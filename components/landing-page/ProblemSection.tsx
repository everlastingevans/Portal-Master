import { Building2, GraduationCap, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";
import { Container, Eyebrow } from "./primitives";

const SIDES = [
  {
    icon: Building2,
    who: "For employers",
    line: "Hundreds of CVs, hardly any fit.",
    body: "Weekends lost to filtering, interviews that go nowhere, and roles that stay open for another month.",
  },
  {
    icon: GraduationCap,
    who: "For graduates",
    line: "Eighty-seven applications, three replies.",
    body: "Talented young people who never get seen, and start to believe the problem is them.",
  },
  {
    icon: Sparkles,
    who: "What LaunchPath does",
    line: "Fix the middle.",
    body: "Vet candidates properly, match them to real requirements, and put the right shortlist in front of the right employer.",
    highlight: true,
  },
];

export const ProblemSection = () => (
  <section id="about-us" className="scroll-mt-20 bg-canvas py-24 md:py-32">
    <Container>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <Eyebrow>Why we exist</Eyebrow>
          <h2 className="mt-5 text-[34px] font-semibold leading-[1.1] tracking-tight text-brand-navy sm:text-[44px] lg:text-[52px]">
            The hiring problem nobody is solving properly.
          </h2>
        </Reveal>

        <Reveal delay={100} className="lg:col-span-7 lg:pt-14">
          <div className="space-y-5 text-[17px] leading-relaxed text-slate-600">
            <p>
              You post a role. Four hundred CVs land in your inbox by Friday. Most are not relevant. You spend the weekend filtering. You interview five people. None of them are quite
              right. The role stays open another month.
            </p>
            <p>
              Meanwhile, somewhere in Soweto, a graduate has applied to her eighty-seventh job. She has heard back from three. She is starting to wonder if the problem is her.
            </p>
            <p className="text-2xl font-semibold tracking-tight text-brand-navy">It isn’t.</p>
            <p>
              The talent exists. The hiring system is just broken in the middle. Companies cannot find the right people quickly. Candidates cannot get seen at all. Everyone loses.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {SIDES.map(({ icon: Icon, who, line, body, highlight }, i) => (
          <Reveal key={who} delay={i * 90}>
            <div
              className={
                highlight
                  ? "h-full rounded-3xl bg-brand-navy p-7 text-white shadow-[0_24px_48px_-24px_rgba(10,27,61,0.6)]"
                  : "h-full rounded-3xl border border-slate-200/80 bg-white p-7"
              }
            >
              <span
                className={
                  highlight
                    ? "flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime text-brand-navy"
                    : "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-brand-navy"
                }
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className={highlight ? "mt-6 text-[13px] font-medium text-brand-lime" : "mt-6 text-[13px] font-medium text-slate-500"}>{who}</p>
              <p className={highlight ? "mt-1.5 text-xl font-semibold text-white" : "mt-1.5 text-xl font-semibold text-brand-navy"}>{line}</p>
              <p className={highlight ? "mt-3 text-[15px] leading-relaxed text-white/70" : "mt-3 text-[15px] leading-relaxed text-slate-600"}>{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  </section>
);
