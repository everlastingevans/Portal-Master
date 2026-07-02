"use client";

import Link from "next/link";
import Image from "next/image"; 
import { usePathname } from "next/navigation";
import LaunchPathLogo from "../../assets/logo/launchpath.png";
import { useState, useEffect } from "react";

export const Logo = ({ color = "white" }: { color?: string }) => {
  const isLightText = color === "white";
  return (
    <Link href="/" className="group flex items-center" aria-label="LaunchPath home">
      <div className="relative h-[35px] sm:h-[46px] w-auto transition-all duration-500 group-hover:rotate-[-2deg] group-hover:scale-[1.03]">
        <Image 
          src={LaunchPathLogo} 
          alt="LaunchPath Logo" 
          height={46} 
          priority 
          className={`h-full w-auto object-contain transition-all duration-300 ${
            isLightText ? "" : "brightness-95 contrast-125"
          }`} 
        />
      </div>
    </Link>
  );
};

const navItems = [
  { label: "Home", href: "/" },
  { label: "What We Do", href: "/what-we-do" },
  { label: "About us", href: "/about-us" },
  { label: "Contact", href: "/contact" },
];

interface HeaderProps {
  variant?: "light" | "dark";
}

export const Header = ({ variant = "light" }: HeaderProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const onDark = variant === "light"; 

  // Close mobile drawer automatically when navigating to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  return (
    <header className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 md:px-14 md:py-8">
        
        {/* LOGO: Forced to z-50 so it stays above the open menu screen */}
        <div className="relative z-50">
          <Logo color={isOpen ? "black" : onDark ? "white" : "hsl(var(--foreground))"} />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link 
                key={item.label} 
                href={item.href} 
                className={`rounded-full px-6 py-3 text-[15px] font-medium transition ${
                  active 
                    ? "bg-[#5D3FD3] text-white" 
                    : onDark 
                      ? "text-white/95 hover:text-white" 
                      : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CONTROLS WRAPPER: Forced to z-50 to ensure button stays on top */}
        <div className="flex items-center gap-4 relative z-50">
          {/* Desktop Only CTA */}
          <Link 
            href="/portal" 
            className="shine group relative hidden md:inline-flex overflow-hidden rounded-full bg-[#5D3FD3] px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]"
          >
            <span className="relative z-10">Visit Portal</span>
          </Link>

          {/* Mobile Hamburger / Close Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full md:hidden border border-transparent focus:outline-none"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <span 
              className={`h-0.5 w-6 rounded-full transition-all duration-300 ${
                isOpen 
                  ? "translate-y-2 rotate-45 bg-black" 
                  : onDark ? "bg-white" : "bg-black"
              }`} 
            />
            <span 
              className={`h-0.5 w-6 rounded-full transition-all duration-300 ${
                isOpen ? "opacity-0 bg-black" : onDark ? "bg-white" : "bg-black"
              }`} 
            />
            <span 
              className={`h-0.5 w-6 rounded-full transition-all duration-300 ${
                isOpen 
                  ? "-translate-y-2 -rotate-45 bg-black" 
                  : onDark ? "bg-white" : "bg-black"
              }`} 
            />
          </button>
        </div>

        {/* Mobile Navigation Drawer Overlay (Sits at z-40, below the button) */}
        <div 
          className={`fixed inset-0 z-40 bg-white backdrop-blur-md transition-all duration-300 md:hidden ${
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <nav className="flex h-full flex-col items-start justify-center gap-6 px-8 text-2xl font-semibold">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link 
                  key={item.label} 
                  href={item.href}
                  className={`transition-colors duration-200 ${
                    active ? "text-[#5D3FD3]" : "text-black/80 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link 
              href="/portal" 
              className="mt-4 w-full rounded-full bg-[#5D3FD3] py-4 text-center text-lg font-semibold text-white shadow-lg"
            >
              Visit Portal
            </Link>
          </nav>
        </div>

      </div>
    </header>
  );
};
