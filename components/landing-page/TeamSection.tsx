"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image"; // Added for rendering partner logos cleanly
import { Briefcase, Users, GraduationCap, Rocket, Heart, Brain, Sparkles, Target, Eye, Compass, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

// Placeholder imports for logos matching the image. Replace these string paths with your real image imports if needed.
const UNIVERSITY_PARTNERS = [
  { name: "Regent Business School", src: "/logos/regent.png" },
  { name: "Richfield", src: "/logos/richfield.png" },
  { name: "Melsoft Academy", src: "/logos/melsoft.png" },
  { name: "Umuzi", src: "/logos/umuzi.png" },
  { name: "Code Girls Academy", src: "/logos/codegirls.png" },
  { name: "Capacitia", src: "/logos/capacita.png" },
];

const HIRING_PARTNERS = [
  { name: "Trenchless Technologies", src: "/trenchless.png" },
  { name: "Checkers", src: "/checkers.jpg" },
  { name: "Idilli", src: "/idili.avif" },
];

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
        <div className="mx-auto mt-2 flex max-w-[900px] flex-wrap justify-center gap-3">
          {tags.map((t, i) => {
            const Icon = t.icon;
            return (
              <span
                key={`${t.label}-${i}`}
                className={`inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-foreground ring-1 ring-[#A6F23C] cursor-default
                  transition-all duration-300 ease-out transform-gpu
                  hover:-translate-y-1.5 hover:scale-105`}
                style={{
                  opacity: isSectionVisible ? 1 : 0,
                  transform: isSectionVisible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.95)",
                  transitionProperty: "opacity, transform, background-color",
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

        {/* Integrated Partner Logos Layout Section from Image */}
        <Reveal delay={240}>
          <div className="mt-20 border border-slate-100 bg-white rounded-3xl p-2 md:p-2 text-center">
            
            <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase font-mono">
              Our Partners
            </span>
            
            <h3 className="mt-3 text-2xl md:text-3xl font-bold text-[#0A1B3D] tracking-tight">
              Working together to move talent into work
            </h3>
            
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-500">
              LaunchPath works with universities, training providers and hiring partners to help young South Africans move from learning into meaningful employment.
            </p>

            {/* Split layout grid: University vs Hiring Partners */}
            <div className="mt-12 grid md:grid-cols-2 gap-12 text-left relative">
              {/* Optional divider line matching the UI layout image */}
              <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-100" />

              {/* Left Column: Universities */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                  <GraduationCap className="h-5 w-5 text-[#0A1B3D]" />
                  <h4 className="font-bold text-[#0A1B3D] text-[15px]">University & Training Partners</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {UNIVERSITY_PARTNERS.map((logo, i) => (
                    <div key={i} className="flex items-center justify-center h-16 px-4 transition-all">
                      <div className="relative w-40 h-20 opacity-80 hover:opacity-100 transition-opacity">
                        <Image src={logo.src} alt={logo.name} fill className="object-contain" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Hiring Corporates */}
              <div className="space-y-6 md:pl-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <h4 className="font-bold text-[#0A1B3D] text-[15px]">Hiring Partners</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {HIRING_PARTNERS.map((logo, i) => (
                    <div key={i} className="flex items-center justify-center h-16 px-4 bg-white border border-slate-100 rounded-xl transition-all">
                      <div className="relative w-full h-8 opacity-80 hover:opacity-100 transition-opacity">
                        <Image src={logo.src} alt={logo.name} fill className="object-contain" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Call to Action Button Layout */}
            <div className="mt-12 flex justify-center">
              <a
                href="#partner"
                className="inline-flex items-center gap-2 bg-[#A6F23C] hover:bg-[#024d64] text-[#0A1B3D] py-3 px-6 text-sm font-semibold rounded-full transition-colors cursor-pointer"
              >
                Partner with LaunchPath <ArrowRight className="h-4 w-4" />
              </a>
            </div>

          </div>
        </Reveal>

      </div>
      </section>
    
  );
};
