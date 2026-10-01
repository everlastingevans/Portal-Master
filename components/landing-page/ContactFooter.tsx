"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import LaunchPathLogo from "@/components/LaunchPathLogo";
import { Spinner } from "@/components/PortalLoader";
import { Container, cx } from "./primitives";

const PHONE_DISPLAY = "+27 83 433 9350";
const PHONE_TEL = "+27834339350";
const EMAIL = "hello@launchpath.co.za";

const ROLES = ["Employer", "Recruiter or agency", "Job seeker", "Training partner"] as const;

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-brand-lime/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-brand-lime/10";

function Field({ label, htmlFor, optional, children }: { label: string; htmlFor: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-white/80">
        {label}
        {optional && <span className="ml-1 font-normal text-white/40">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

function ContactForm() {
  const [role, setRole] = useState<(typeof ROLES)[number]>("Employer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn’t send your message.");
      setStatus("sent");
    } catch (err: any) {
      setError(err.message || "We couldn’t send your message.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl bg-white/[0.04] p-10 text-center ring-1 ring-inset ring-white/10 animate-scale-in">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <p className="mt-6 text-2xl font-semibold text-white">Thanks, {form.name.split(" ")[0] || "we got it"}.</p>
        <p className="mt-2 max-w-sm text-[15px] text-white/60">Our team will be in touch at {form.email} soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl bg-white/[0.04] p-6 ring-1 ring-inset ring-white/10 sm:p-8">
      <fieldset>
        <legend className="mb-3 text-[13px] font-medium text-white/80">I’m a…</legend>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={cx(
                "h-9 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors",
                role === r ? "bg-brand-lime text-brand-navy" : "text-white/70 ring-1 ring-inset ring-white/15 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name">
          <input id="c-name" required autoComplete="name" className={cx(fieldClass, "h-12")} value={form.name} onChange={set("name")} placeholder="Your name" />
        </Field>
        <Field label="Email" htmlFor="c-email">
          <input id="c-email" type="email" required autoComplete="email" className={cx(fieldClass, "h-12")} value={form.email} onChange={set("email")} placeholder="you@company.co.za" />
        </Field>
        <Field label="Phone" htmlFor="c-phone" optional>
          <input id="c-phone" type="tel" autoComplete="tel" className={cx(fieldClass, "h-12")} value={form.phone} onChange={set("phone")} placeholder="+27 82 123 4567" />
        </Field>
        <Field label={role === "Job seeker" ? "Where you studied" : "Company"} htmlFor="c-company" optional>
          <input id="c-company" className={cx(fieldClass, "h-12")} value={form.company} onChange={set("company")} placeholder={role === "Job seeker" ? "e.g. University of Johannesburg" : "Company name"} />
        </Field>
      </div>

      <Field label="How can we help?" htmlFor="c-message">
        <textarea
          id="c-message"
          required
          rows={4}
          className={cx(fieldClass, "resize-none py-3 leading-relaxed")}
          value={form.message}
          onChange={set("message")}
          placeholder={role === "Job seeker" ? "Tell us what kind of role you’re looking for" : "Tell us about the roles you’re hiring for"}
        />
      </Field>

      {status === "error" && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/20">
          {error} You can also email us at{" "}
          <a href={`mailto:${EMAIL}`} className="font-medium underline underline-offset-2">
            {EMAIL}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-lime text-[15px] font-semibold text-brand-navy transition-colors hover:bg-brand-lime-soft disabled:cursor-wait disabled:opacity-70"
      >
        {status === "sending" ? (
          <>
            <Spinner /> Sending…
          </>
        ) : (
          <>
            Send message <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-white/40">We only use your details to reply to you, in line with POPIA.</p>
    </form>
  );
}

const FOOTER_LINKS = [
  {
    title: "Platform",
    links: [
      { label: "For employers", href: "/#employers" },
      { label: "For talent", href: "/#talent" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Create an account", href: "/portal" },
      { label: "Post a role", href: "/register?type=client" },
      { label: "Find a job", href: "/register?type=talent" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/#about-us" },
      { label: "FAQ", href: "/#faq" },
      { label: "Contact", href: "/#contact" },
    ],
  },
];

export const ContactFooter = () => (
  <footer className="bg-brand-navy">
    <section id="contact" className="scroll-mt-20 py-24 md:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-[13px] font-medium text-brand-lime ring-1 ring-inset ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-lime" /> Contact
            </span>
            <h2 className="mt-5 text-[34px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[44px]">Let’s line up your next great hire.</h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/65">
              Tell us about your team and the roles you need to fill. Recruiters, partners and job seekers are welcome too.
            </p>

            <ul className="mt-10 space-y-4">
              <li>
                <a href={`tel:${PHONE_TEL}`} className="group flex items-center gap-4 text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-brand-lime ring-1 ring-inset ring-white/10">
                    <Phone className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-lg font-medium transition-colors group-hover:text-brand-lime">{PHONE_DISPLAY}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="group flex items-center gap-4 text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-brand-lime ring-1 ring-inset ring-white/10">
                    <Mail className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-lg font-medium transition-colors group-hover:text-brand-lime">{EMAIL}</span>
                </a>
              </li>
              <li className="flex items-center gap-4 text-white/70">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-brand-lime ring-1 ring-inset ring-white/10">
                  <MapPin className="h-[18px] w-[18px]" />
                </span>
                <span className="text-lg">South Africa</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>

    <div className="border-t border-white/[0.08]">
      <Container className="py-14">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <LaunchPathLogo className="h-10" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
              Hiring infrastructure connecting South African graduates with the growing businesses that need them.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7" aria-label="Footer">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-semibold text-white">{group.title}</p>
                <ul className="mt-4 space-y-3">
                  {group.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-white/55 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.08] pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LaunchPath. All rights reserved.</p>
          <p>We process personal information in line with POPIA.</p>
        </div>
      </Container>
    </div>
  </footer>
);
