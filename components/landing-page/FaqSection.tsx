"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "./Reveal";
import { Container, SectionHeading, cx } from "./primitives";

const FAQS = [
  {
    q: "How much does it cost to hire through LaunchPath?",
    a: "R1,999 per role, paid once. That covers posting the role, a review of your requirements, screening and matching, and a curated shortlist delivered by email. There’s no placement commission and no hidden costs.",
  },
  {
    q: "How quickly will I receive candidates?",
    a: "Once your role is live, we usually send a shortlist of candidates who fit within five working days.",
  },
  {
    q: "How are candidates vetted?",
    a: "Every candidate is screened by a real person, not just an algorithm. We look at skills, attitude, communication and readiness to work, alongside how well they match your requirements.",
  },
  {
    q: "What kind of candidates are on LaunchPath?",
    a: "Mainly graduates, bootcamp learners and junior professionals from across South Africa. We also work with university and training partners to reach new talent.",
  },
  {
    q: "Is LaunchPath free for job seekers?",
    a: "Yes. Creating a profile, getting matched to jobs, practising interviews and applying are all free for candidates.",
  },
  {
    q: "I’m a recruiter or agency. Can I use LaunchPath?",
    a: "Yes. Get in touch through the form below and tell us about the roles you’re filling and the volume you need, and we’ll set things up with you.",
  },
];

export const FaqSection = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-white pb-24 md:pb-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <SectionHeading eyebrow="FAQ" title="Questions, answered." description="Anything else? Our team is a message away." />
          </Reveal>

          <Reveal delay={80} className="lg:col-span-8">
            <ul className="divide-y divide-slate-200 border-y border-slate-200">
              {FAQS.map((item, i) => {
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
