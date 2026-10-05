import { publishedCaseStudies } from "@/lib/content/case-studies";
import { CaseStudyCard } from "./CaseStudyCard";
import { Reveal } from "./Reveal";
import { Container, Cta, SectionHeading } from "./primitives";

/** Homepage results strip: 2–3 verified case studies, or nothing at all until they exist. */
export const CaseStudiesSection = () => {
  const studies = publishedCaseStudies().slice(0, 3);
  if (studies.length === 0) return null;

  return (
    <section id="results" className="scroll-mt-20 bg-canvas py-24 md:py-32">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <SectionHeading eyebrow="Results" title="Hires we’ve helped make." />
          </Reveal>
          <Reveal delay={80} className="shrink-0">
            <Cta href="/results" variant="outline-dark" arrow>
              See all results
            </Cta>
          </Reveal>
        </div>
        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {studies.map((s, i) => (
            <Reveal as="li" key={s.slug} delay={i * 90}>
              <CaseStudyCard study={s} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
};
