import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ClipboardList, Handshake, UserCheck } from "lucide-react";
import { Header } from "@/components/landing-page/Header";
import { ContactFooter } from "@/components/landing-page/ContactFooter";
import { EmployerAnalytics } from "@/components/landing-page/EmployerAnalytics";
import { Container, Cta, Eyebrow, SectionHeading } from "@/components/landing-page/primitives";
import { TALENT_CATEGORIES, categoryBySlug } from "@/lib/content/talent-categories";
import { getHireTerms } from "@/lib/hire/settings";
import { formatRand, formatRate } from "@/lib/hire/terms";
import { rolePagesFor } from "@/lib/content/role-pages";
import { breadcrumbJsonLd, jsonLd } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return TALENT_CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const c = categoryBySlug(params.category);
  if (!c) return {};
  return {
    title: `Hire junior ${c.name} talent in South Africa | LaunchPath`,
    description: `${c.intro} Free to submit a vacancy; you only pay if you hire.`,
    alternates: { canonical: `/hire/${c.slug}` },
  };
}

const STEPS = [
  { icon: ClipboardList, title: "Tell us who you need", body: "Submit the role for free. We call you to calibrate the brief: what success looks like and your must-haves." },
  { icon: UserCheck, title: "Meet your shortlist", body: "Our target for serviceable roles is 3–5 screened candidates within five working days of calibration." },
  { icon: Handshake, title: "Hire", body: "Interview who you like. You pay a placement fee only if you hire, backed by our replacement guarantee." },
];

export default async function TalentCategoryPage({ params }: { params: { category: string } }) {
  const c = categoryBySlug(params.category);
  if (!c) notFound();
  const terms = await getHireTerms();
  const formHref = `/find-candidates?category=${c.code}`;
  const others = TALENT_CATEGORIES.filter((o) => o.slug !== c.slug);
  const rolePages = rolePagesFor(c.slug);

  return (
    <div className="bg-white font-sans text-slate-600 antialiased">
      <EmployerAnalytics page={`category_${c.slug.replace(/-/g, "_")}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: `${c.name} talent`, path: `/hire/${c.slug}` }]))} />
      <Header />
      <main>
        <section className="relative overflow-hidden bg-brand-navy pb-20 pt-32 sm:pt-40">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(166,242,60,0.14),transparent_62%)]" />
          <Container className="relative">
            <Eyebrow tone="dark">Junior {c.name} talent</Eyebrow>
            <h1 className="mt-6 max-w-3xl text-[38px] font-semibold leading-[1.07] tracking-tight text-white sm:text-[52px]">{c.headline}</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/70">
              {c.intro} Typically 0–3 years’ experience, across South Africa. Free to submit a vacancy; you only pay if you hire.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Cta href={formHref} variant="lime" arrow track={{ cta: "find_candidates", location: "category_hero" }}>
                Find {c.name} Candidates
              </Cta>
              <Cta href="#how-it-works" variant="outline-light">
                How It Works
              </Cta>
            </div>
          </Container>
        </section>

        <section className="py-20 md:py-28">
          <Container>
            <SectionHeading eyebrow="Roles we recruit for" title={`Junior ${c.name.toLowerCase()} roles`} description="Common early-career roles in this area. If yours isn’t listed, submit it anyway and we’ll tell you whether we can help." />
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.roles.map((r) => (
                <li key={r.title} className="rounded-3xl border border-slate-200/80 bg-white p-6">
                  <h3 className="text-[17px] font-semibold text-brand-navy">
                    {rolePages.find((p) => p.title === r.title) ? (
                      <Link href={`/hire/${c.slug}/${rolePages.find((p) => p.title === r.title)!.slug}`} className="underline-offset-2 hover:underline">
                        {r.title}
                      </Link>
                    ) : (
                      r.title
                    )}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{r.summary}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section className="bg-canvas py-20 md:py-28">
          <Container>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <SectionHeading eyebrow="Screening" title="What we screen for" description="Every candidate on your shortlist is screened by the LaunchPath team against the brief we agree with you." />
                <p className="mt-6 rounded-2xl bg-white p-5 text-[15px] leading-relaxed text-slate-600 ring-1 ring-slate-200/80">{c.goodToKnow}</p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
                {c.screening.map((s) => (
                  <li key={s} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 text-[15px] text-brand-navy ring-1 ring-slate-200/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-brand-lime">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        <section id="how-it-works" className="scroll-mt-20 py-20 md:py-28">
          <Container>
            <SectionHeading eyebrow="How it works" title="Three steps to your next hire." />
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-brand-lime">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-5 text-sm font-medium text-slate-400">Step {i + 1}</p>
                  <h3 className="mt-1 text-xl font-semibold text-brand-navy">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed">{body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-16 flex flex-col gap-6 rounded-[32px] bg-brand-navy p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">R0 upfront. You only pay if you hire.</p>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/70">
                  Placement fee of {formatRate(terms.feeRateBps)} of annual cost to company (minimum {formatRand(terms.feeMin)}, maximum {formatRand(terms.feeMax)}), with a{" "}
                  {terms.guaranteeDays}-day replacement guarantee subject to our employer terms.
                </p>
              </div>
              <Cta href={formHref} variant="lime" arrow className="shrink-0" track={{ cta: "find_candidates", location: "category_footer" }}>
                Find {c.name} Candidates
              </Cta>
            </div>

            <nav aria-label="Other talent categories" className="mt-12 text-sm">
              <span className="text-slate-500">Also hiring for </span>
              {others.map((o, i) => (
                <span key={o.slug}>
                  <Link href={`/hire/${o.slug}`} className="font-medium text-brand-navy underline-offset-2 hover:underline">
                    {o.name}
                  </Link>
                  {i < others.length - 1 ? ", " : "?"}
                </span>
              ))}
            </nav>
          </Container>
        </section>
      </main>
      <ContactFooter />
    </div>
  );
}
