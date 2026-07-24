"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/landing-page/Reveal";
import HeroImage from "@/assets/models/models1.jpg";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger animations immediately when the components mount on screen
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    /* Full width background wrapper layout */
    <div className="w-full bg-[#0A1B3D]">
      <div className=" mx-auto px-6 sm:px-8 lg:px-12 pt-24 sm:pt-48 pb-16">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left side: Vision, Core Mission, CTA */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <Reveal>
              <div 
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 mb-2 transition-all duration-700 ease-out transform ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                }`}
              >
                <span className="text-[15px] font-extrabold text-[#C8FF7A] uppercase tracking-widest font-mono">
                  LaunchPath Platform Vision
                </span>
              </div>
            </Reveal>

            <div className="space-y-4">
              <Reveal delay={80}>
                <h1 
                  className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white transition-all duration-1000 delay-100 ease-out transform ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  The bridge between <span className="text-[#A6F23C]">overlooked talent</span> and growing businesses
                </h1>
              </Reveal>
              
              <Reveal delay={120}>
                <p 
                  className={`text-base sm:text-[15px] text-white leading-relaxed max-w-2xl transition-all duration-1000 delay-300 ease-out transform ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                >
                  LaunchPath is not just a job board. It is a hiring infrastructure platform built to solve two massive market failures: helping South African graduates access meaningful work opportunities, and enabling SMEs to hire quality entry-level talent efficiently and affordably.
                </p>
              </Reveal>
            </div>

            {/* CTAs */}
            <Reveal delay={200}>
              <div 
                className={`flex flex-wrap gap-4 transition-all duration-1000 delay-500 ease-out transform ${
                  isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <a
                  href="#portal-gateways"
                  className="bg-[#A6F23C] hover:bg-[#C8FF7A] text-[#0A1B3D] py-3.5 px-7 text-[15px] rounded-full font-semibold transition-all hover:scale-[1.02] text-sm shadow-lg shadow-[#A6F23C]/10 flex items-center gap-2 cursor-pointer"
                >
                  Access Gateways <ArrowRight className="w-4 h-4 animate-pulse" />
                </a>
              </div>
            </Reveal>
          </div>

          {/* Right side: Styled custom hero image with a clean visual overlay */}
          <div className="lg:col-span-5 relative">
            <Reveal delay={250} className="w-full flex justify-center">
              <div 
                className={`relative w-full max-w-md aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[36px] overflow-hidden border-4 border-slate-900 shadow-2xl transition-all duration-1200 delay-200 ease-out transform ${
                  isLoaded ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-12 scale-95"
                }`}
              >
                <Image
                  src={HeroImage}
                  alt="LaunchPath Core Vision"
                  fill
                  priority
                  sizes="(max-w-768px) 100vw, 40vw"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Glassmorphic overlay displaying the Core Mission */}
                <div 
                  className={`absolute bottom-5 left-5 right-5 bg-black/75 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1 transition-all duration-700 delay-700 ease-out transform ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <span className="text-[10px] font-extrabold text-[#A6F23C] uppercase tracking-widest font-mono">Core Mission Statement</span>
                  <p className="text-[15px] text-white leading-relaxed">
                    &ldquo;To become Africa&apos;s leading early-career hiring platform that uses technology, data, and automation to connect talent to opportunity faster than traditional methods.&rdquo;
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </div>
  );
};
