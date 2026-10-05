"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@next/third-parties/google";

// Pages whose URL carries a private access token (in the fragment). Their page views are not
// reported, GA4 is not loaded there, and fragments are stripped from every analytics URL.
const PRIVATE_PATHS = ["/shortlist"];
const isPrivate = (url: string) => {
  try {
    return PRIVATE_PATHS.includes(new URL(url, "https://x").pathname);
  } catch {
    return false;
  }
};
const stripHash = (url: string) => url.split("#")[0];

export function AnalyticsScripts({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  return (
    <>
      <Analytics
        beforeSend={(event) => {
          if (event.type === "pageview" && isPrivate(event.url)) return null;
          return { ...event, url: stripHash(event.url) };
        }}
      />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: stripHash(event.url) })} />
      {!PRIVATE_PATHS.includes(pathname || "") && <GoogleAnalytics gaId={gaId} />}
    </>
  );
}
