"use client";

import { useState } from "react";
import { 
  User, 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  Brain, 
  BarChart3, 
  SlidersHorizontal,
  ChevronRight,
  UploadCloud,
  FileText,
  Search,
  Check,
  Target,
  Trophy,
  HelpCircle,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import { Reveal } from "./Reveal";

export const PlatformVision = () => {
  const [activeTab, setActiveTab] = useState<"candidate" | "employer">("candidate");

  return (
    <section id="what-we-do" className="bg-slate-50 dark:bg-slate-900/40 px-6 py-24 md:py-32 border-y border-slate-100 dark:border-slate-800/60">
      <div className="mx-auto max-w-[1400px] space-y-16">
        
        {/* Section Heading */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-950/40 rounded-full border border-violet-100 dark:border-violet-900/60">
              <Cpu className="w-4 h-4 text-[#5D3FD3]" />
              <span className="text-xs font-bold text-[#5D3FD3] dark:text-violet-300 uppercase tracking-wider font-mono">
                LaunchPath Engine
              </span>
            </div>
            <h2 className="text-[40px] font-bold leading-[1.1] text-foreground md:text-[52px]">
              Platform Vision &amp; Product Features
            </h2>
            <p className="text-[16px] leading-relaxed text-foreground/70">
              Explore the advanced hiring infrastructure built specifically to close the gap between talented South African graduates and growing businesses.
            </p>
          </div>
        </Reveal>

        {/* Tab Switcher */}
        <Reveal delay={100}>
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <button
                onClick={() => setActiveTab("candidate")}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "candidate"
                    ? "bg-[#5D3FD3] text-white shadow-md shadow-[#5D3FD3]/15"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <User className="w-4 h-4" />
                Candidate Side Vision
              </button>
              <button
                onClick={() => setActiveTab("employer")}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "employer"
                    ? "bg-[#5D3FD3] text-white shadow-md shadow-[#5D3FD3]/15"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Employer Side Vision
              </button>
            </div>
          </div>
        </Reveal>

        {/* Dynamic Experience Tab Panels */}
        <div className="min-h-[400px]">
          {activeTab === "candidate" ? (
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Feature Details (Left Grid) */}
              <div className="lg:col-span-7 grid md:grid-cols-2 gap-6">
                
                {/* Item A */}
                <Reveal delay={120} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 bg-violet-100 dark:bg-violet-950/50 text-[#5D3FD3] rounded-2xl flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Profile Creation</h3>
                  <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Build a verification-ready profile with quick CV upload, LinkedIn integration, education, work experience, salary expectations, and remote/hybrid preferences.
                  </p>
                </Reveal>

                {/* Item B */}
                <Reveal delay={180} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Candidate Scoring</h3>
                  <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Our model evaluates skills relevance, profile completeness, communication quality, and employability readiness to generate tailored fit categories and improvement tips.
                  </p>
                </Reveal>

                {/* Item C */}
                <Reveal delay={240} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Job Matching Engine</h3>
                  <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    View recommended jobs in real-time with precise compatibility scores. Discover why you matched, skills gaps you need to fill, and pathways to success.
                  </p>
                </Reveal>

                {/* Item D */}
                <Reveal delay={300} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Career Development Tools</h3>
                  <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Access automated CV builders, AI-driven mock video interview simulators, salary benchmarking tools, and personalized learning path recommendations.
                  </p>
                </Reveal>

              </div>

              {/* Side Visual Showcase Mockup (Right Card) */}
              <div className="lg:col-span-5 flex">
                <Reveal delay={350} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100/30 dark:bg-violet-950/20 rounded-bl-full pointer-events-none" />
                  
                  <div className="space-y-6">
                    <div className="inline-flex px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full font-mono">
                      CANDIDATE DASHBOARD
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">Interactive Pipeline Trackers</h3>
                      <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Track your path from graduate to hired. View precise real-time statuses throughout the full recruitment pipeline:
                      </p>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      {[
                        { label: "Applied Jobs", desc: "Instantly submit credentials and verified code tests." },
                        { label: "Interview Stage", desc: "Schedule live calls or complete automated video responses." },
                        { label: "Shortlisted", desc: "Promoted to employers' high-priority candidate queues." },
                        { label: "Hired!", desc: "Matches secured with robust support & first-year mentoring." }
                      ].map((stage, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-[#5D3FD3] dark:text-violet-300 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{stage.label}</p>
                            <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-normal">{stage.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-between items-center">
                    <span className="text-[15px] font-semibold text-slate-500 dark:text-slate-400">
                      Primary group: Graduates, Bootcamp Learners, Junior Pros
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                </Reveal>
              </div>

            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Feature Details (Left Grid) */}
              <div className="lg:col-span-7 grid md:grid-cols-2 gap-6">
                
                {/* Item A */}
                <Reveal delay={120} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Employer Dashboard</h3>
                  <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Set up your business identity, select your operational industry, team size, core culture keywords, and specific regional/office hubs.
                  </p>
                </Reveal>

                {/* Item B */}
                <Reveal delay={180} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Job Creation Flow</h3>
                  <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Post roles in under a minute. Define role titles, skills prerequisites, salary bands, location styles (office, hybrid, remote), and the number of hires needed.
                  </p>
                </Reveal>

                {/* Item C */}
                <Reveal delay={240} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant Matching</h3>
                  <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Once live, our algorithms surface vetted candidates instantly based on verified skills fit, geographic alignment, immediate availability, and behavioral signals.
                  </p>
                </Reveal>

                {/* Item D */}
                <Reveal delay={300} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interactive Shortlists</h3>
                  <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Save top-fit profiles, trigger custom interviews, download fully generated CV briefs, message candidates directly, and reject wrong-fits with automated friendly notices.
                  </p>
                </Reveal>

              </div>

              {/* Side Visual Showcase Mockup (Right Card) */}
              <div className="lg:col-span-5 flex">
                <Reveal delay={350} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/30 dark:bg-indigo-950/20 rounded-bl-full pointer-events-none" />
                  
                  <div className="space-y-6">
                    <div className="inline-flex px-3 py-1 bg-[#5D3FD3]/10 text-[#5D3FD3] text-xs font-bold rounded-full font-mono">
                      EMPLOYER CRM &amp; METRICS
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">Hiring Pipeline &amp; Analytics</h3>
                      <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Keep track of applicants and monitor structural metrics via built-in performance analytics panels:
                      </p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Pipeline CRM Stages</p>
                        <p className="text-[15px] text-slate-800 dark:text-slate-200 font-medium">
                          New &rarr; Reviewed &rarr; Interviewing &rarr; Offer Sent &rarr; Hired!
                        </p>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Embedded Analytics Metrics</p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
                            <span className="block font-bold text-slate-800 dark:text-slate-200">Time to Hire</span>
                            <span className="text-slate-500">Average under 6 days</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
                            <span className="block font-bold text-slate-800 dark:text-slate-200">Conversion Rates</span>
                            <span className="text-slate-500">Industry-leading ratios</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
                            <span className="block font-bold text-slate-800 dark:text-slate-200">Applicants per Role</span>
                            <span className="text-slate-500">Curated shortlists of 3-5</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
                            <span className="block font-bold text-slate-800 dark:text-slate-200">Cost Per Hire</span>
                            <span className="text-slate-500">Built for lean SMEs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-between items-center">
                    <span className="text-[15px] font-semibold text-slate-500 dark:text-slate-400">
                      Primary group: SMEs, Startups, Scaleups, BPOs, Agencies
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                </Reveal>
              </div>

            </div>
          )}
        </div>

        {/* Core Product Engine: Matching Algorithm Section */}
        <Reveal delay={200}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 md:p-12 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#5D3FD3]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5D3FD3]/20 border border-[#5D3FD3]/30 text-violet-300 text-xs font-bold rounded-full font-mono">
                  <Cpu className="w-3.5 h-3.5" />
                  THE MATCHING ENGINE ALGORITHM
                </div>
                <h3 className="text-2xl md:text-3.5xl font-extrabold font-space-grotesk leading-tight tracking-tight text-white">
                  How our matching engine solves the hiring mismatch
                </h3>
                <p className="text-[15px] text-slate-300 leading-relaxed">
                  Traditional job boards rely on crude keyword filters. LaunchPath evaluates multiple multidimensional compatibility vectors to connect candidates with opportunities instantly and accurately.
                </p>
              </div>

              <div className="md:col-span-5 grid grid-cols-2 gap-3.5">
                {[
                  "Skills Overlap",
                  "Experience Relevance",
                  "Geography / Commute",
                  "Salary Alignment",
                  "Qualification Level",
                  "Industry Compatibility",
                  "Behavioral Signals",
                  "Employer Preferences"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[15px] font-bold text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
};
