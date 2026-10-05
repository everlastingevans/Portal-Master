import { Check } from "lucide-react";
import { HireTerms, calculatePlacementFee, formatRand, formatRate } from "@/lib/hire/terms";
import { Reveal } from "./Reveal";
import { Container, Cta, SectionHeading, cx } from "./primitives";

// Worked example shown under the price (annual cost to company, ZAR)
const EXAMPLE_CTC = 180_000;

export const EmployerPricingSection = ({ terms }: { terms: HireTerms }) => {
  const exampleFee = calculatePlacementFee(EXAMPLE_CTC, terms);

  const plans = [
    {
      name: "LaunchPath Hire · for employers",
      price: "R0",
      unit: "upfront",
      note: `Then ${formatRate(terms.feeRateBps)} of the hire’s annual cost to company, only when you hire. Minimum ${formatRand(terms.feeMin)}, maximum ${formatRand(terms.feeMax)}.`,
      features: [
        "Free vacancy submission, no account needed",
        "A call to calibrate the role with you",
        "Candidates screened by the LaunchPath team",
        "3–5 screened candidates, targeted within five working days for serviceable roles",
        "No charge if you don’t hire",
        `${terms.guaranteeDays}-day replacement guarantee`,
      ],
      cta: { label: "Find Candidates", href: "/find-candidates", track: "find_candidates" },
      featured: true,
    },
    {
      name: "For job seekers",
      price: "Free",
      unit: "always",
      note: "Candidates never pay to be considered or placed.",
      features: [
        "Profile built from your CV or LinkedIn",
        "Considered for roles that fit your skills",
        "Interview practice with feedback",
        "Application tracking and updates",
      ],
      cta: { label: "Create your profile", href: "/register?type=talent", track: "candidate_signup" },
      featured: false,
    },
  ];

  return (
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
            title="You only pay if you hire."
            description="There’s no charge to submit a vacancy or to receive your shortlist. A placement fee applies only when you make a successful hire."
          />
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-5xl gap-5 lg:grid-cols-[1.15fr_1fr]">
          {plans.map((plan, i) => (
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
                <p className={cx("mt-3 text-sm leading-relaxed", plan.featured ? "text-slate-600" : "text-white/60")}>{plan.note}</p>
                {plan.featured && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-[13px] leading-relaxed text-slate-600 ring-1 ring-inset ring-slate-200/80">
                    Example: hire someone on {formatRand(EXAMPLE_CTC)} a year and the placement fee is {formatRand(exampleFee)}.
                  </p>
                )}

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
                  <Cta
                    href={plan.cta.href}
                    variant={plan.featured ? "navy" : "outline-light"}
                    arrow
                    className="w-full"
                    track={{ cta: plan.cta.track, location: "pricing" }}
                  >
                    {plan.cta.label}
                  </Cta>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div id="guarantee" className="mx-auto mt-10 max-w-3xl scroll-mt-24 rounded-2xl bg-white/[0.04] p-6 text-sm leading-relaxed text-white/70 ring-1 ring-inset ring-white/10 sm:p-8">
          <p className="text-[15px] font-semibold text-white">The {terms.guaranteeDays}-day replacement guarantee</p>
          <p className="mt-2">
            If your hire leaves voluntarily, or is legitimately dismissed for performance, within {terms.guaranteeDays} days of starting, we’ll run one replacement search at no
            additional placement fee. The guarantee is subject to our final employer terms, which we’ll share before you hire.
          </p>
        </div>

        <p className="mt-10 text-center text-sm text-white/50">
          Hiring several people at once?{" "}
          <a href="#contact" data-track-cta="bulk_hiring" data-track-location="pricing" className="font-medium text-brand-lime hover:text-brand-lime-soft">
            Let’s talk
          </a>
        </p>
      </Container>
    </section>
  );
};
