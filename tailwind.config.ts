import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Lexend Deca everywhere: font-sans, font-heading and font-mono all resolve to the brand font
      fontFamily: {
        sans: ["var(--font-lexend)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-lexend)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-lexend)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // LaunchPath brand
        brand: {
          navy: "#0A1B3D",
          lime: "#A6F23C",
          "lime-soft": "#C8FF7A",
        },
        // Light page background for the candidate & employer portals
        canvas: "#F5F7FA",
        // Navy-tinted neutrals for dark surfaces (admin console, loaders)
        ink: {
          950: "#050B18",
          900: "#081227",
          850: "#0B1529",
          800: "#0F1D37",
          700: "#172846",
          600: "#22375C",
        },
      },
      keyframes: {
        // End on `transform: none`: with fill-mode "both" a lingering translateY(0)/scale(1)
        // would keep a containing block and trap position:fixed descendants (modals, drawers).
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "none" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "loader-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.6s infinite",
        "loader-bar": "loader-bar 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
