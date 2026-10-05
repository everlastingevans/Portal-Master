import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// Public marketing pages may be indexed. Private areas are disallowed and also send noindex headers.
// /shortlist is NOT disallowed on purpose: crawlers must be able to read its noindex header (the page
// itself holds no data; access tokens live in the URL fragment and never reach the server).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/employer", "/candidate", "/onboarding"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
