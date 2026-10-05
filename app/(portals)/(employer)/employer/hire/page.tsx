import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/features";
import { EmployerHireDashboard } from "@/components/hire/EmployerHireDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your LaunchPath vacancies", robots: { index: false, follow: false } };

// Minimal employer hiring dashboard, behind FEATURE_EMPLOYER_DASHBOARD. Access control is enforced in
// /api/employer/hire on every request (company membership granted by LaunchPath staff).
export default function EmployerHirePage() {
  if (!isFeatureEnabled("EMPLOYER_DASHBOARD")) notFound();
  return <EmployerHireDashboard />;
}
