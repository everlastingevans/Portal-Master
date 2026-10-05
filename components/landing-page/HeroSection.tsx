import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Check, ClipboardCheck, GraduationCap, Mail, Users } from "lucide-react";
import HeroImage from "@/assets/models/models1.jpg";
import { Container, Cta, Eyebrow, MockAvatar } from "./primitives";

const AUDIENCES = [
  {
    icon: Building2,
    title: "Hiring for a role",
    body: "Tell us who you need and meet a short list of screened candidates, not a pile of CVs.",
    href: "/find-candidates",
    cta: "Find Candidates",
    track: "find_candidates",
  },
  {
    icon: Users,
    title: "Hiring several people",
    body: "Filling a few seats or a whole intake? We’ll plan the search with you.",
    href: "/#contact",
    cta: "Talk to our team",
    track: "bulk_hiring",
  },
  {
    icon: GraduationCap,
    title: "Looking for work",
    body: "Early in your career? Build one free profile and get considered for real roles.",
    href: "/register?type=talent",
    cta: "Find a job",
    track: "candidate_signup",
  },
];

export const HeroSection = ({ guaranteeDays }: { guaranteeDays: number }) => {
  const promises = ["No upfront fees", "Skills-screened talent", `${guaranteeDays}-day replacement guarantee`];

  return (
    <section id="top" className="relative overflow-hidden bg-brand-navy">
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-32 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(166,242,60,0.14),transparent_62%)]" />
        <div className="absolute -left-48 bottom-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(57,135,229,0.14),transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_65%)]" />
      </div>

      <Container className="relative pb-20 pt-32 sm:pt-40 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Copy */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="animate-fade-in">
              <Eyebrow tone="dark">Recruitment for South African junior and early-career roles</Eyebrow>
            </div>

            <h1 className="mt-6 text-[40px] font-semibold leading-[1.05] tracking-tight text-white animate-fade-in [animation-delay:80ms] sm:text-[56px] xl:text-[64px]">
              Hire <span className="text-brand-lime">great junior talent</span> without sorting through hundreds of CVs.
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/70 animate-fade-in [animation-delay:160ms] sm:text-lg">
              Tell us who you’re hiring. We’ll send you 3–5 screened candidates within five working days. You only pay if you hire.
            </p>

            <div className="mt-9 flex flex-col gap-3 animate-fade-in [animation-delay:240ms] sm:flex-row">
              <Cta href="/find-candidates" variant="lime" arrow track={{ cta: "find_candidates", location: "hero" }}>
                Find Candidates
              </Cta>
              <Cta href="/#how-it-works" variant="outline-light" track={{ cta: "how_it_works", location: "hero" }}>
                How It Works
              </Cta>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70 animate-fade-in [animation-delay:320ms]" aria-label="What you get">
              {promises.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime/15 text-brand-lime">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="relative mx-auto w-full max-w-md lg:col-span-6 lg:max-w-none xl:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] ring-1 ring-white/10 animate-scale-in [animation-delay:120ms]">
              <Image
                src={HeroImage}
                alt="A young South African celebrating a career milestone"
                fill
                priority
                placeholder="blur"
                sizes="(max-width: 1024px) 90vw, 40vw"
                className="object-cover object-[60%_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-transparent to-transparent" />
            </div>

            {/* Illustrative shortlist card */}
            <div className="absolute -left-4 bottom-10 w-[260px] rounded-2xl bg-white p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] animate-fade-in [animation-delay:420ms] sm:-left-10 sm:w-[290px]">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-brand-navy">Your shortlist</p>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <Mail className="h-3 w-3" /> Sent
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Junior Sales Consultant · Johannesburg</p>
              <ul className="mt-3 space-y-2">
                {["Lerato M", "Sipho D", "Ayanda K"].map((name, i) => (
                  <li key={name} className="flex items-center gap-2.5">
                    <MockAvatar name={name} tone={i} />
                    <span className="flex-1 text-[13px] font-medium text-brand-navy">{name}.</span>
                    <span className="rounded-full bg-brand-lime/25 px-2 py-0.5 text-[11px] font-semibold text-brand-navy ring-1 ring-inset ring-brand-lime/60">Screened</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Illustrative screening card */}
            <div className="absolute -right-3 top-8 w-[210px] rounded-2xl bg-white/95 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] backdrop-blur animate-fade-in [animation-delay:560ms] sm:-right-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-navy text-brand-lime">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                </span>
                <p className="text-[13px] font-semibold text-brand-navy">Screened for</p>
              </div>
              <ul className="mt-3 space-y-1.5 text-[12px] text-slate-600">
                {["Role-relevant skills", "Communication", "Availability & location"].map((s) => (
                  <li key={s} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <p className="sr-only">Illustrative example of a LaunchPath shortlist.</p>
          </div>
        </div>
      </Container>

      {/* Audience strip */}
      <div className="relative border-t border-white/[0.08] bg-white/[0.02]">
        <Container>
          <ul className="grid divide-y divide-white/[0.08] md:grid-cols-3 md:divide-x md:divide-y-0">
            {AUDIENCES.map(({ icon: Icon, title, body, href, cta, track }) => (
              <li key={title}>
                <Link
                  href={href}
                  data-track-cta={track}
                  data-track-location="audience_strip"
                  className="group flex h-full flex-col gap-3 py-8 transition-colors md:px-8 md:first:pl-0 md:last:pr-0"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-brand-lime ring-1 ring-inset ring-white/10 transition-colors group-hover:bg-brand-lime group-hover:text-brand-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-[17px] font-semibold text-white">{title}</p>
                  <p className="text-sm leading-relaxed text-white/60">{body}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-brand-lime">
                    {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
};
