import { Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { Container, Cta, SectionHeading, cx } from "./primitives";

const PLANS = [
  {
    name: "For employers",
    price: "R1,999",
    unit: "per role",
    note: "Once-off. No placement commission. No hidden costs.",
    features: [
      "Your role posted on LaunchPath",
      "A review of your hiring requirements",
      "Candidate screening and matching",
      "A curated shortlist of relevant candidates",
      "Candidate profiles delivered by email",
      "No scanning through hundreds of unrelated CVs",
    ],
    cta: { label: "Post a role", href: "/register?type=client" },
    featured: true,
  },
  {
    name: "For job seekers",
    price: "Free",
    unit: "always",
    note: "Everything you need to get seen and get hired.",
    features: [
      "Profile built from your CV or LinkedIn",
      "Jobs ranked by how well you fit",
      "Interview practice with AI feedback",
      "Application tracking and updates",
    ],
    cta: { label: "Create your profile", href: "/register?type=talent" },
    featured: false,
  },
];

export const EmployerPricingSection = () => (
  <section id="pricing" className="relative scroll-mt-20 overflow-hidden bg-brand-navy py-24 md:py-32">
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(166,242,60,0.12),transparent_65%)]" />
    </div>

    <Container className="relative">
      <Reveal>
        <SectionHeading
          align="center"
          tone="dark"
          eyebrow="Pricing"
          title="Simple, flat pricing built for SMEs."
          description="Tell us who you need. We review your requirements, match the role with relevant candidates and email you a curated shortlist of vetted talent."
        />
      </Reveal>

      <div className="mx-auto mt-16 grid max-w-5xl gap-5 lg:grid-cols-[1.15fr_1fr]">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 100}>
            <div
              className={cx(
                "relative flex h-full flex-col rounded-[28px] p-8 sm:p-10",
                plan.featured ? "bg-white text-brand-navy shadow-[0_40px_80px_-32px_rgba(0,0,0,0.6)]" : "bg-white/[0.04] text-white ring-1 ring-inset ring-white/10",
              )}
            >
              <p className={cx("text-[15px] font-medium", plan.featured ? "text-slate-500" : "text-white/60")}>{plan.name}</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight">{plan.price}</span>
                <span className={cx("text-[15px]", plan.featured ? "text-slate-500" : "text-white/60")}>{plan.unit}</span>
              </p>
              <p className={cx("mt-3 text-sm", plan.featured ? "text-slate-500" : "text-white/60")}>{plan.note}</p>

              <ul className={cx("mt-8 space-y-3.5 border-t pt-8", plan.featured ? "border-slate-100" : "border-white/10")}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px]">
                    <span
                      className={cx(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        plan.featured ? "bg-brand-navy text-brand-lime" : "bg-white/10 text-brand-lime",
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className={plan.featured ? "text-slate-700" : "text-white/80"}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-10">
                <Cta href={plan.cta.href} variant={plan.featured ? "navy" : "outline-light"} arrow className="w-full">
                  {plan.cta.label}
                </Cta>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-white/50">
        Hiring at volume or recruiting for clients?{" "}
        <a href="#contact" className="font-medium text-brand-lime hover:text-brand-lime-soft">
          Let’s talk
        </a>
      </p>
    </Container>
  </section>
);
