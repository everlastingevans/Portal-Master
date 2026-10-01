import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Check, GraduationCap, Mail, Sparkles, Users } from "lucide-react";
import HeroImage from "@/assets/models/models1.jpg";
import { Container, Cta, Eyebrow, MockAvatar } from "./primitives";

const AUDIENCES = [
  {
    icon: Building2,
    title: "Employers & SMEs",
    body: "Post a role and get a vetted shortlist instead of four hundred CVs.",
    href: "/register?type=client",
    cta: "Start hiring",
  },
  {
    icon: Users,
    title: "Recruiters & partners",
    body: "Source pre-screened early-career talent for the roles you’re filling.",
    href: "/#contact",
    cta: "Talk to our team",
  },
  {
    icon: GraduationCap,
    title: "Graduates & job seekers",
    body: "Build one profile and get matched to roles that fit your skills.",
    href: "/register?type=talent",
    cta: "Find a job",
  },
];

export const HeroSection = () => {
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
              <Eyebrow tone="dark">Hiring infrastructure for South Africa’s early careers</Eyebrow>
            </div>

            <h1 className="mt-6 text-[40px] font-semibold leading-[1.05] tracking-tight text-white animate-fade-in [animation-delay:80ms] sm:text-[56px] xl:text-[68px]">
              The bridge between <span className="text-brand-lime">overlooked talent</span> and growing businesses.
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/70 animate-fade-in [animation-delay:160ms] sm:text-lg">
              LaunchPath helps South African graduates reach meaningful work, and helps SMEs hire quality entry-level talent quickly and affordably, with vetting and matching done properly.
            </p>

            <div className="mt-9 flex flex-col gap-3 animate-fade-in [animation-delay:240ms] sm:flex-row">
              <Cta href="/register?type=client" variant="lime" arrow>
                Hire talent
              </Cta>
              <Cta href="/register?type=talent" variant="outline-light">
                Find a job
              </Cta>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/60 animate-fade-in [animation-delay:320ms]">
              {["Every candidate screened by a person", "Shortlists by email", "No placement fees"].map((t) => (
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
                alt="A young graduate at a graduation ceremony"
                fill
                priority
                placeholder="blur"
                sizes="(max-width: 1024px) 90vw, 40vw"
                className="object-cover object-[60%_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-transparent to-transparent" />
            </div>

            {/* Product preview: shortlist card */}
            <div className="absolute -left-4 bottom-10 w-[260px] rounded-2xl bg-white p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] animate-fade-in [animation-delay:420ms] sm:-left-10 sm:w-[290px]">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-brand-navy">Shortlist ready</p>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <Mail className="h-3 w-3" /> Sent
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Junior Data Analyst · Johannesburg</p>
              <ul className="mt-3 space-y-2">
                {[
                  { name: "Lerato M", score: 94 },
                  { name: "Sipho D", score: 89 },
                  { name: "Ayanda K", score: 86 },
                ].map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2.5">
                    <MockAvatar name={c.name} tone={i} />
                    <span className="flex-1 text-[13px] font-medium text-brand-navy">{c.name}.</span>
                    <span className="rounded-full bg-brand-lime/25 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-brand-navy ring-1 ring-inset ring-brand-lime/60">
                      {c.score}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Product preview: match card */}
            <div className="absolute -right-3 top-8 w-[210px] rounded-2xl bg-white/95 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] backdrop-blur animate-fade-in [animation-delay:560ms] sm:-right-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-navy text-brand-lime">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <p className="text-[13px] font-semibold text-brand-navy">Why you matched</p>
              </div>
              <ul className="mt-3 space-y-1.5 text-[12px] text-slate-600">
                {["SQL & Excel", "BCom Informatics", "Based in Gauteng"].map((s) => (
                  <li key={s} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <p className="sr-only">Illustrative preview of the LaunchPath product.</p>
          </div>
        </div>
      </Container>

      {/* Audience strip */}
      <div className="relative border-t border-white/[0.08] bg-white/[0.02]">
        <Container>
          <ul className="grid divide-y divide-white/[0.08] md:grid-cols-3 md:divide-x md:divide-y-0">
            {AUDIENCES.map(({ icon: Icon, title, body, href, cta }) => (
              <li key={title}>
                <Link href={href} className="group flex h-full flex-col gap-3 py-8 transition-colors md:px-8 md:first:pl-0 md:last:pr-0">
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
