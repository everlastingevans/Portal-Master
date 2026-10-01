"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import LaunchPathLogo from "@/components/LaunchPathLogo";
import { cx } from "./primitives";

export const Logo = () => <LaunchPathLogo />;

const navItems = [
  { label: "For employers", id: "employers" },
  { label: "For talent", id: "talent" },
  { label: "How it works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
  { label: "Contact", id: "contact" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Solid background once the user scrolls past the top of the hero
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently in view
  useEffect(() => {
    const observers = navItems.map((item) => {
      const el = document.getElementById(item.id);
      if (!el) return null;
      const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setActiveSection(item.id), {
        rootMargin: "-40% 0px -55% 0px",
      });
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  // Lock background scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || isOpen ? "bg-brand-navy/90 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <div className="relative z-50">
          <LaunchPathLogo className="h-9 sm:h-10" />
        </div>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <Link
                key={item.id}
                href={`/#${item.id}`}
                aria-current={active ? "true" : undefined}
                className={cx(
                  "relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
                  active ? "text-white" : "text-white/65 hover:text-white",
                )}
              >
                {item.label}
                <span
                  className={cx(
                    "absolute inset-x-4 -bottom-0.5 h-[2px] rounded-full bg-brand-lime transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="relative z-50 flex items-center gap-2">
          <Link href="/login" className="hidden h-10 items-center rounded-full px-4 text-[14px] font-medium text-white/80 transition-colors hover:text-white md:inline-flex">
            Log in
          </Link>
          <Link
            href="/portal"
            className="hidden h-10 items-center rounded-full bg-brand-lime px-5 text-[14px] font-semibold text-brand-navy transition-colors hover:bg-brand-lime-soft md:inline-flex"
          >
            Get started
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-full ring-1 ring-inset ring-white/15 lg:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            <span className={cx("h-0.5 w-5 rounded-full bg-white transition-all duration-300", isOpen && "translate-y-2 rotate-45")} />
            <span className={cx("h-0.5 w-5 rounded-full bg-white transition-all duration-300", isOpen && "opacity-0")} />
            <span className={cx("h-0.5 w-5 rounded-full bg-white transition-all duration-300", isOpen && "-translate-y-2 -rotate-45")} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cx(
          "fixed inset-0 top-[72px] z-40 bg-brand-navy px-5 pb-10 pt-6 transition-all duration-300 lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <nav className="flex flex-col" aria-label="Mobile">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={`/#${item.id}`}
              onClick={() => setIsOpen(false)}
              className="border-b border-white/[0.08] py-4 text-xl font-medium text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 grid gap-3">
          <Link href="/portal" onClick={() => setIsOpen(false)} className="flex h-12 items-center justify-center rounded-full bg-brand-lime text-base font-semibold text-brand-navy">
            Get started
          </Link>
          <Link href="/login" onClick={() => setIsOpen(false)} className="flex h-12 items-center justify-center rounded-full text-base font-medium text-white ring-1 ring-inset ring-white/20">
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
};
