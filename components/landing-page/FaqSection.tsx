"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "./Reveal";
import { HireTerms, formatRand, formatRate } from "@/lib/hire/terms";
import { Container, SectionHeading, cx } from "./primitives";

function buildFaqs(t: HireTerms) {
  return [
    {
      q: "Is it really free to submit a vacancy?",
      a: "Yes. Submitting a vacancy, calibrating the role with us and receiving your shortlist are all free. You don’t need to create an account or enter payment details.",
    },
    {
      q: "When do I pay, and how much?",
      a: `Only when you make a successful hire. The placement fee is ${formatRate(t.feeRateBps)} of the hire’s annual cost to company, with a minimum of ${formatRand(t.feeMin)} and a maximum of ${formatRand(t.feeMax)}. If you don’t hire, you don’t pay.`,
    },
    {
      q: "How quickly will I receive candidates?",
      a: "For serviceable roles, our target is a shortlist of 3–5 screened candidates within five working days of calibrating the role with you. If a role is harder to fill, we’ll tell you upfront and agree a realistic timeline.",
    },
    {
      q: "How are candidates screened?",
      a: "The LaunchPath team screens every shortlisted candidate against the brief we agree with you, looking at role-relevant skills, communication, attitude, readiness to work, location and salary expectations.",
    },
    {
      q: "What does the replacement guarantee cover?",
      a: `If your hire leaves voluntarily, or is legitimately dismissed for performance, within ${t.guaranteeDays} days of starting, we’ll run one replacement search at no additional placement fee. The guarantee is subject to our final employer terms.`,
    },
    {
      q: "What kind of roles do you recruit for?",
      a: "Junior and early-career roles, typically 0–3 years’ experience, across Sales, Marketing, Business Operations, Technology and Finance in South Africa. If your role is outside these areas, submit it anyway and we’ll let you know whether we can help.",
    },
    {
      q: "Can you help us hire several people at once?",
      a: "Yes. If you’re hiring for multiple seats, an intake or recurring roles, submit one vacancy or get in touch through the form below and we’ll plan the search with you.",
    },
    {
      q: "Do candidates pay anything?",
      a: "No. Candidates never pay to create a profile, be considered for a role or be placed.",
    },
  ];
}

export const FaqSection = ({ terms }: { terms: HireTerms }) => {
  const [open, setOpen] = useState<number | null>(0);
  const faqs = buildFaqs(terms);

  return (
    <section id="faq" className="scroll-mt-20 bg-white pb-24 md:pb-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <SectionHeading eyebrow="FAQ" title="Questions, answered." description="Anything else? Our team is a message away." />
          </Reveal>

          <Reveal delay={80} className="lg:col-span-8">
            <ul className="divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map((item, i) => {
                const isOpen = open === i;
                return (
                  <li key={item.q}>
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-${i}`}
                        className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left text-[17px] font-medium text-brand-navy transition-colors hover:text-brand-navy/80"
                      >
                        {item.q}
                        <span
                          className={cx(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition-all duration-300",
                            isOpen ? "rotate-45 bg-brand-navy text-brand-lime ring-brand-navy" : "text-slate-500 ring-slate-200",
                          )}
                        >
                          <Plus className="h-4 w-4" />
                        </span>
                      </button>
                    </h3>
                    <div id={`faq-${i}`} className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                      <div className="overflow-hidden">
                        <p className="max-w-2xl pb-6 text-[16px] leading-relaxed text-slate-600">{item.a}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
};
