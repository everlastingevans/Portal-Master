"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CalendarCheck, CheckCircle2, FileText, X } from "lucide-react";
import LaunchPathLogo from "@/components/LaunchPathLogo";
import { Spinner } from "@/components/PortalLoader";
import { trackEmployerEvent } from "@/lib/analytics";
import type { CandidateCardData } from "@/lib/hire/card";
import { CandidateCard } from "./CandidateCard";

type Data = { roleTitle: string; companyName: string; reference: number; expiresAt: string; candidates: CandidateCardData[] };

const readToken = () => new URLSearchParams(window.location.hash.replace(/^#/, "")).get("t") || "";

const fmt = (iso: string) => new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

const btn =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function ShortlistView() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState<CandidateCardData | null>(null);
  const [cvBusy, setCvBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (t: string) => {
    try {
      const res = await fetch("/api/shortlists/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: t }), cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "This shortlist is not available.");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    const t = readToken();
    setToken(t);
    if (!t) {
      setError("This shortlist link is incomplete. Please open the full link from your email, or contact LaunchPath.");
      return;
    }
    load(t).then(() => trackEmployerEvent("shortlist_viewed", { page: "shortlist" }));
  }, [load]);

  const openCv = async (c: CandidateCardData) => {
    setCvBusy(c.id);
    // Open the tab synchronously so pop-up blockers allow it, then point it at the short-lived URL
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    try {
      const res = await fetch("/api/shortlists/cv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, candidateId: c.id }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) throw new Error(json.error || "The CV is not available.");
      if (win) win.location.href = json.url;
      else window.location.href = json.url;
    } catch (e: any) {
      win?.close();
      setNotice(e.message);
    } finally {
      setCvBusy(null);
    }
  };

  const onRequested = (id: number, already: boolean) => {
    setData((d) => (d ? { ...d, candidates: d.candidates.map((c) => (c.id === id ? { ...c, interviewRequested: true } : c)) } : d));
    setNotice(already ? "You’ve already asked to interview this candidate. LaunchPath will be in touch to arrange it." : "Thanks. LaunchPath will contact you and the candidate to arrange the interview.");
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-slate-600 antialiased">
      <header className="bg-brand-navy">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <LaunchPathLogo className="h-9" />
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/70 ring-1 ring-inset ring-white/10">Private shortlist</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {error ? (
          <div className="mx-auto max-w-lg rounded-[24px] bg-white p-8 text-center ring-1 ring-slate-200/80" role="alert">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
            <h1 className="mt-4 text-xl font-semibold text-brand-navy">Shortlist unavailable</h1>
            <p className="mt-2 text-[15px] leading-relaxed">{error}</p>
            <p className="mt-4 text-sm">
              Email <a className="font-medium text-brand-navy underline" href="mailto:hello@launchpath.co.za">hello@launchpath.co.za</a> and we’ll help.
            </p>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center gap-3 py-24 text-slate-500" role="status">
            <Spinner className="h-5 w-5" /> Loading your shortlist…
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-500">
                  {data.companyName} · ref #{data.reference}
                </p>
                <h1 className="mt-1 text-[30px] font-semibold tracking-tight text-brand-navy sm:text-[36px]">Your shortlist: {data.roleTitle}</h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed">
                  {data.candidates.length} {data.candidates.length === 1 ? "candidate" : "candidates"} screened by the LaunchPath team against the brief we agreed with you. Request
                  an interview with anyone you’d like to meet and we’ll arrange it.
                </p>
              </div>
              <p className="text-[13px] text-slate-500">Link expires {fmt(data.expiresAt)}</p>
            </div>

            {notice && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-brand-navy ring-1 ring-slate-200" role="status">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="flex-1">{notice}</span>
                <button type="button" onClick={() => setNotice("")} aria-label="Dismiss" className="cursor-pointer text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {data.candidates.length === 0 ? (
              <p className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">This shortlist doesn’t have any candidates yet. Please contact LaunchPath.</p>
            ) : (
              <ul className="mt-8 grid gap-5 md:grid-cols-2">
                {data.candidates.map((c) => (
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
                            <button type="button" className={`${btn} bg-brand-lime text-brand-navy hover:bg-brand-lime-soft`} onClick={() => setRequesting(c)}>
                              <CalendarCheck className="h-4 w-4" /> Request interview
                            </button>
                          )}
                          {c.hasCv ? (
                            <button
                              type="button"
                              className={`${btn} text-brand-navy ring-1 ring-inset ring-brand-navy/20 hover:bg-brand-navy/[0.04]`}
                              onClick={() => openCv(c)}
                              disabled={cvBusy === c.id}
                            >
                              {cvBusy === c.id ? <Spinner className="h-4 w-4" /> : <FileText className="h-4 w-4" />} View CV
                            </button>
                          ) : (
                            <span className="inline-flex h-10 items-center text-[13px] text-slate-400">CV available on request</span>
                          )}
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-10 text-center text-[13px] text-slate-500">
              This private page is for your hiring team. Please don’t share candidate details outside your organisation. Questions?{" "}
              <a className="font-medium text-brand-navy underline" href="mailto:hello@launchpath.co.za">hello@launchpath.co.za</a>
            </p>
          </>
        )}
      </main>

      {requesting && <RequestDialog token={token} candidate={requesting} onClose={() => setRequesting(null)} onDone={onRequested} />}
    </div>
  );
}

function RequestDialog({
  token,
  candidate,
  onClose,
  onDone,
}: {
  token: string;
  candidate: CandidateCardData;
  onClose: () => void;
  onDone: (id: number, already: boolean) => void;
}) {
  const [form, setForm] = useState({ requesterName: "", preferredTimes: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/shortlists/interview-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, candidateId: candidate.id, ...form }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "We couldn’t record your request.");
      if (!json.alreadyRequested) trackEmployerEvent("interview_requested", { page: "shortlist" });
      onDone(candidate.id, Boolean(json.alreadyRequested));
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-brand-navy outline-none focus:border-brand-navy focus:ring-4 focus:ring-brand-navy/10";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="req-title">
      <div className="absolute inset-0 bg-brand-navy/60" onClick={onClose} />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-t-[24px] bg-white p-6 shadow-2xl sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-4">
          <h2 id="req-title" className="text-lg font-semibold text-brand-navy">
            Request an interview with {candidate.name}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">LaunchPath will contact you and the candidate to arrange it. All fields are optional.</p>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="req-name" className="block text-[14px] font-medium text-brand-navy">Your name</label>
            <input id="req-name" ref={first} maxLength={120} className={`${input} h-11`} value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="req-times" className="block text-[14px] font-medium text-brand-navy">Times that suit you</label>
            <input id="req-times" maxLength={200} placeholder="e.g. Tuesday or Wednesday morning" className={`${input} h-11`} value={form.preferredTimes} onChange={(e) => setForm({ ...form, preferredTimes: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="req-msg" className="block text-[14px] font-medium text-brand-navy">Anything we should know</label>
            <textarea id="req-msg" rows={3} maxLength={1000} className={`${input} py-2.5`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
        </div>

        {error && (
          <p className="mt-4 flex items-center gap-2 text-sm text-red-600" role="alert">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={`${btn} text-slate-600 hover:bg-slate-100`}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={`${btn} bg-brand-navy text-white hover:bg-[#13295A]`}>
            {busy && <Spinner className="h-4 w-4" />} Send request
          </button>
        </div>
      </form>
    </div>
  );
}
