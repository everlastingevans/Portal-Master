import type { Metadata } from "next";
import { Header } from "@/components/landing-page/Header";
import { HeroSection } from "@/components/landing-page/HeroSection";
import { PartnersSection } from "@/components/landing-page/PartnersSection";
import { ProblemSection } from "@/components/landing-page/ProblemSection";
import { HowItWorksSection } from "@/components/landing-page/HowItWorksSection";
import { EmployersSection } from "@/components/landing-page/EmployersSection";
import { TalentSection } from "@/components/landing-page/TalentSection";
import { StrategySection } from "@/components/landing-page/StrategySection";
import { EmployerPricingSection } from "@/components/landing-page/EmployerPricingSection";
import { TestimonialSection } from "@/components/landing-page/TestimonialSection";
import { FaqSection } from "@/components/landing-page/FaqSection";
import { ContactFooter } from "@/components/landing-page/ContactFooter";

export const metadata: Metadata = {
  title: "LaunchPath | Hire vetted graduate talent in South Africa",
  description:
    "LaunchPath connects South African graduates with growing businesses. Employers get vetted, matched shortlists for R1,999 per role. Free for job seekers.",
  openGraph: {
    title: "LaunchPath | The bridge between overlooked talent and growing businesses",
    description: "Vetted, matched shortlists of early-career talent for SMEs and recruiters. Free for job seekers.",
    type: "website",
    locale: "en_ZA",
  },
};

export default function Home() {
  return (
    <div className="bg-white font-sans text-slate-600 antialiased">
      <Header />
      <main>
        <HeroSection />
        <PartnersSection />
        <ProblemSection />
        <HowItWorksSection />
        <EmployersSection />
        <TalentSection />
        <StrategySection />
        <EmployerPricingSection />
        <TestimonialSection />
        <FaqSection />
      </main>
      <ContactFooter />
    </div>
  );
}
