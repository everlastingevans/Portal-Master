import type { Metadata } from "next";
import { ShortlistView } from "@/components/hire/ShortlistView";

// Token-protected employer shortlist. The token is in the URL fragment (#t=...), read in the browser
// and sent to the API in a POST body; this page itself contains no candidate data.
export const metadata: Metadata = {
  title: "Your shortlist | LaunchPath",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export default function ShortlistPage() {
  return <ShortlistView />;
}
