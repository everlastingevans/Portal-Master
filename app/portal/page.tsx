"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, User, Building2, } from "lucide-react";
import LaunchPathLogo from "../../assets/logo/launchpath2.png"; 




import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Portal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close menu drawer when navigation path alters
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock scrolling view when mobile overlay menu framework is activated
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* LOGO: Standardized with Next.js Image optimization and locked to z-50 */}
        <div className="relative z-50 flex items-center">
          <Link href="/" className="group flex items-center" aria-label="LaunchPath home">
            <div className="relative h-[38px] sm:h-[44px] w-auto transition-all duration-300 group-hover:scale-[1.02]">
              <Image 
                src={LaunchPathLogo} 
                alt="LaunchPath Logo" 
                height={44} 
                priority 
                className="h-full w-auto object-contain transition-all duration-300 dark:brightness-110 dark:contrast-110" 
              />
            </div>
          </Link>
        </div>

          {/* DESKTOP CONTENT ACTION PANELS */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              Portal Log In
            </Link>
            <Link
              href="/register"
              className="relative overflow-hidden rounded-xl bg-[#7145FF] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5b32e6] hover:shadow-lg hover:shadow-purple-500/20 active:translate-y-0"
            >
              Create Account
            </Link>
          </nav>

          {/* MOBILE LAYOUT TRIGGER BUTTON SYSTEM */}
          <div className="relative z-50 flex sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/60 bg-slate-50/50 p-2 text-slate-700 transition-all focus:outline-none dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-300"
              aria-label={isOpen ? "Close configuration menu" : "Open navigation option layout menu"}
            >
              <span 
                className={`h-0.5 w-5 rounded-full transition-all duration-300 ${
                  isOpen ? "translate-y-2 rotate-45 bg-slate-900 dark:bg-slate-50" : "bg-slate-600 dark:bg-slate-400"
                }`} 
              />
              <span 
                className={`h-0.5 w-5 rounded-full transition-all duration-300 ${
                  isOpen ? "opacity-0" : "bg-slate-600 dark:bg-slate-400"
                }`} 
              />
              <span 
                className={`h-0.5 w-5 rounded-full transition-all duration-300 ${
                  isOpen ? "-translate-y-2 -rotate-45 bg-slate-900 dark:bg-slate-50" : "bg-slate-600 dark:bg-slate-400"
                }`} 
              />
            </button>
          </div>

          {/* MOBILE INTERACTIVE FULL-SCREEN OVERLAY ACCORDION */}
          <div 
            className={`fixed inset-0 z-40 bg-white/98 backdrop-blur-lg transition-all duration-300 dark:bg-slate-950/98 sm:hidden ${
              isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="flex h-full flex-col justify-between px-6 py-24">
              {/* Context Navigation Target Interlinks Area Placeholder */}
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                  Account Access
                </span>
                <Link 
                  href="/login"
                  className="text-2xl font-bold text-slate-800 transition-colors hover:text-[#7145FF] dark:text-slate-100"
                >
                  Portal Log In
                </Link>
              </div>

              {/* Mobile Bottom Focus Action Item Callout block */}
              <div className="flex flex-col gap-4">
                <Link 
                  href="/register" 
                  className="w-full rounded-xl bg-[#7145FF] py-4 text-center text-md font-bold text-white shadow-xl shadow-purple-500/10 active:scale-[0.99] transition-transform"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Hero Header Section */}
      <main className="flex-grow flex flex-col items-center justify-center py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 dark:bg-violet-950/40 rounded-full border border-violet-100 dark:border-violet-900/60 mb-2">
              <Sparkles className="w-4 h-4 text-[#7145FF]" />
              <span className="text-xs font-bold text-[#7145FF] dark:text-violet-300">
                LaunchPath Placement Ecosystem
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.15] tracking-tight">
              Access Your <span className="text-[#7145FF] bg-gradient-to-r from-[#7145FF] to-[#b395ff] bg-clip-text text-transparent">LaunchPath Portal</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Verify credentials, track opportunities, and automate high-velocity placements. Select your portal gateway below to sign in or register.
            </p>
          </div>

          {/* Portal Gateways Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
            
            {/* Gateway 1: Candidate Portal */}
            <div className="group bg-white dark:bg-slate-900 border-2 border-slate-250 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:border-[#7145FF] dark:hover:border-[#7145FF]/80 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:shadow-xl hover:shadow-[#7145FF]/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7145FF]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-violet-100 dark:bg-violet-955/30 text-[#7145FF] dark:text-violet-300 rounded-2xl flex items-center justify-center font-bold text-lg border border-violet-200 dark:border-violet-900/60 shadow-inner">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Talent Portal</h2>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">For Developers & Job Seekers</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Unlock dynamic role recommendations, perform real-time AI mock readiness simulators to build credentials, and coordinate placement pipelines in one screen.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
                      <strong>AI Fit Scores:</strong> Matched job opportunities based on credentials.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
                      <strong>Interactive Sandbox:</strong> Test and verify readiness via timed interviews.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
                      <strong>In-App Mailbox:</strong> Real-time alerts, applications statuses, & logs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-3">
                <Link
                  href="/register?type=talent"
                  className="w-full bg-[#7145FF] text-white py-3.5 px-6 rounded-2xl font-extrabold hover:bg-[#5b32e6] transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-violet-500/10 cursor-pointer"
                >
                  Enter Talent Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-center">
                  <span className="text-xs text-slate-400">Already registered? </span>
                  <Link href="/login" className="text-xs font-bold text-[#7145FF] dark:text-violet-400 hover:underline">
                    Access Account
                  </Link>
                </div>
              </div>
            </div>

            {/* Gateway 2: Employer Portal */}
            <div className="group bg-white dark:bg-slate-900 border-2 border-slate-250 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:border-[#7145FF] dark:hover:border-[#7145FF]/85 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:shadow-xl hover:shadow-[#7145FF]/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-[#7145FF] dark:text-indigo-300 rounded-2xl flex items-center justify-center font-bold text-lg border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Employer Portal</h2>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">For Hiring Managers & Businesses</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Publish open vacancies, review pre-vetted interactive candidate scorecards, and propose automated interview slots with instant multi-channel dispatch.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
                      <strong>Automated Dispatch:</strong> Multi-channel alerts sent via Email, SMS & WhatsApp.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
                      <strong>High-Fidelity Screening:</strong> Listen to real video answers & view code reports.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
                      <strong>Pipeline Trackers:</strong> Fast, robust interface to manage talent matches.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-3">
                <Link
                  href="/register?type=client"
                  className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 py-3.5 px-6 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                >
                  Enter Employer Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-center">
                  <span className="text-xs text-slate-400">First time hiring? </span>
                  <Link href="/register?type=client" className="text-xs font-bold text-slate-900 dark:text-white hover:underline">
                    Get Access
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Trust/Ecosystem Banner */}
          <div className="max-w-4xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#7145FF] uppercase tracking-wider">3-Channel Alerting</div>
                <p className="text-xs text-slate-500 dark:text-slate-450">Notifications automatically dispatched via Email, SMS & WhatsApp.</p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Verified Credentials</div>
                <p className="text-xs text-slate-500 dark:text-slate-450">High-fidelity metrics based on real AI assessments & code profiles.</p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">High Velocity</div>
                <p className="text-xs text-slate-500 dark:text-slate-450">Accelerate time-to-interview by over 75% via streamlined schedules.</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
