import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Sparkles, 
  User, 
  Building2,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Target,
  GraduationCap
} from "lucide-react";
import { Header } from "@/components/landing-page/Header";
import { OfferSection } from "@/components/landing-page/OfferSection";
import { TeamSection } from "@/components/landing-page/TeamSection";
import { StrategySection } from "@/components/landing-page/StrategySection";
import { PeopleSection } from "@/components/landing-page/PeopleSection";
import { BrandsSection } from "@/components/landing-page/BrandsSection";
import { TestimonialSection } from "@/components/landing-page/TestimonialSection";
import { ContactFooter } from "@/components/landing-page/ContactFooter";
import { Reveal } from "@/components/landing-page/Reveal";
import { PlatformVision } from "@/components/landing-page/PlatformVision";
import { PricingSection } from "@/components/landing-page/PricingSection";
import HeroImage from "@/assets/models/models1.jpg";

export default function Home() {
  return (
    <div id="top" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      {/* Top Navigation */}
      <Header variant="dark" />

      {/* Hero Header Section */}
      <main className="flex-grow pt-24 sm:pt-28">
        
        {/* Dynamic Premium Split-Hero (Mapping page 1 of PDF) */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pt-12 pb-16">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side: Vision, Core Mission, CTA */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-100/60 dark:bg-violet-950/40 rounded-full border border-violet-200 dark:border-violet-900/60 mb-2">
                  <Sparkles className="w-4 h-4 text-[#5D3FD3]" />
                  <span className="text-[15px] font-extrabold text-[#5D3FD3] dark:text-violet-300 uppercase tracking-widest font-mono">
                    LaunchPath Platform Vision
                  </span>
                </div>
              </Reveal>

              <div className="space-y-4">
                <Reveal delay={80}>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                    The bridge between <span className="text-[#5D3FD3] bg-gradient-to-r from-[#5D3FD3] to-[#a286f3] bg-clip-text text-transparent">overlooked talent</span> and growing businesses
                  </h1>
                </Reveal>
                <Reveal delay={120}>
                  <p className="text-base sm:text-[15px] text-slate-600 dark:text-slate-350 leading-relaxed max-w-2xl">
                    LaunchPath is not just a job board. It is a hiring infrastructure platform built to solve two massive market failures: helping South African graduates access meaningful work opportunities, and enabling SMEs to hire quality entry-level talent efficiently and affordably.
                  </p>
                </Reveal>
              </div>

              {/* Document Header Brief */}
              <Reveal delay={160}>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2 items-center text-[15px] text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="font-bold block text-slate-700 dark:text-slate-300">CTO Overview</span>
                    <span>For Evans Munatsa</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                  <div>
                    <span className="font-bold block text-slate-700 dark:text-slate-300">Prepared By</span>
                    <span>Yazid Bohardien</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                  <div>
                    <span className="font-bold block text-[#5D3FD3] dark:text-violet-400">Core Mission</span>
                    <span>Africa&apos;s leading early-career platform</span>
                  </div>
                </div>
              </Reveal>

              {/* CTAs */}
              <Reveal delay={200}>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="#portal-gateways"
                    className="bg-[#5D3FD3] hover:bg-[#4d32bb] text-white py-3.5 px-7 text-[15px] rounded-full font-semibold transition-all hover:scale-[1.02] text-sm shadow-md shadow-violet-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    Access Gateways <ArrowRight className="w-4 h-4" />
                  </a>
                  {/* <a
                    href="#contact"
                    className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-3.5 px-7 rounded-2xl font-extrabold transition-all hover:scale-[1.02] text-sm flex items-center gap-2 cursor-pointer"
                  >
                    Request a Demo
                  </a> */}
                </div>
              </Reveal>
            </div>

            {/* Right side: Styled custom hero image with a clean visual overlay */}
            <div className="lg:col-span-5 relative">
              <Reveal delay={250} className="w-full flex justify-center">
                <div className="relative w-full max-w-md aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[36px] overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl">
                  <Image
                    src={HeroImage}
                    alt="LaunchPath Core Vision"
                    fill
                    priority
                    sizes="(max-w-768px) 100vw, 40vw"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {/* Glassmorphic overlay displaying the Core Mission */}
                  <div className="absolute bottom-5 left-5 right-5 bg-black/75 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest font-mono">Core Mission Statement</span>
                    <p className="text-[15px] text-white leading-relaxed">
                      &ldquo;To become Africa&apos;s leading early-career hiring platform that uses technology, data, and automation to connect talent to opportunity faster than traditional methods.&rdquo;
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

          </div>
        </div>

        {/* Portal Gateways Section (Accessing either side) */}
        <div id="portal-gateways" className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full space-y-12 pb-24 border-t border-slate-150 dark:border-slate-850 pt-16">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Select Your LaunchPath Gateway
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
                Ready to coordinate placement pipelines, perform readiness matches, or request pre-vetted candidates? Choose your portal to begin.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
            
            {/* Gateway 1: Candidate Portal */}
            <Reveal delay={100}>
              <div className="group h-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:border-[#5D3FD3] dark:hover:border-[#5D3FD3]/80 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:shadow-xl hover:shadow-[#5D3FD3]/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5D3FD3]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 text-[#5D3FD3] dark:text-violet-300 rounded-2xl flex items-center justify-center font-bold text-lg border border-violet-200 dark:border-violet-800 shadow-inner">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Talent Portal</h2>
                      <p className="text-[15px] font-semibold text-slate-400 dark:text-slate-500">For Developers &amp; Job Seekers</p>
                    </div>
                  </div>

                  <p className="text-[15px] text-slate-600 dark:text-slate-350 leading-relaxed">
                    Unlock dynamic role recommendations, perform real-time AI mock readiness simulators to build credentials, and coordinate placement pipelines in one screen.
                  </p>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                        <strong>AI Fit Scores:</strong> Matched job opportunities based on credentials.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                        <strong>Interactive Sandbox:</strong> Test and verify readiness via timed interviews.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                        <strong>In-App Mailbox:</strong> Real-time alerts, applications statuses, &amp; logs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-3">
                  <Link
                    href="/register?type=talent"
                    className="w-full bg-[#5D3FD3] text-white font-mono py-3.5 px-6 rounded-full font-bold hover:bg-[#5b32e6] transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-violet-500/10 cursor-pointer"
                  >
                    Enter Talent Portal <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="text-center">
                    <span className="text-[15px] text-slate-400">Already registered? </span>
                    <Link href="/login" className="text-[15px] font-bold text-[#5D3FD3] dark:text-violet-400 hover:underline">
                      Access Account
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Gateway 2: Employer Portal */}
            <Reveal delay={200}>
              <div className="group h-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:border-[#5D3FD3] dark:hover:border-[#5D3FD3]/85 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:shadow-xl hover:shadow-[#5D3FD3]/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-[#5D3FD3] dark:text-indigo-300 rounded-2xl flex items-center justify-center font-bold text-lg border border-indigo-100 dark:border-indigo-800 shadow-inner">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Employer Portal</h2>
                      <p className="text-[15px] font-semibold text-slate-400 dark:text-slate-500">For Hiring Managers &amp; Businesses</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                    Publish open vacancies, review pre-vetted interactive candidate scorecards, and propose automated interview slots with instant multi-channel dispatch.
                  </p>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                        <strong>Automated Dispatch:</strong> Multi-channel alerts sent via Email, SMS &amp; WhatsApp.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                        <strong>High-Fidelity Screening:</strong> Listen to real video answers &amp; view code reports.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-extrabold">✓</div>
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                        <strong>Pipeline Trackers:</strong> Fast, robust interface to manage talent matches.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-3">
                  <Link
                    href="/register?type=client"
                    className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 py-3.5 px-6 rounded-full font-mono font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                  >
                    Enter Employer Portal <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="text-center">
                    <span className="text-[15px] text-slate-400">First time hiring? </span>
                    <Link href="/register?type=client" className="text-[15px] font-bold text-slate-900 dark:text-white hover:underline">
                      Get Access
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>

          </div>
        </div>

        {/* Detailed Brand Mission & Explainer Section (About us anchor) */}
        <TeamSection />

        {/* Dynamic Platform Vision & Features Section (What We Do anchor) */}
        <PlatformVision />

        {/* Vetting, Matching, and Affordable Solutions Section (Offer Section using local offer images) */}
        <OfferSection />

        {/* Subscription Plans & Pricing Section */}
        {/* <PricingSection /> */}

        {/* Detailed SME Strategy & Growth Support */}
        <StrategySection />

        {/* Interactive Comparison Section */}
        <PeopleSection />

        {/* Graduate Placement Case Studies */}
        <BrandsSection />

        {/* Elegant Testimonial Showcase */}
        <TestimonialSection />

        {/* Contact Form & Footer links (Contact anchor) */}
        <ContactFooter />
      </main>
    </div>
  );
}

