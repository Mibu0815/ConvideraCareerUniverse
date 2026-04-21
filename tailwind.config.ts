import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Dynamic radius classes used in the design-system styleguide template strings
    "rounded-sm",
    "rounded-md",
    "rounded-lg",
    "rounded-xl",
  ],
  theme: {
    extend: {
      colors: {
        // Convidera Brand Palette (legacy — keep for existing components)
        brand: {
          black: "#000000",
          white: "#FFFFFF",
          gray: {
            50: "#F9FAFB",
            100: "#F3F4F6",
            200: "#E5E7EB",
            300: "#D1D5DB",
            400: "#9CA3AF",
            500: "#6B7280",
            600: "#4B5563",
            700: "#374151",
            800: "#1F2937",
            900: "#111827",
          },
          accent: "#3B82F6",
          // Design System 2.0 brand sub-tokens
          dot: "rgb(var(--brand-dot) / <alpha-value>)",
          blue: {
            DEFAULT: "rgb(var(--brand-blue) / <alpha-value>)",
            hover: "rgb(var(--brand-blue-hover) / <alpha-value>)",
            subtle: "rgb(var(--brand-blue-subtle) / <alpha-value>)",
          },
        },
        // Legacy aliases
        convidera: {
          blue: "#0055FF",
          dark: "#0A0A0B",
          light: "#F9FAFB",
        },

        // ─── Design System 2.0 ───────────────────────────────────────────
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        "canvas-dark": "rgb(var(--canvas-dark) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          soft: "rgb(var(--surface-soft) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
        divider: "rgb(var(--divider) / <alpha-value>)",
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
          inverse: "rgb(var(--text-inverse) / <alpha-value>)",
        },
        zone: {
          personal: {
            DEFAULT: "rgb(var(--zone-personal) / <alpha-value>)",
            soft: "rgb(var(--zone-personal-soft) / <alpha-value>)",
          },
          admin: {
            DEFAULT: "rgb(var(--zone-admin) / <alpha-value>)",
            soft: "rgb(var(--zone-admin-soft) / <alpha-value>)",
          },
          domain: {
            DEFAULT: "rgb(var(--zone-domain) / <alpha-value>)",
            soft: "rgb(var(--zone-domain-soft) / <alpha-value>)",
          },
        },
        status: {
          success: {
            DEFAULT: "rgb(var(--success) / <alpha-value>)",
            soft: "rgb(var(--success-soft) / <alpha-value>)",
          },
          warning: {
            DEFAULT: "rgb(var(--warning) / <alpha-value>)",
            soft: "rgb(var(--warning-soft) / <alpha-value>)",
          },
          danger: {
            DEFAULT: "rgb(var(--danger) / <alpha-value>)",
            soft: "rgb(var(--danger-soft) / <alpha-value>)",
          },
          info: {
            DEFAULT: "rgb(var(--info) / <alpha-value>)",
            soft: "rgb(var(--info-soft) / <alpha-value>)",
          },
        },
        // Skill Level Colors — Design System 2.0 single-color tokens
        // (Replaces the legacy nested {bg,text,border} object — no
        //  components used those nested keys via Tailwind classes.)
        level: {
          1: "rgb(var(--level-1) / <alpha-value>)",
          2: "rgb(var(--level-2) / <alpha-value>)",
          3: "rgb(var(--level-3) / <alpha-value>)",
          4: "rgb(var(--level-4) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-xl": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-l":  ["48px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        h1:           ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        h2:           ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3:           ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        h4:           ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-l":     ["18px", { lineHeight: "1.6" }],
        body:         ["16px", { lineHeight: "1.5" }],
        "body-s":     ["14px", { lineHeight: "1.5" }],
        caption:      ["12px", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" }],
        overline:     ["11px", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      borderRadius: {
        bento: "12px",
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        pill: "999px",
      },
      boxShadow: {
        bento: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "bento-hover": "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        xs: "0 1px 2px rgb(10 10 11 / 0.04)",
        sm: "0 2px 4px rgb(10 10 11 / 0.06)",
        md: "0 4px 12px rgb(10 10 11 / 0.08)",
        lg: "0 12px 24px rgb(10 10 11 / 0.10)",
        xl: "0 24px 48px rgb(10 10 11 / 0.14)",
      },
      maxWidth: {
        page: "var(--page-max-width)",
        content: "var(--content-max-width)",
        narrow: "720px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-quart": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "320ms",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
