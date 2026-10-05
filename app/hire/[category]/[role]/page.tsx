import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Header } from "@/components/landing-page/Header";
import { ContactFooter } from "@/components/landing-page/ContactFooter";
import { EmployerAnalytics } from "@/components/landing-page/EmployerAnalytics";
import { Container, Cta, Eyebrow, SectionHeading } from "@/components/landing-page/primitives";
import { categoryBySlug } from "@/lib/content/talent-categories";
import { ROLE_PAGES, SERVICE_FAQS, rolePage } from "@/lib/content/role-pages";
import { breadcrumbJsonLd, faqJsonLd, jsonLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return ROLE_PAGES.map((r) => ({ category: r.categorySlug, role: r.slug }));
}

export function generateMetadata({ params }: { params: { category: string; role: string } }): Metadata {
  const r = rolePage(params.category, params.role);
  if (!r) return {};
  const path = `/hire/${r.categorySlug}/${r.slug}`;
  return {
    title: `Hire a junior ${r.title} in South Africa | LaunchPath`,
    description: `${r.summary} Screened shortlist; free to submit, pay only if you hire.`,
    alternates: { canonical: path },
    openGraph: { title: `Hire a junior ${r.title} | LaunchPath`, description: r.summary, url: path, type: "website", locale: "en_ZA" },
  };
}

export default function RolePageView({ params }: { params: { category: string; role: string } }) {
  const r = rolePage(params.category, params.role);
  const c = categoryBySlug(params.category);
  if (!r || !c) notFound();
  const formHref = `/find-candidates?category=${c.code}&role=${encodeURIComponent(r.title)}`;
  const faqs = [...r.faqs, ...SERVICE_FAQS];
  const crumbs = [
    { name: "Home", path: "/" },
    { name: `${c.name} talent`, path: `/hire/${c.slug}` },
    { name: r.title, path: `/hire/${c.slug}/${r.slug}` },
  ];

  return (
    <div className="bg-white font-sans text-slate-600 antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd(crumbs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />
      <EmployerAnalytics page={`role_${r.slug.replace(/-/g, "_")}`} />
      <Header />
      <main>
        <section className="relative overflow-hidden bg-brand-navy pb-20 pt-32 sm:pt-40">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(166,242,60,0.14),transparent_62%)]" />
          <Container className="relative">
            <nav aria-label="Breadcrumb" className="text-sm text-white/60">
              <Link href={`/hire/${c.slug}`} className="hover:text-white">
                {c.name} talent
              </Link>{" "}
              / <span className="text-white/80">{r.title}</span>
            </nav>
            <div className="mt-6">
              <Eyebrow tone="dark">Junior {c.name.toLowerCase()} roles</Eyebrow>
            </div>
            <h1 className="mt-6 max-w-3xl text-[38px] font-semibold leading-[1.07] tracking-tight text-white sm:text-[52px]">Hire a junior {r.title}</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/70">{r.summary}</p>
            <div className="mt-9">
              <Cta href={formHref} variant="lime" arrow track={{ cta: "find_candidates", location: "role_hero" }}>
                Find Candidates
              </Cta>
            </div>
          </Container>
        </section>

        <section className="py-20 md:py-28">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <SectionHeading eyebrow="The role" title="What the role usually involves" />
                <ul className="mt-8 space-y-3">
                  {r.responsibilities.map((x) => (
                    <li key={x} className="flex items-start gap-3 text-[15px] text-brand-navy">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5E8C14]" strokeWidth={3} />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <SectionHeading eyebrow="Screening" title="What we screen for" />
                <ul className="mt-8 space-y-3">
                  {r.screening.map((x) => (
                    <li key={x} className="flex items-start gap-3 text-[15px] text-brand-navy">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5E8C14]" strokeWidth={3} />
                      {x}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-slate-500">Every shortlisted candidate is screened by the LaunchPath team against the brief we agree with you.</p>
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-canvas py-20 md:py-28">
          <Container>
            <SectionHeading eyebrow="How it works" title="Tell us who you need, meet your shortlist, hire." />
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["Tell us who you need", "Submit the role for free. We call to calibrate the brief with you."],
                ["Meet your shortlist", "Our target for serviceable roles is 3–5 screened candidates within five working days of calibration."],
                ["Hire", "Interview who you like. A placement fee applies only if you hire."],
              ].map(([t, b], i) => (
                <li key={t} className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/80">
                  <p className="text-sm font-medium text-slate-400">Step {i + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold text-brand-navy">{t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed">{b}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        <section className="py-20 md:py-28">
          <Container>
            <SectionHeading eyebrow="FAQ" title={`Hiring a ${r.title}: questions`} />
            <dl className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map((f) => (
                <div key={f.q} className="py-6">
                  <dt className="text-[17px] font-medium text-brand-navy">{f.q}</dt>
                  <dd className="mt-2 max-w-3xl text-[16px] leading-relaxed text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <Cta href={formHref} variant="navy" arrow track={{ cta: "find_candidates", location: "role_footer" }}>
                Find Candidates
              </Cta>
              <Cta href={`/hire/${c.slug}`} variant="outline-dark">
                More {c.name.toLowerCase()} roles
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <ContactFooter />
    </div>
  );
}
