"use client";

import { Check, ShieldCheck, ArrowRight, Zap, Mail, Users } from "lucide-react";
import { Reveal } from "./Reveal";
import Link from "next/link";

export const EmployerPricingSection = () => {
  const includedItems = [
    "Role posting on LaunchPath",
    "Review of the employer's hiring requirements",
    "Candidate screening and matching",
    "A curated shortlist of relevant candidates",
    "Candidate profiles delivered directly by email",
    "No need to scan through hundreds of unrelated CVs"
  ];

  return (
    <section id="employer-pricing" className="bg-[#0A1B3D] relative overflow-hidden px-6 py-24 md:py-32 border-y border-slate-900">
      {/* Background glow effects to match Hero design */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(189,245,0,0.03),transparent_50%)]" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-blue-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1400px] relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#bdf500]/10 rounded-full border border-[#bdf500]/20">
                <ShieldCheck className="w-4 h-4 text-[#bdf500]" />
                <span className="text-[11px] font-bold text-[#bdf500] uppercase tracking-wider font-mono">
                  Transparent Flat-Rate Sourcing
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
                Post a role and access vetted talent for R1,999
              </h2>
            </Reveal>

            <Reveal delay={120}>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Tell us who you need. LaunchPath will review your requirements, match the role with relevant candidates and send you a curated shortlist of vetted talent by email.
              </p>
            </Reveal>

            {/* Quick trust badges */}
            <Reveal delay={180}>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
                  <Zap className="w-4 h-4 text-[#bdf500]" />
                  <span>No Success Fees</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
                  <Mail className="w-4 h-4 text-[#bdf500]" />
                  <span>Shortlists to your Email</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
                  <Users className="w-4 h-4 text-[#bdf500]" />
                  <span>Saves Hours of Sifting</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Premium Monolithic Pricing Card */}
          <div className="lg:col-span-5 w-full">
            <Reveal delay={200}>
              <div className="bg-[#031535]/80 backdrop-blur-md rounded-3xl p-8 border border-[#bdf500]/20 shadow-2xl relative">
                {/* Visual accent top edge */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#bdf500]/60 to-transparent rounded-t-3xl" />

                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">LaunchPath Flat-Rate</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">R1,999</span>
                      <span className="text-sm text-slate-300 font-semibold">per role posted</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Once-off payment. No placements commission. No hidden costs.</p>
                  </div>

                  <div className="h-px bg-slate-800/80" />

                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 font-mono">Everything Included</h4>
                    <ul className="space-y-3">
                      {includedItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-5 h-5 bg-[#bdf500]/10 text-[#bdf500] rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">✓</span>
                          <span className="text-sm text-slate-300 leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Link
                      href="/employer/new"
                      className="w-full bg-[#A6F23C] hover:bg-[#aee000] text-slate-950 font-black py-4 px-6 rounded-full text-center block text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#bdf500]/10 flex items-center justify-center gap-2"
                    >
                      <span>Post a Role</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
};
