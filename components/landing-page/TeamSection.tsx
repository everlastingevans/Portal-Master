"use client";

import { useEffect, useState, useRef } from "react";
import { Briefcase, Users, GraduationCap, Rocket, Heart, Brain, Sparkles, Target, Eye, Compass, Shield, TrendingUp } from "lucide-react";
import { Reveal } from "./Reveal";

const tags = [
  { label: "Graduate-first", icon: GraduationCap },
  { label: "SME-friendly", icon: Briefcase },
  { label: "Skills-matched", icon: Target },
  { label: "Career-launching", icon: Rocket },
  { label: "Youth-led", icon: Users },
  { label: "Future-ready", icon: Compass },
  { label: "Purpose-driven", icon: Heart },
  { label: "Vetted", icon: Shield },
  { label: "Smart-hire", icon: Brain },
  { label: "Next-gen", icon: Sparkles },
  { label: "Growth-focused", icon: TrendingUp },
  { label: "Local impact", icon: Eye },
  { label: "Inclusive", icon: Users },
  { label: "Transparent", icon: Heart },
  { label: "Bold minds", icon: Sparkles },
];

export const TeamSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // 1. Onload Animation Trigger
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 2. Scroll-Trigger Animation Observer (Triggers when section enters viewport)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsSectionVisible(true);
        }
      },
      { 
        threshold: 0.15, // Triggers when 15% of the element is visible on screen
        rootMargin: "0px 0px -50px 0px"
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about-us" ref={sectionRef} className="bg-page px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1100px]">
        
        {/* Reactivated Marquee with smooth load-in fade */}
        {/* <div 
          className={`mb-20 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] transition-all duration-1000 transform ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="flex w-max animate-marquee whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex shrink-0 items-center">
                {Array.from({ length: 8 }).map((__, j) => (
                  <span key={j} className="flex items-center">
                    <span className="mx-8">Bold minds launch</span>
                    <span aria-hidden className="text-emerald-600">★</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div> */}

        <Reveal>
          <h2 className="text-center text-[40px] font-bold leading-[1.1] text-[#0A1B3D] md:text-[56px]">
           The hiring problem <span className="text-[#A6F23C]"> nobody </span>is solving properly.
          </h2>
        </Reveal>
        
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-[800px] text-center text-[17px] leading-relaxed text-[#0A1B3D]">
            You post a role. Four hundred CVs land in your inbox by Friday. Most are not relevant. You spend the weekend filtering. You interview five people. None of them are quite right. The role stays open another month.
            <br/>
            <br/>
            Meanwhile, somewhere in Soweto, a graduate has applied to her eighty-seventh job. She has heard back from three. She is starting to wonder if the problem is her.
            <br/>
            <br/>
            It isn’t.
            The talent exists. The hiring system is just broken in the middle. Companies cannot find the right people quickly. Candidates cannot get seen at all. Everyone loses.
          </p>
        </Reveal>

        {/* Staggered Scroll-Triggered Tag Grid Container */}
        <div className="mx-auto mt-12 flex max-w-[900px] flex-wrap justify-center gap-3">
          {tags.map((t, i) => {
            const Icon = t.icon;
            return (
              <span
                key={`${t.label}-${i}`}
                className={`inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-foreground ring-1 ring-[#A6F23C] cursor-default
                  transition-all duration-300 ease-out transform-gpu
                  hover:-translate-y-1.5 hover:scale-105 hover:shadow-md hover:shadow-[#A6F23C]/20`}
                style={{
                  opacity: isSectionVisible ? 1 : 0,
                  transform: isSectionVisible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.95)",
                  transitionProperty: "opacity, transform, background-color, box-shadow",
                  transitionDuration: "500ms",
                  transitionDelay: `${i * 40}ms`, // Staggers element reveals sequentially based on scroll trigger
                }}
              >
                <Icon className="h-4 w-4 text-foreground/80 transition-transform duration-300 group-hover:scale-110" />
                {t.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
};
