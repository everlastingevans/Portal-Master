import type { MetadataRoute } from "next";
import { TALENT_CATEGORIES } from "@/lib/content/talent-categories";
import { ROLE_PAGES } from "@/lib/content/role-pages";
import { publishedCaseStudies } from "@/lib/content/case-studies";
import { isFeatureEnabled } from "@/lib/features";
import { siteUrl } from "@/lib/seo";

// Rendered per request so feature-flagged pages (e.g. /hire/bulk) appear only while enabled.
export const dynamic = "force-dynamic";

// Public marketing pages only. Never lists shortlist, portal, dashboard or admin pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [
    "/",
    "/find-candidates",
    ...TALENT_CATEGORIES.map((c) => `/hire/${c.slug}`),
    ...ROLE_PAGES.map((r) => `/hire/${r.categorySlug}/${r.slug}`),
    ...(publishedCaseStudies().length ? ["/results"] : []),
    ...(isFeatureEnabled("BULK_ENQUIRY_PUBLIC") ? ["/hire/bulk"] : []),
  ];
  return paths.map((p) => ({ url: `${base}${p === "/" ? "" : p}`, changeFrequency: "monthly", priority: p === "/" ? 1 : p.split("/").length > 3 ? 0.6 : 0.8 }));
}
