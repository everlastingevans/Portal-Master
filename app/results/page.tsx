import type { Metadata } from "next";
import { Header } from "@/components/landing-page/Header";
import { ContactFooter } from "@/components/landing-page/ContactFooter";
import { CaseStudyCard } from "@/components/landing-page/CaseStudyCard";
import { Container, Cta, Eyebrow } from "@/components/landing-page/primitives";
import { publishedCaseStudies } from "@/lib/content/case-studies";

const studies = publishedCaseStudies();

export const metadata: Metadata = {
  title: "Results and case studies | LaunchPath",
  description: "Verified results from employers who hired junior talent through LaunchPath.",
  // Don't ask search engines to index an empty page
  robots: studies.length ? undefined : { index: false, follow: true },
  alternates: { canonical: "/results" },
};

export default function ResultsPage() {
  return (
    <div className="bg-white font-sans text-slate-600 antialiased">
      <Header />
      <main>
        <section className="bg-brand-navy pb-20 pt-32 sm:pt-40">
          <Container>
            <Eyebrow tone="dark">Results</Eyebrow>
            <h1 className="mt-6 max-w-3xl text-[38px] font-semibold leading-[1.07] tracking-tight text-white sm:text-[52px]">Case studies</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/70">Real hires, with figures checked against our records and published with the employer’s permission.</p>
          </Container>
        </section>
        <section className="bg-canvas py-20 md:py-28">
          <Container>
            {studies.length === 0 ? (
              <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-10 text-center ring-1 ring-slate-200/80">
                <p className="text-xl font-semibold text-brand-navy">Our first case studies are on the way.</p>
                <p className="mt-3 text-[15px] leading-relaxed">We only publish results we’ve verified and that employers have approved. In the meantime, we’re happy to talk you through how we work.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Cta href="/find-candidates" variant="navy" arrow>
                    Find Candidates
                  </Cta>
                  <Cta href="/#contact" variant="outline-dark">
                    Talk to us
                  </Cta>
                </div>
              </div>
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {studies.map((s) => (
                  <li key={s.slug}>
                    <CaseStudyCard study={s} />
                  </li>
                ))}
              </ul>
            )}
          </Container>
        </section>
      </main>
      <ContactFooter />
    </div>
  );
}
