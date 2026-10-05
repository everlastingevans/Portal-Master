"use client";

import { useEffect } from "react";
import { trackEmployerEvent } from "@/lib/analytics";

/**
 * Fires an employer page view and tracks clicks on any element marked with
 * `data-track-cta="<cta>"` (and optional `data-track-location`). Lets server-rendered
 * marketing sections opt into click tracking without becoming client components.
 */
export function EmployerAnalytics({ page }: { page: string }) {
  useEffect(() => {
    trackEmployerEvent("employer_page_view", { page });

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track-cta]");
      if (!el) return;
      trackEmployerEvent("employer_cta_click", {
        page,
        cta: el.dataset.trackCta,
        location: el.dataset.trackLocation,
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [page]);

  return null;
}
