import Image from "next/image";
import { Bookmark, Briefcase, Check, MapPin, Mic, Route, Sparkles, UploadCloud } from "lucide-react";
import TalentImage from "@/assets/models/models4.jpg";
import { Reveal } from "./Reveal";
import { Container, Cta, SectionHeading } from "./primitives";

const FEATURES = [
  {
    icon: UploadCloud,
    title: "One profile, done once",
    body: "Upload your CV or connect LinkedIn. We pull out your skills, education and experience for you.",
  },
  {
    icon: Sparkles,
    title: "Jobs ranked for you",
    body: "See how well you fit each role, why you matched, and the skills worth building next.",
  },
  {
    icon: Mic,
    title: "Practise your interview",
    body: "Record practice answers, get AI feedback and build a readiness score employers can see.",
  },
  {
    icon: Route,
    title: "Know where you stand",
    body: "Track every application from applied to hired, with updates by email, SMS and WhatsApp.",
  },
];

function MatchPreview() {
  return (
    <div className="absolute -bottom-8 left-4 right-4 rounded-2xl bg-white p-5 shadow-[0_32px_64px_-24px_rgba(10,27,61,0.45)] ring-1 ring-slate-200/70 sm:left-auto sm:right-8 sm:w-[320px]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-lime">
          <Briefcase className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-brand-navy">Graduate Marketing Assistant</p>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-slate-500">
            <MapPin className="h-3 w-3" /> Cape Town · Hybrid
          </p>
        </div>
        <Bookmark className="h-4 w-4 shrink-0 text-slate-300" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] text-slate-500">Your match</span>
        <span className="text-[12px] font-semibold tabular-nums text-brand-navy">92%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[92%] rounded-full bg-[#5E8C14]" />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {["Social media", "Copywriting", "Canva"].map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 ring-1 ring-inset ring-slate-200/80">
            <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={3} /> {s}
          </span>
        ))}
      </div>
      <div className="mt-4 flex h-9 items-center justify-center rounded-xl bg-brand-lime text-[13px] font-semibold text-brand-navy">Apply now</div>
      <p className="sr-only">Illustrative preview of a job match in the candidate portal.</p>
    </div>
  );
}

export const TalentSection = () => (
  <section id="talent" className="scroll-mt-20 bg-white py-24 md:py-32">
    <Container>
      <div className="grid items-center gap-20 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[32px]">
              <Image
                src={TalentImage}
                alt="A group of young South Africans smiling together outdoors"
                fill
                placeholder="blur"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <MatchPreview />
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <SectionHeading
              eyebrow="For graduates and job seekers"
              title="Get seen for what you can actually do."
              description="Built for graduates, bootcamp learners and junior professionals. Free for job seekers, always."
            />
          </Reveal>

          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={i * 70} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-brand-navy">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="text-[16px] font-semibold text-brand-navy">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{body}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <div className="mt-10">
              <Cta href="/register?type=talent" variant="navy" arrow>
                Create your free profile
              </Cta>
            </div>
          </Reveal>
        </div>
      </div>
    </Container>
  </section>
);
