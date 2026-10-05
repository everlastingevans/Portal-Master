"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, FileText, MessageSquare } from "lucide-react";
import LaunchPathLogo from "@/components/LaunchPathLogo";
import { Spinner } from "@/components/PortalLoader";
import { CandidateCard } from "./CandidateCard";
import { VACANCY_STATUSES, labelFor } from "@/lib/hire/vacancy";

const btn =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const DECISIONS = [
  { value: "INTERESTED", label: "Interested" },
  { value: "MAYBE", label: "Maybe" },
  { value: "NOT_A_FIT", label: "Not a fit" },
];
const SCORES = [
  ["score_skills", "Skills"],
  ["score_communication", "Communication"],
  ["score_culture", "Team fit"],
  ["score_overall", "Overall"],
] as const;

export function EmployerHireDashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [feedbackFor, setFeedbackFor] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/employer/hire", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not load your vacancies.");
      setData(j);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/employer/hire", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Something went wrong.");
    return j;
  };

  const openCv = async (id: number) => {
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    try {
      const j = await post({ action: "CV", shortlistCandidateId: id });
      if (win) win.location.href = j.url;
    } catch (e: any) {
      win?.close();
      setNotice(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-slate-600 antialiased">
      <header className="bg-brand-navy">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <LaunchPathLogo className="h-9" />
          <a href="/employer/dashboard" className="text-sm text-white/70 hover:text-white">
            Employer portal
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-brand-navy">Your LaunchPath vacancies</h1>
        {notice && (
          <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-brand-navy ring-1 ring-slate-200" role="status">
            {notice}
          </p>
        )}
        {error ? (
          <p className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200" role="alert">
            {error}
          </p>
        ) : !data ? (
          <p className="mt-10 flex items-center gap-3 text-slate-500" role="status">
            <Spinner className="h-5 w-5" /> Loading…
          </p>
        ) : data.companies.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            Your account isn’t linked to a company yet. Contact LaunchPath at <a className="font-medium text-brand-navy underline" href="mailto:hello@launchpath.co.za">hello@launchpath.co.za</a> to get access.
          </p>
        ) : data.vacancies.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">No vacancies yet for {data.companies.map((c: any) => c.name).join(", ")}.</p>
        ) : (
          <div className="mt-8 space-y-10">
            {data.vacancies.map((v: any) => (
              <section key={v.id} aria-labelledby={`v-${v.id}`}>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 id={`v-${v.id}`} className="text-xl font-semibold text-brand-navy">
                      {v.roleTitle}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {v.location} · ref #{v.id} · {labelFor(VACANCY_STATUSES, v.status)}
                    </p>
                  </div>
                </div>
                {v.salaryBenchmark && (
                  <div className="mt-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
                    <p className="font-medium text-brand-navy">Salary benchmark from LaunchPath</p>
                    <p className="mt-1 whitespace-pre-line">{v.salaryBenchmark}</p>
                  </div>
                )}
                {v.shortlists.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">Your shortlist will appear here once LaunchPath sends it.</p>
                ) : (
                  v.shortlists.map((s: any) => (
                    <ul key={s.id} className="mt-5 grid gap-5 md:grid-cols-2">
                      {s.candidates.map((c: any) => (
                        <li key={c.id}>
                          <CandidateCard
                            card={c}
                            actions={
                              <>
                                {c.interviewRequested ? (
                                  <span className={`${btn} bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200`}>
                                    <CalendarCheck className="h-4 w-4" /> Interview requested
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className={`${btn} bg-brand-lime text-brand-navy hover:bg-brand-lime-soft`}
                                    onClick={() =>
                                      post({ action: "REQUEST_INTERVIEW", shortlistCandidateId: c.id })
                                        .then((j) => {
                                          setNotice(j.alreadyRequested ? "Already requested. LaunchPath will be in touch." : "Interview requested. LaunchPath will arrange it.");
                                          load();
                                        })
                                        .catch((e) => setNotice(e.message))
                                    }
                                  >
                                    <CalendarCheck className="h-4 w-4" /> Request interview
                                  </button>
                                )}
                                <button type="button" className={`${btn} text-brand-navy ring-1 ring-inset ring-brand-navy/20 hover:bg-brand-navy/[0.04]`} onClick={() => setFeedbackFor({ card: c, scorecards: v.scorecards })}>
                                  <MessageSquare className="h-4 w-4" /> {c.myFeedback ? "Edit feedback" : "Give feedback"}
                                </button>
                                {c.hasCv && (
                                  <button type="button" className={`${btn} text-brand-navy hover:bg-brand-navy/[0.04]`} onClick={() => openCv(c.id)}>
                                    <FileText className="h-4 w-4" /> CV
                                  </button>
                                )}
                              </>
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  ))
                )}
              </section>
            ))}
          </div>
        )}
      </main>

      {feedbackFor && (
        <FeedbackDialog
          target={feedbackFor}
          onClose={() => setFeedbackFor(null)}
          onSave={async (body) => {
            await post({ action: "FEEDBACK", shortlistCandidateId: feedbackFor.card.id, ...body });
            setFeedbackFor(null);
            setNotice("Thanks, your feedback has been shared with LaunchPath.");
            load();
          }}
        />
      )}
    </div>
  );
}

function FeedbackDialog({ target, onClose, onSave }: { target: any; onClose: () => void; onSave: (b: Record<string, unknown>) => Promise<void> }) {
  const prev = target.card.myFeedback;
  const [decision, setDecision] = useState(prev?.decision || "INTERESTED");
  const [comment, setComment] = useState(prev?.comment || "");
  const [scores, setScores] = useState<Record<string, string>>(() => Object.fromEntries(SCORES.map(([k]) => [k, prev?.scores?.[k] ? String(prev.scores[k]) : ""])));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="fb-title">
      <div className="absolute inset-0 bg-brand-navy/60" onClick={onClose} />
      <form
        className="relative w-full max-w-md rounded-t-[24px] bg-white p-6 shadow-2xl sm:rounded-[24px]"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave({ decision, comment, ...(target.scorecards ? scores : {}) });
          } catch (err: any) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 id="fb-title" className="text-lg font-semibold text-brand-navy">
          Feedback on {target.card.name}
        </h2>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-brand-navy">Your view</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DECISIONS.map((d) => (
              <label key={d.value} className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 ring-inset ${decision === d.value ? "bg-brand-navy text-white ring-brand-navy" : "text-brand-navy ring-slate-300"}`}>
                <input type="radio" name="decision" value={d.value} checked={decision === d.value} onChange={() => setDecision(d.value)} className="sr-only" />
                {d.label}
              </label>
            ))}
          </div>
        </fieldset>
        {target.scorecards && (
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-brand-navy">Interview scorecard (1–5)</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {SCORES.map(([k, l]) => (
                <label key={k} className="text-sm text-slate-600">
                  {l}
                  <select className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3" value={scores[k]} onChange={(e) => setScores({ ...scores, [k]: e.target.value })}>
                    <option value="">–</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label htmlFor="fb-comment" className="mt-4 block text-sm font-medium text-brand-navy">
          Comments
        </label>
        <textarea id="fb-comment" rows={3} maxLength={1000} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={comment} onChange={(e) => setComment(e.target.value)} />
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`${btn} text-slate-600 hover:bg-slate-100`}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={`${btn} bg-brand-navy text-white`}>
            {busy && <Spinner className="h-4 w-4" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}
