import type { Config } from "tailwindcss";

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
        brand: {
          primary: "#0D5C7D",
          primaryDark: "#09455C",
          accent: "#1BA3C6",
          accentLight: "#4BC4E8",
          light: "#5DA9D6",
          ink: "#0B2030",
          muted: "#475866",
          surface: "#F5FAFC",
          border: "#E3EDF2",
          glass: "rgba(255, 255, 255, 0.7)",
          glassDark: "rgba(13, 92, 125, 0.05)",
        },
        luxury: {
          gold: "#D4AF37",
          rose: "#E8B4B8",
          lavender: "#E6E6FA",
          pearl: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
        "4xl": "36px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(13, 92, 125, 0.06)",
        card: "0 10px 30px rgba(13, 92, 125, 0.08)",
        ring: "0 0 0 6px rgba(27, 163, 198, 0.12)",
        glow: "0 0 40px rgba(27, 163, 198, 0.15)",
        premium: "0 20px 60px rgba(13, 92, 125, 0.12)",
        glass: "0 8px 32px rgba(13, 92, 125, 0.1)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
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
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out both",
        fadeIn: "fadeIn 0.5s ease-out both",
        slideIn: "slideIn 0.5s ease-out both",
        scaleIn: "scaleIn 0.4s ease-out both",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s infinite linear",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
