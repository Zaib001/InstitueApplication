import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#10233F",       // Primary navy - prestige & trust
          "navy-dark": "#0B1526",
          blue: "#2563EB",       // Professional blue - clarity & action
          "blue-deep": "#1D4ED8",
          "blue-light": "#3B82F6",
          "blue-surface": "#EFF6FF", // Light blue surface for cards/accents
          teal: "#0D9488",       // Accent teal - growth & pedagogy
          "teal-dark": "#0F766E",
          "teal-light": "#14B8A6",
          gold: "#E9B44C",       // Warm gold - excellence & ratings
          amber: "#F59E0B",
          charcoal: "#0F172A",   // Primary high-contrast text
          muted: "#64748B",      // Secondary readable text
          white: "#FFFFFF",
          surface: "#F8FAFC",    // Warm neutral background
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl: "0.75rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "DM Sans", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 10px 30px -10px rgba(16, 35, 63, 0.08), 0 4px 6px -2px rgba(16, 35, 63, 0.04)",
        "premium-hover": "0 20px 40px -15px rgba(16, 35, 63, 0.14), 0 8px 12px -3px rgba(16, 35, 63, 0.06)",
        glow: "0 0 40px -10px rgba(37, 99, 235, 0.25)",
        "glow-teal": "0 0 35px -8px rgba(13, 148, 136, 0.22)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "pulse-subtle": "pulse-subtle 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
