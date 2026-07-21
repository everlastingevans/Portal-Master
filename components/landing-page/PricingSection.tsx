"use client";

import { 
  Check, 
  HelpCircle, 
  Sparkles, 
  Gem, 
  Zap, 
  ShieldCheck, 
  Plus, 
  Rocket,
  GraduationCap
} from "lucide-react";
import { Reveal } from "./Reveal";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "R20",
    period: "per month",
    description: "Ideal for early-stage startups and small businesses making their first key graduate hires.",
    features: [
      "1 Live Active Job Post at a time",
      "Instant top-vetted matching shortlist",
      "Access to standard screening tools",
      "Standard candidate pipeline tracker",
      "Email & Slack workspace support",
    ],
    highlight: false,
    badge: "For Startups",
    cta: "Start Free Trial"
  },
  {
    name: "Growth",
    price: "R4,999",
    period: "per month",
    description: "Designed for active SMEs building out a core team or structuring annual graduate programmes.",
    features: [
      "Up to 5 Active Job Posts simultaneously",
      "Smart priority candidate shortlists",
      "Listen to interactive audio & video answers",
      "Full CRM pipeline status integration",
      "Dedicated account team & live chat help",
      "Included first-year onboarding mentoring kit",
    ],
    highlight: true,
    badge: "Most Popular",
    cta: "Scale Your Hiring"
  },
  {
    name: "Scale",
    price: "Custom",
    period: "tailored pricing",
    description: "Built for larger corporates, BPOs, agencies, and high-volume placement partners across Africa.",
    features: [
      "Unlimited Job Posts & talent pipelines",
      "Dedicated custom sourcing pipelines",
      "Tailored employer branding portal pages",
      "Integration with existing ATS software",
      "Quarterly ROI and hiring velocity reports",
      "Unlimited API access & custom onboarding",
    ],
    highlight: false,
    badge: "Enterprise & BPOs",
    cta: "Contact Enterprise Sales"
  }
];

const addons = [
  { title: "Featured Jobs promotion", desc: "Push roles to the top of talent search queries & alerts for maximum reach." },
  { title: "Priority candidate shortlist", desc: "Access premium pre-screened talent pools with faster SLAs under 48 hours." },
  { title: "Dedicated active sourcing", desc: "Our recruitment experts actively scout and headhunt for niche tech skills." },
  { title: "Employer branding pages", desc: "Build tailored rich content portals highlighting your workplace culture." }
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="bg-white dark:bg-slate-950 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] space-y-16">
        
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-950/40 rounded-full border border-violet-100 dark:border-violet-900/60">
              <Gem className="w-4 h-4 text-[#5D3FD3]" />
              <span className="text-xs font-bold text-[#5D3FD3] dark:text-violet-300 uppercase tracking-wider font-mono">
                Subscription Plans &amp; Pricing
              </span>
            </div>
            <h2 className="text-[40px] font-bold leading-[1.1] text-foreground md:text-[52px]">
              Simple, SME-friendly monetization
            </h2>
            <p className="text-[16px] leading-relaxed text-foreground/70">
              No hidden broker fees or astronomical agency commission percentages. Choose a plan that suits your current scale, with additional modular add-ons and transparent Pay-Per-Hire support on successful hires.
            </p>
          </div>
        </Reveal>

        {/* Pricing Matrix */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((p, idx) => (
            <Reveal key={idx} delay={idx * 100} className="flex">
              <div className={`w-full rounded-3xl p-8 flex flex-col justify-between border relative overflow-hidden transition-all duration-300 ${
                p.highlight 
                  ? "border-[#5D3FD3] bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-slate-900 shadow-xl shadow-[#5D3FD3]/5 scale-100 md:scale-[1.03] z-10" 
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md"
              }`}>
                {p.highlight && (
                  <div className="absolute top-5 right-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5D3FD3] text-white text-xs font-extrabold rounded-full shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      {p.badge}
                    </span>
                  </div>
                )}
                {!p.highlight && (
                  <div className="absolute top-5 right-5">
                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-full">
                      {p.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">{p.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px] leading-relaxed">{p.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2 border-y border-slate-100 dark:border-slate-800">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{p.price}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/{p.period}</span>
                  </div>

                  <ul className="space-y-3.5 pt-2">
                    {p.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-350 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <Link
                    href={`/contact?plan=${p.name.toLowerCase()}`}
                    className={`w-full py-3 px-5 rounded-2xl font-bold text-center block text-sm transition-all cursor-pointer ${
                      p.highlight
                        ? "bg-[#5D3FD3] hover:bg-[#4d32bb] text-white shadow-lg shadow-[#5D3FD3]/20 hover:scale-[1.02]"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white hover:scale-[1.02]"
                    }`}
                  >
                    {p.cta}
                  </Link>
                  <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                    *Requires successful client validation check.
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Feature Addons Grid & Candidate Note */}
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto pt-10 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* Add-ons column */}
          <div className="lg:col-span-7 space-y-6">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
              <Plus className="w-5 h-5 text-[#5D3FD3]" />
              Modular Employer Add-Ons
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              {addons.map((add, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
                  <h5 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{add.title}</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{add.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate monetization and security */}
          <div className="lg:col-span-5 flex">
            <div className="w-full bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-900 border border-violet-100/60 dark:border-violet-900/40 p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 text-[#5D3FD3] text-xs font-bold rounded-full border border-violet-100 dark:border-violet-800 shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5 text-[#5D3FD3]" />
                  FOR GRADUATES &amp; CANDIDATES
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white font-heading">Keep job access free. Forever.</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  We believe no young professional should ever pay to access job matches. We charge employers to hire, not candidates to search. 
                </p>
                <div className="pt-2 border-t border-violet-100 dark:border-violet-900/50">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Future premium features (Optional)</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    CV revamp support, dedicated 1-on-1 interview training coaching, premium profile visibility boosts, and industry-accredited career guides.
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-400">
                  Secure POPIA-compliant data handling protocols active.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
