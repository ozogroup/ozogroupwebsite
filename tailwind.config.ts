import type { Config } from "tailwindcss";

const kiaAccentScale = {
  50: "#F4EBDC",
  100: "#DCE6D6",
  200: "#DCE6D6",
  300: "#9CAF92",
  400: "#9CAF92",
  500: "#9CAF92",
  600: "#7F927A",
  700: "#6F625C",
  800: "#4F4542",
  900: "#4F4542",
};

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        white: "#FFFDF8",
        brand: {
          primary: "#9CAF92",
          primaryDark: "#76896E",
          accent: "#8A9C82",
          light: "#DCE6D6",
          ink: "#4F4542",
          muted: "#625650",
          surface: "#F4EBDC",
          card: "#FFFDF8",
          border: "#E6DCCF",
        },
        slate: {
          50: "#F4EBDC",
          100: "#F4EBDC",
          200: "#E6DCCF",
          300: "#E6DCCF",
          400: "#6F625C",
          500: "#6F625C",
          600: "#6F625C",
          700: "#4F4542",
          800: "#4F4542",
          900: "#4F4542",
          950: "#4F4542",
        },
        purple: kiaAccentScale,
        pink: kiaAccentScale,
        teal: kiaAccentScale,
        green: kiaAccentScale,
        emerald: kiaAccentScale,
        orange: kiaAccentScale,
        yellow: kiaAccentScale,
        amber: kiaAccentScale,
        luxury: {
          gold: "#D4AF37",
        },
      },
      spacing: {
        "section": "4rem",
        "container-x": "1.5rem",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.25rem" }],
        sm: ["0.875rem", { lineHeight: "1.4rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.6rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(79, 69, 66, 0.07)",
        card: "0 4px 18px rgba(79, 69, 66, 0.10)",
        premium: "0 10px 34px rgba(79, 69, 66, 0.13)",
        glow: "0 0 24px rgba(127, 146, 122, 0.28)",
        glass: "0 4px 16px rgba(255, 255, 255, 0.1)",
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
        fadeUp: "fadeUp 0.5s ease-out",
        slideIn: "slideIn 0.5s ease-out",
        scaleIn: "scaleIn 0.3s ease-out",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      screens: {
        xs: "475px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 253, 248, 0.92) 0%, rgba(244, 235, 220, 0.76) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
