import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { POPIAConsent } from "@/components/POPIAConsent";
import { ToastProvider } from "@/components/ToastNotification";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleAnalytics } from "@next/third-parties/google";

// Brand typeface, self-hosted from /public/fonts
const lexendDeca = localFont({
  src: [
    { path: "../public/fonts/LexendDeca-Thin.ttf", weight: "100", style: "normal" },
    { path: "../public/fonts/LexendDeca-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../public/fonts/LexendDeca-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/LexendDeca-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/LexendDeca-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/LexendDeca-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/LexendDeca-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/LexendDeca-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/LexendDeca-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata = {
  title: "LaunchPath Recruitment",
  description: "AI-Powered Recruitment and Job Readiness Platform",
  icons: {
    icon: "/icon.png",
  },
  verification: {
    google: "iRvE4kw0JqCBgqSbF94O2MnA3AEvflXSUDvdYVCx9YM",
  },
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={lexendDeca.variable}>
      <body>
        <Analytics />
        <SpeedInsights/>
        {/* Each surface owns its palette (light portals, dark admin, navy marketing),
            so OS dark mode must not flip `dark:` variants on and half-theme pages. */}
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
          <ToastProvider>
            {children}
            <POPIAConsent />
          </ToastProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-PM0PE0XNEW" />
      </body>
    </html>
  );
}
