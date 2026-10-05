import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Marketing-site primitives. Navy (#0A1B3D) + lime (#A6F23C) on white/canvas. */
/*  Rhythm: sections py-24 md:py-32, container max-w-7xl, headings tight.      */
/* -------------------------------------------------------------------------- */

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium",
        tone === "dark" ? "bg-white/[0.06] text-brand-lime ring-1 ring-inset ring-white/10" : "bg-brand-navy/[0.05] text-brand-navy ring-1 ring-inset ring-brand-navy/10",
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", tone === "dark" ? "bg-brand-lime" : "bg-brand-navy")} />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cx(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        className={cx(
          "mt-5 text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[44px] lg:text-[52px]",
          tone === "dark" ? "text-white" : "text-brand-navy",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cx("mt-5 text-[17px] leading-relaxed", tone === "dark" ? "text-white/70" : "text-slate-600")}>{description}</p>
      )}
    </div>
  );
}

type CtaVariant = "lime" | "navy" | "outline-light" | "outline-dark" | "white";

const CTA_STYLES: Record<CtaVariant, string> = {
  lime: "bg-brand-lime text-brand-navy hover:bg-brand-lime-soft shadow-[0_8px_24px_-10px_rgba(166,242,60,0.6)]",
  navy: "bg-brand-navy text-white hover:bg-[#13295A] shadow-[0_8px_24px_-12px_rgba(10,27,61,0.5)]",
  "outline-light": "text-white ring-1 ring-inset ring-white/25 hover:bg-white/[0.06] hover:ring-white/40",
  "outline-dark": "text-brand-navy ring-1 ring-inset ring-brand-navy/20 hover:bg-brand-navy/[0.04] hover:ring-brand-navy/35",
  white: "bg-white text-brand-navy hover:bg-slate-50",
};

export function Cta({
  href,
  children,
  variant = "lime",
  arrow = false,
  className,
  track,
}: {
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  arrow?: boolean;
  className?: string;
  /** Analytics: CTA id and its position on the page (picked up by EmployerAnalytics) */
  track?: { cta: string; location: string };
}) {
  return (
    <Link
      href={href}
      data-track-cta={track?.cta}
      data-track-location={track?.location}
      className={cx(
        "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy",
        CTA_STYLES[variant],
        className,
      )}
    >
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
    </Link>
  );
}

/** Small avatar with initials, used inside the product preview mocks. */
export function MockAvatar({ name, tone = 0 }: { name: string; tone?: number }) {
  const palettes = ["bg-brand-navy text-brand-lime", "bg-brand-lime text-brand-navy", "bg-sky-100 text-sky-800", "bg-amber-100 text-amber-800"];
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", palettes[tone % palettes.length])}>{initials}</span>;
}
