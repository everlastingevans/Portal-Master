"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/PortalLoader";
import { trackEmployerEvent } from "@/lib/analytics";
import { ROLE_CATEGORIES } from "@/lib/hire/vacancy";

const input = "w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-brand-navy outline-none focus:border-brand-navy focus:ring-4 focus:ring-brand-navy/10";
function newKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** "Talk to LaunchPath" bulk hiring enquiry. Creates a programme enquiry for operations; no checkout. */
export function BulkEnquiryForm() {
  const [form, setForm] = useState({ companyName: "", contactName: "", workEmail: "", phone: "", targetHires: "", locations: "", requirements: "", startBy: "" });
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const key = useRef("");
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    key.current = newKey();
    startedAt.current = Date.now();
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setFormError("");
    try {
      const r = await fetch("/api/programmes/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, targetHires: Number(form.targetHires), roleCategories: categories, submissionKey: key.current, website: honeypot.current?.value || "", formStartedAt: startedAt.current }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) {
        setErrors(j.errors || {});
        throw new Error(j.error || "We couldn’t send your enquiry.");
      }
      if (!j.duplicate) trackEmployerEvent("employer_cta_click", { page: "bulk_hiring", cta: "bulk_enquiry_submitted" });
      setStatus("done");
    } catch (err: any) {
      setFormError(err.message);
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-[24px] bg-white p-8 text-center ring-1 ring-slate-200/80" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#5E8C14]" />
        <h2 className="mt-4 text-2xl font-semibold text-brand-navy">Thanks, we’ve received your enquiry</h2>
        <p className="mt-3 text-[15px] leading-relaxed">Someone from LaunchPath will contact you to understand the roles, numbers and timing, and to agree pricing before anything starts.</p>
      </div>
    );
  }

  const field = (k: keyof typeof form, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => (
    <div className="space-y-1.5">
      <label htmlFor={`b-${k}`} className="block text-[14px] font-medium text-brand-navy">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      <input id={`b-${k}`} value={form[k]} onChange={set(k)} className={`${input} h-12`} aria-invalid={errors[k] ? true : undefined} aria-describedby={errors[k] ? `b-${k}-err` : undefined} {...extra} />
      {errors[k] && (
        <p id={`b-${k}-err`} className="text-[13px] text-red-600">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <form noValidate onSubmit={submit} className="relative rounded-[24px] bg-white p-6 ring-1 ring-slate-200/80 sm:p-8">
      <h2 className="text-xl font-semibold text-brand-navy">Talk to LaunchPath</h2>
      {formError && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          <AlertCircle className="h-4 w-4" /> {formError}
        </p>
      )}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="b-website">Website</label>
        <input ref={honeypot} id="b-website" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {field("companyName", "Company name", { autoComplete: "organization" })}
        {field("contactName", "Your name", { autoComplete: "name" })}
        {field("workEmail", "Work email", { type: "email", autoComplete: "email" })}
        {field("phone", "Phone number", { type: "tel", autoComplete: "tel" }, true)}
        {field("targetHires", "Roughly how many hires?", { inputMode: "numeric" })}
        {field("startBy", "Start by", { type: "date" }, true)}
      </div>
      <fieldset className="mt-5">
        <legend className="text-[14px] font-medium text-brand-navy">Role areas</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROLE_CATEGORIES.map((c) => (
            <label key={c.value} className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 ring-inset ${categories.includes(c.value) ? "bg-brand-navy text-white ring-brand-navy" : "text-brand-navy ring-slate-300"}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={categories.includes(c.value)}
                onChange={(e) => setCategories(e.target.checked ? [...categories, c.value] : categories.filter((x) => x !== c.value))}
              />
              {c.value === "OTHER" ? "Other" : c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-5">{field("locations", "Locations", {}, true)}</div>
      <div className="mt-5 space-y-1.5">
        <label htmlFor="b-req" className="block text-[14px] font-medium text-brand-navy">
          About the roles
        </label>
        <textarea id="b-req" rows={5} value={form.requirements} onChange={set("requirements")} className={`${input} py-3`} aria-invalid={errors.requirements ? true : undefined} />
        {errors.requirements && <p className="text-[13px] text-red-600">{errors.requirements}</p>}
      </div>
      <p className="mt-5 text-xs text-slate-500">We’ll use these details only to discuss this hiring programme with you, in line with POPIA.</p>
      <button type="submit" disabled={status === "sending"} className="mt-5 inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-brand-lime px-6 font-semibold text-brand-navy disabled:opacity-70">
        {status === "sending" && <Spinner className="h-4 w-4" />} Talk to LaunchPath
      </button>
    </form>
  );
}
