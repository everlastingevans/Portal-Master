import { Header } from "@/components/landing-page/Header";
import { HeroSection } from "@/components/landing-page/HeroSection";
import { OfferSection } from "@/components/landing-page/OfferSection";
import { TeamSection } from "@/components/landing-page/TeamSection";
import { StrategySection } from "@/components/landing-page/StrategySection";
import { PeopleSection } from "@/components/landing-page/PeopleSection";
import { TestimonialSection } from "@/components/landing-page/TestimonialSection";
import { ContactFooter } from "@/components/landing-page/ContactFooter";
import { PlatformVision } from "@/components/landing-page/PlatformVision";

export default function Home() {
  return (
    <div id="top">
      {/* Top Navigation */}
      <Header />

      {/* Hero Header Section */}
      <HeroSection />

      {/* Detailed Brand Mission & Explainer Section (About us anchor) */}
      <TeamSection />

      {/* Dynamic Platform Vision & Features Section (What We Do anchor) */}
      <PlatformVision />

      {/* Vetting, Matching, and Affordable Solutions Section (Offer Section using local offer images) */}
      <OfferSection />

      {/* Detailed SME Strategy & Growth Support */}
      <StrategySection />

      {/* Interactive Comparison Section */}
      {/* <PeopleSection /> */}

      {/* Elegant Testimonial Showcase */}
      <TestimonialSection />

      {/* Contact Form & Footer links (Contact anchor) */}
      <ContactFooter />
    </div>
  );
}
