import type { Metadata } from "next";
import { Header } from "@/components/landing-page/Header";
import { HeroSection } from "@/components/landing-page/HeroSection";
import { PartnersSection } from "@/components/landing-page/PartnersSection";
import { ProblemSection } from "@/components/landing-page/ProblemSection";
import { HowItWorksSection } from "@/components/landing-page/HowItWorksSection";
import { EmployersSection } from "@/components/landing-page/EmployersSection";
import { TalentSection } from "@/components/landing-page/TalentSection";
import { EmployerPricingSection } from "@/components/landing-page/EmployerPricingSection";
import { CaseStudiesSection } from "@/components/landing-page/CaseStudiesSection";
import { FaqSection } from "@/components/landing-page/FaqSection";
import { ContactFooter } from "@/components/landing-page/ContactFooter";
import { EmployerAnalytics } from "@/components/landing-page/EmployerAnalytics";
import { getHireTerms } from "@/lib/hire/settings";
import { jsonLd, siteUrl } from "@/lib/seo";

// Pricing and guarantee terms come from settings; refresh at most every 5 minutes
// (saving the terms in admin also revalidates this page immediately).
export const revalidate = 300;

export const metadata: Metadata = {
  title: "LaunchPath | Hire great junior talent in South Africa",
  description:
    "Tell us who you’re hiring. We’ll send you 3–5 screened candidates within five working days. No upfront fees: you only pay if you hire.",
  openGraph: {
    title: "LaunchPath | Hire great junior talent without sorting through hundreds of CVs",
    description: "Screened shortlists for South African junior and early-career roles. No upfront fees. Free for job seekers.",
    type: "website",
    locale: "en_ZA",
  },
  alternates: { canonical: "/" },
};

export default async function Home() {
  const terms = await getHireTerms();

  return (
    <div className="bg-white font-sans text-slate-600 antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({ "@context": "https://schema.org", "@type": "Organization", name: "LaunchPath", url: siteUrl(), logo: `${siteUrl()}/icon.png`, email: "hello@launchpath.co.za" })}
      />
      <EmployerAnalytics page="home" />
      <Header />
      <main>
        <HeroSection guaranteeDays={terms.guaranteeDays} />
        <PartnersSection />
        <HowItWorksSection />
        <EmployersSection />
        <EmployerPricingSection terms={terms} />
        {/* Renders only verified, approved case studies; nothing until they exist */}
        <CaseStudiesSection />
        <ProblemSection />
        <TalentSection />
        <FaqSection terms={terms} />
      </main>
      <ContactFooter />
    </div>
  );
}
