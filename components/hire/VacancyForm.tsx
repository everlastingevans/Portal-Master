"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/PortalLoader";
import { trackEmployerEvent } from "@/lib/analytics";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  ROLE_CATEGORIES,
  VacancyErrors,
  WORK_ARRANGEMENTS,
  validateVacancyInput,
} from "@/lib/hire/vacancy";
import { cx } from "@/components/landing-page/primitives";

type FieldName =
  | "companyName"
  | "contactName"
  | "workEmail"
  | "phone"
  | "roleTitle"
  | "roleCategory"
  | "roleCategoryOther"
  | "location"
  | "workArrangement"
  | "salaryMin"
  | "salaryMax"
  | "employmentType"
  | "requiredExperience"
  | "keySkills"
  | "startDate"
  | "description";

const EMPTY: Record<FieldName, string> = {
  companyName: "",
  contactName: "",
  workEmail: "",
  phone: "",
  roleTitle: "",
  roleCategory: "",
  roleCategoryOther: "",
  location: "",
  workArrangement: "",
  salaryMin: "",
  salaryMax: "",
  employmentType: "",
  requiredExperience: "",
  keySkills: "",
  startDate: "",
  description: "",
};

// Field order, used to focus the first invalid field
const ORDER: FieldName[] = Object.keys(EMPTY) as FieldName[];

function newKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // RFC 4122 v4 fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const inputClass = (invalid?: boolean) =>
  cx(
    "w-full rounded-xl border bg-white px-4 text-[15px] text-brand-navy placeholder:text-slate-400 outline-none transition-colors focus:ring-4",
    invalid ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-brand-navy focus:ring-brand-navy/10",
  );

type Status = "idle" | "submitting" | "success" | "duplicate";

export function VacancyForm({ initialCategory, initialRoleTitle }: { initialCategory?: string; initialRoleTitle?: string }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, roleCategory: initialCategory || "", roleTitle: initialRoleTitle || "" }));
  const [errors, setErrors] = useState<VacancyErrors>({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ reference: number | null; emailSent: boolean }>({ reference: null, emailSent: false });

  // Kept across retries so a retried request after a network blip can't create a second vacancy
  const submissionKey = useRef("");
  const startedAt = useRef(0);
  const startTracked = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    submissionKey.current = newKey();
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status === "success" || status === "duplicate") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      doneRef.current?.focus();
    }
  }, [status]);

  const onStart = () => {
    if (startTracked.current) return;
    startTracked.current = true;
    trackEmployerEvent("vacancy_form_start", { page: "find_candidates" });
  };

  const set = (k: FieldName) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((errs) => ({ ...errs, [k]: undefined }));
  };

  const showErrors = (errs: VacancyErrors, message: string) => {
    setErrors(errs);
    setFormError(message);
    const first = ORDER.find((k) => errs[k]);
    requestAnimationFrame(() => {
      if (first) document.getElementById(`vf-${first}`)?.focus();
      else summaryRef.current?.focus();
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    const payload = { ...form, submissionKey: submissionKey.current };
    const check = validateVacancyInput(payload);
    if (!check.ok) {
      showErrors(check.errors, "Please check the highlighted fields.");
      return;
    }

    setStatus("submitting");
    setFormError("");
    try {
      const res = await fetch("/api/vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, website: honeypot.current?.value || "", formStartedAt: startedAt.current }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201 && data.success && !data.duplicate) {
        // The only place a successful-submission event is fired
        trackEmployerEvent("vacancy_submitted", { page: "find_candidates", role_category: form.roleCategory });
        setResult({ reference: data.reference, emailSent: Boolean(data.confirmationEmailSent) });
        setStatus("success");
        return;
      }
      if (res.ok && data.success && data.duplicate) {
        setResult({ reference: data.reference ?? null, emailSent: false });
        setStatus("duplicate");
        return;
      }
      setStatus("idle");
      showErrors(data.errors || {}, data.error || "We couldn’t submit your vacancy. Please try again.");
    } catch {
      setStatus("idle");
      showErrors({}, "We couldn’t reach LaunchPath. Check your connection and try again. Your details are still here.");
    }
  };

  if (status === "success" || status === "duplicate") {
    const duplicate = status === "duplicate";
    return (
      <div className="rounded-[28px] bg-white p-8 text-center shadow-[0_32px_64px_-32px_rgba(10,27,61,0.35)] ring-1 ring-slate-200/70 sm:p-12" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 ref={doneRef} tabIndex={-1} className="mt-6 text-[28px] font-semibold tracking-tight text-brand-navy outline-none sm:text-[32px]">
          {duplicate ? "We already have this vacancy" : "Thanks, we’ve received your vacancy"}
        </h2>
        {result.reference && (
          <p className="mt-3 text-[15px] text-slate-500">
            Your reference: <span className="font-semibold tabular-nums text-brand-navy">#{result.reference}</span>
          </p>
        )}
        <div className="mx-auto mt-6 max-w-lg space-y-4 text-left text-[15px] leading-relaxed text-slate-600">
          {duplicate ? (
            <p>This role was already submitted recently, so we haven’t created a second request. Our team will be in touch about it.</p>
          ) : (
            <p>
              <strong className="text-brand-navy">What happens next:</strong> someone from LaunchPath will contact you, usually by phone, to calibrate the role: what success looks
              like, the must-have skills and anything that would rule a candidate out.
            </p>
          )}
          <p>Once the role is calibrated, our target for serviceable roles is a shortlist of 3–5 screened candidates within five working days. There’s nothing to pay unless you hire.</p>
          {!duplicate && (
            <p className="text-sm text-slate-500">
              {result.emailSent
                ? "We’ve also emailed a confirmation to the address you gave us."
                : "Please keep your reference number. If you don’t hear from us within one working day, email hello@launchpath.co.za."}
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand-navy px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#13295A]"
          >
            Back to LaunchPath
          </Link>
        </div>
      </div>
    );
  }

  const field = (name: FieldName) => ({
    id: `vf-${name}`,
    name,
    value: form[name],
    onChange: set(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `vf-${name}-error` : undefined,
  });

  return (
    <form
      noValidate
      onSubmit={submit}
      onFocusCapture={onStart}
      className="relative rounded-[28px] bg-white p-6 shadow-[0_32px_64px_-32px_rgba(10,27,61,0.35)] ring-1 ring-slate-200/70 sm:p-10"
      aria-labelledby="vacancy-form-title"
    >
      <h2 id="vacancy-form-title" className="text-[22px] font-semibold tracking-tight text-brand-navy">
        Tell us who you’re hiring
      </h2>
      <p className="mt-1.5 text-sm text-slate-500">Takes about three minutes. All fields are required unless marked optional.</p>

      {formError && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200 outline-none"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      {/* Honeypot: hidden from people and assistive tech, filled in by naive bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="vf-website">Website</label>
        <input ref={honeypot} id="vf-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <fieldset className="mt-8">
        <legend className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">About you</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Company name" name="companyName" error={errors.companyName}>
            <input {...field("companyName")} type="text" autoComplete="organization" maxLength={160} className={cx(inputClass(!!errors.companyName), "h-12")} />
          </Field>
          <Field label="Your name" name="contactName" error={errors.contactName}>
            <input {...field("contactName")} type="text" autoComplete="name" maxLength={120} className={cx(inputClass(!!errors.contactName), "h-12")} />
          </Field>
          <Field label="Work email" name="workEmail" error={errors.workEmail}>
            <input {...field("workEmail")} type="email" autoComplete="email" inputMode="email" maxLength={200} className={cx(inputClass(!!errors.workEmail), "h-12")} />
          </Field>
          <Field label="Phone number" name="phone" error={errors.phone}>
            <input {...field("phone")} type="tel" autoComplete="tel" inputMode="tel" maxLength={40} placeholder="082 123 4567" className={cx(inputClass(!!errors.phone), "h-12")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">About the role</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Role title" name="roleTitle" error={errors.roleTitle}>
            <input {...field("roleTitle")} type="text" maxLength={120} placeholder="e.g. Junior Sales Consultant" className={cx(inputClass(!!errors.roleTitle), "h-12")} />
          </Field>
          <Field label="Role category" name="roleCategory" error={errors.roleCategory}>
            <select {...field("roleCategory")} className={cx(inputClass(!!errors.roleCategory), "h-12")}>
              <option value="">Choose a category</option>
              {ROLE_CATEGORIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {form.roleCategory === "OTHER" && (
            <Field label="What kind of role is it?" name="roleCategoryOther" error={errors.roleCategoryOther} className="sm:col-span-2">
              <input {...field("roleCategoryOther")} type="text" maxLength={80} placeholder="e.g. Customer service, Admin, Logistics" className={cx(inputClass(!!errors.roleCategoryOther), "h-12")} />
            </Field>
          )}
          <Field label="Location" name="location" error={errors.location}>
            <input {...field("location")} type="text" maxLength={120} placeholder="e.g. Sandton, Johannesburg" className={cx(inputClass(!!errors.location), "h-12")} />
          </Field>
          <Field label="On-site, hybrid or remote" name="workArrangement" error={errors.workArrangement}>
            <select {...field("workArrangement")} className={cx(inputClass(!!errors.workArrangement), "h-12")}>
              <option value="">Choose one</option>
              {WORK_ARRANGEMENTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monthly salary from (gross)" name="salaryMin" error={errors.salaryMin}>
            <RandInput {...field("salaryMin")} placeholder="12 000" invalid={!!errors.salaryMin} />
          </Field>
          <Field label="Monthly salary to (gross)" name="salaryMax" error={errors.salaryMax}>
            <RandInput {...field("salaryMax")} placeholder="16 000" invalid={!!errors.salaryMax} />
          </Field>
          <Field label="Employment type" name="employmentType" error={errors.employmentType}>
            <select {...field("employmentType")} className={cx(inputClass(!!errors.employmentType), "h-12")}>
              <option value="">Choose one</option>
              {EMPLOYMENT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Experience required" name="requiredExperience" error={errors.requiredExperience}>
            <select {...field("requiredExperience")} className={cx(inputClass(!!errors.requiredExperience), "h-12")}>
              <option value="">Choose one</option>
              {EXPERIENCE_LEVELS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Key skills" name="keySkills" error={errors.keySkills} hint="Separate skills with commas, e.g. Excel, cold calling, CRM" className="sm:col-span-2">
            <input {...field("keySkills")} type="text" maxLength={800} className={cx(inputClass(!!errors.keySkills), "h-12")} />
          </Field>
          <Field label="Desired start date" name="startDate" error={errors.startDate} optional hint="Leave blank if you’re flexible">
            <input {...field("startDate")} type="date" min={new Date().toISOString().slice(0, 10)} className={cx(inputClass(!!errors.startDate), "h-12")} />
          </Field>
          <Field
            label="Short role description"
            name="description"
            error={errors.description}
            hint="What will they do day to day, and what would make someone great in this role?"
            className="sm:col-span-2"
          >
            <textarea {...field("description")} rows={5} maxLength={3000} className={cx(inputClass(!!errors.description), "py-3")} />
          </Field>
        </div>
      </fieldset>

      <p className="mt-8 text-xs leading-relaxed text-slate-500">
        We’ll use these details only to contact you about this vacancy and to find candidates for it, in line with POPIA. Submitting is free and doesn’t commit you to anything.
      </p>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-lime px-6 text-[15px] font-semibold text-brand-navy shadow-[0_8px_24px_-10px_rgba(166,242,60,0.6)] transition-colors hover:bg-brand-lime-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            <Spinner className="h-4 w-4" /> Submitting…
          </>
        ) : (
          <>
            Find Candidates <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  optional,
  className,
  children,
}: {
  label: string;
  name: FieldName;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("space-y-2", className)}>
      <label htmlFor={`vf-${name}`} className="block text-[14px] font-medium text-brand-navy">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`vf-${name}-error`} className="flex items-center gap-1.5 text-[13px] text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

function RandInput({ invalid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-slate-400">
        R
      </span>
      <input {...props} type="text" inputMode="numeric" maxLength={9} className={cx(inputClass(invalid), "h-12 pl-9")} />
    </div>
  );
}
