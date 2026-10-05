import type { CaseStudy } from "@/lib/content/case-studies";

/** Reusable case study card. Renders only the fields that are known; nothing is estimated. */
export function CaseStudyCard({ study }: { study: CaseStudy }) {
  const stats = [
    study.candidatesOrLearners !== null && { label: "Candidates or learners", value: String(study.candidatesOrLearners) },
    study.workingDaysToShortlist !== null && { label: "Working days to shortlist", value: String(study.workingDaysToShortlist) },
    study.hiredOrPlaced !== null && { label: "Hired or placed", value: String(study.hiredOrPlaced) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white p-7 sm:p-8">
      <p className="text-[13px] font-medium text-slate-500">{study.employer || study.anonymisedEmployer}</p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-brand-navy">{study.roleOrProgramme}</h3>
      {stats.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-slate-100 py-5">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-[12px] leading-tight text-slate-500">{s.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-brand-navy">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-6 text-[15px] leading-relaxed text-slate-700">{study.result}</p>
      {study.quote && (
        <figure className="mt-auto pt-6">
          <blockquote className="border-l-4 border-brand-lime pl-4 text-[15px] italic leading-relaxed text-slate-700">“{study.quote.text}”</blockquote>
          <figcaption className="mt-3 pl-4 text-sm text-slate-500">
            <span className="font-semibold text-brand-navy">{study.quote.name}</span>, {study.quote.title}
          </figcaption>
        </figure>
      )}
    </article>
  );
}
