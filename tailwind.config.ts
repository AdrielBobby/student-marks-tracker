import type { Config } from "tailwindcss";

const config: Config = {
  // Scan all component and page files for class names
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // Drive dark mode via our [data-theme="dark"] attribute on <html>
  // NOT by the 'dark:' class prefix — we use CSS custom properties instead.
  // Tailwind is used for layout utilities; theming is done via CSS vars.
  darkMode: ["selector", '[data-theme="dark"]'],

  theme: {
    extend: {
      // Map PRD design tokens to Tailwind color classes so they can be used
      // alongside CSS variables when convenient. e.g. bg-app-bg, text-app-muted.
      colors: {
        app: {
          bg:      "var(--bg)",
          surface: "var(--surface)",
          surface2:"var(--surface-2)",
          border:  "var(--border)",
          primary: "var(--text-primary)",
          muted:   "var(--text-muted)",
          accent:  "var(--accent)",
        },
        pill: {
          terrible:     "var(--pill-terrible)",
          satisfactory: "var(--pill-satisfactory)",
          good:         "var(--pill-good)",
          excellent:    "var(--pill-excellent)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        modal: "0 24px 64px rgba(0, 0, 0, 0.3)",
        focus: "0 0 0 2px var(--accent)",
      },
      animation: {
        "fade-in":  "fadeIn 0.15s ease",
        "slide-up": "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(14px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
