import { ReactNode } from "react";
import { Briefcase, Clock, MapPin, Wallet } from "lucide-react";
import type { CandidateCardData } from "@/lib/hire/card";
import { MATCH_LEVELS, labelFor } from "@/lib/hire/vacancy";
import { cx } from "@/components/landing-page/primitives";

const MATCH_TONE: Record<string, string> = {
  STRONG: "bg-brand-lime/30 text-brand-navy ring-brand-lime/70",
  GOOD: "bg-sky-50 text-sky-800 ring-sky-200",
  PARTIAL: "bg-amber-50 text-amber-800 ring-amber-200",
};

const rand = (n: number) => `R${n.toLocaleString("en-ZA").replace(/\s/g, ",")}`;

function Rating({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${label}: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cx("h-2 w-2 rounded-full", i <= value ? "bg-brand-navy" : "bg-slate-200")} />
      ))}
      <span className="ml-1 text-[13px] font-semibold tabular-nums text-brand-navy">{value}/5</span>
    </span>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</dt>
        <dd className={cx("text-[14px]", value ? "text-brand-navy" : "text-slate-400")}>{value || "Not provided"}</dd>
      </div>
    </div>
  );
}

/**
 * Reusable Candidate Card (shortlist page, admin preview). Every assessment shown is a LaunchPath
 * recruiter assessment; anything not assessed says so explicitly rather than showing a score.
 */
export function CandidateCard({ card, actions, className }: { card: CandidateCardData; actions?: ReactNode; className?: string }) {
  const assessedOn = card.assessedAt ? new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(card.assessedAt)) : null;

  return (
    <article className={cx("flex h-full flex-col rounded-[24px] bg-white p-6 ring-1 ring-slate-200/80 shadow-[0_24px_48px_-32px_rgba(10,27,61,0.35)]", className)} aria-labelledby={`cand-${card.id}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`cand-${card.id}`} className="text-[19px] font-semibold tracking-tight text-brand-navy">
            {card.name}
          </h3>
          <p className="mt-0.5 text-[14px] text-slate-500">{card.targetRole || "Target role not specified"}</p>
        </div>
        {card.match ? (
          <span className={cx("rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset", MATCH_TONE[card.match] || "bg-slate-50 text-slate-700 ring-slate-200")}>
            {labelFor(MATCH_LEVELS, card.match)}
          </span>
        ) : (
          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">Match not rated</span>
        )}
      </header>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Fact icon={MapPin} label="Location" value={card.location} />
        <Fact icon={Briefcase} label="Experience" value={card.experience} />
        <Fact icon={Wallet} label="Salary expectation" value={card.salaryExpectation ? `${rand(card.salaryExpectation)} / month` : null} />
        <Fact icon={Clock} label="Availability" value={card.availability} />
      </dl>

      {card.keySkills.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Key skills</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {card.keySkills.map((s) => (
              <li key={s} className="rounded-md bg-slate-50 px-2 py-0.5 text-[12px] text-slate-700 ring-1 ring-inset ring-slate-200/80">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70" aria-label="LaunchPath assessment">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">LaunchPath recruiter assessment</p>
        <dl className="mt-3 space-y-2.5 text-[14px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-600">Communication</dt>
            <dd>{card.communication ? <Rating value={card.communication.rating} label="Communication" /> : <span className="text-slate-400">Not assessed</span>}</dd>
          </div>
          {card.communication?.note && <p className="text-[13px] leading-relaxed text-slate-500">{card.communication.note}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-600">Interview readiness</dt>
            <dd>{card.interviewReadiness ? <Rating value={card.interviewReadiness} label="Interview readiness" /> : <span className="text-slate-400">Not assessed</span>}</dd>
          </div>
          {card.roleAssessment && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-slate-600">{card.roleAssessment.name}</dt>
                <dd className="text-[13px] font-semibold tabular-nums text-brand-navy">
                  {card.roleAssessment.score} / {card.roleAssessment.max}
                </dd>
              </div>
              {card.roleAssessment.note && <p className="text-[13px] leading-relaxed text-slate-500">{card.roleAssessment.note}</p>}
            </>
          )}
        </dl>
        {assessedOn && <p className="mt-3 text-[12px] text-slate-400">Assessed by the LaunchPath team on {assessedOn}.</p>}
      </section>

      {card.recruiterNote && (
        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Recruiter note</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-slate-700">{card.recruiterNote}</p>
        </div>
      )}

      {actions && <div className="mt-auto flex flex-wrap gap-2 pt-6">{actions}</div>}
    </article>
  );
}
