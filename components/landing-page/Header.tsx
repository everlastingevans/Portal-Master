"use client";

import Link from "next/link";
import Image from "next/image";
import LaunchPathLogo from "@/assets/logo/launchpath-main.png";
import { useState, useEffect } from "react";

export const Logo = () => {
  return (
    <Link href="/" className="group flex items-center" aria-label="LaunchPath home">
      <div className="relative h-[58px] sm:h-[64px] w-auto transition-transform duration-300 group-hover:scale-102">
        <Image 
          src={LaunchPathLogo} 
          alt="LaunchPath Logo" 
          height={40} 
          priority 
          className="h-[50px] w-[150px] object-contain"
        />
      </div>
    </Link>
  );
};

const navItems = [
  { label: "Home", id: "top", href: "/#top" },
  { label: "About Us", id: "about-us", href: "/#about-us" },
  { label: "What We Do", id: "what-we-do", href: "/#what-we-do" },
  { label: "Contact", id: "contact", href: "/#contact" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");

  // Track which section is currently on screen to update the active background state
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(item.id);
          }
        },
        { 
          rootMargin: "-20% 0px -60% 0px" // Triggers when the section takes up the central viewport area
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  // Sync hash fallback if user directly clicks a link
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveSection(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A1B3D]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-12 md:py-5">
        
        {/* LOGO */}
        <div className="relative z-50">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <Link 
                key={item.label} 
                href={item.href} 
                onClick={() => {
                  setActiveSection(item.id);
                  setIsOpen(false);
                }}
                className={`rounded-full px-5 py-2 text-[14px] font-medium transition-all duration-200 ${
                  active 
                    ? "bg-[#A6F23C] text-[#0A1B3D] shadow-md font-semibold" 
                    : "text-white/80 hover:bg-[#C8FF7A] hover:text-[#0A1B3D]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CONTROLS WRAPPER */}
        <div className="flex items-center gap-4 relative z-50">
          {/* Desktop Only CTA */}
          <Link 
            href="/portal" 
            className="group relative hidden md:inline-flex items-center justify-center overflow-hidden rounded-full bg-[#A6F23C] px-6 py-2.5 text-[14px] font-semibold text-[#0A1B3D] shadow-lg transition-all duration-300 hover:bg-[#C8FF7A] hover:scale-[1.03]"
          >
            Visit Portal
          </Link>

          {/* Mobile Hamburger / Close Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full md:hidden border border-white/10 bg-white/5 focus:outline-none" 
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <span className={`h-0.5 w-5 rounded-full transition-all duration-300 bg-white ${
              isOpen ? "translate-y-2 rotate-45" : ""
            }`} />
            <span className={`h-0.5 w-5 rounded-full transition-all duration-300 bg-white ${
              isOpen ? "opacity-0" : ""
            }`} />
            <span className={`h-0.5 w-5 rounded-full transition-all duration-300 bg-white ${
              isOpen ? "-translate-y-2 -rotate-45" : ""
            }`} />
          </button>
        </div>

        {/* Mobile Navigation Drawer Overlay */}
        <div className={`fixed inset-0 z-40 bg-[#0A1B3D] transition-all duration-300 md:hidden flex flex-col justify-center px-8 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`} >
          <nav className="flex flex-col gap-4 text-xl font-medium w-full">
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsOpen(false);
                  }}
                  className={`transition-all rounded-xl px-4 py-3 duration-200 ${
                    active 
                      ? "bg-[#A6F23C] text-[#0A1B3D] font-semibold" 
                      : "text-white/80 hover:bg-[#C8FF7A] hover:text-[#0A1B3D]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link 
              href="/portal" 
              className="mt-6 w-full rounded-full bg-[#A6F23C] py-3.5 text-center text-base font-semibold text-[#0A1B3D] shadow-lg hover:bg-[#C8FF7A]"
            >
              Visit Portal
            </Link>
          </nav>
        </div>

      </div>
    </header>
  );
};
