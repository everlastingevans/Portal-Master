import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing-page/Header";
import { ContactFooter } from "@/components/landing-page/ContactFooter";
import { EmployerAnalytics } from "@/components/landing-page/EmployerAnalytics";
import { Container, Eyebrow } from "@/components/landing-page/primitives";
import { BulkEnquiryForm } from "@/components/hire/BulkEnquiryForm";
import { isFeatureEnabled } from "@/lib/features";
import { getProgrammeTiers } from "@/lib/hire/programme-admin";
import { findTierOverlaps } from "@/lib/hire/programmes";
import { formatRand } from "@/lib/hire/terms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Hiring several junior people? Talk to LaunchPath",
  description: "Intakes, multiple seats and recurring junior roles. Tell us what you need and we’ll plan the search with you.",
  alternates: { canonical: "/hire/bulk" },
};

export default async function BulkHiringPage() {
  if (!isFeatureEnabled("BULK_ENQUIRY_PUBLIC")) notFound();
  const tiers = await getProgrammeTiers();
  // Prices are shown only when explicitly enabled AND the tiers are unambiguous
  const showPrices = isFeatureEnabled("BULK_PRICING_PUBLIC") && findTierOverlaps(tiers).length === 0;

  return (
    <div className="bg-white font-sans text-slate-600 antialiased">
      <EmployerAnalytics page="bulk_hiring" />
      <Header />
      <main>
        <section className="bg-brand-navy pb-24 pt-32 sm:pt-40">
          <Container>
            <Eyebrow tone="dark">Bulk hiring</Eyebrow>
            <h1 className="mt-6 max-w-3xl text-[38px] font-semibold leading-[1.07] tracking-tight text-white sm:text-[52px]">Hiring several junior people at once?</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/70">
              For intakes, multiple seats or recurring roles, we plan one search with you and agree pricing per successful hire. Tell us what you need and we’ll be in touch.
            </p>
          </Container>
        </section>
        <section className="bg-canvas py-16 md:py-24">
          <Container>
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <BulkEnquiryForm />
              </div>
              <aside className="space-y-4 lg:col-span-4">
                <div className="rounded-[24px] bg-white p-6 ring-1 ring-slate-200/80">
                  <p className="text-[15px] font-semibold text-brand-navy">How pricing works</p>
                  {showPrices ? (
                    <ul className="mt-3 space-y-2 text-sm">
                      {tiers.map((t) => (
                        <li key={t.label}>
                          {t.minHires}
                          {t.maxHires === null ? "+" : `–${t.maxHires}`} hires: {t.perHireFee === null ? "custom quote" : `${formatRand(t.perHireFee)} per successful hire`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed">Pricing is per successful hire and agreed with you before we start, based on the number and type of roles.</p>
                  )}
                  <p className="mt-3 text-xs text-slate-500">Nothing is charged online. We confirm everything in writing first.</p>
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </main>
      <ContactFooter />
    </div>
  );
}
