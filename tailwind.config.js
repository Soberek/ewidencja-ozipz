import plugin from "tailwindcss/plugin";

/**
 * Minimalny odpowiednik `tailwindcss-animate` (bez dodatkowej zależności):
 * `animate-in` / `animate-out` + modyfikatory fade/zoom/slide używane przez
 * dialogi, tooltipy i listy rozwijane.
 */
const enterExitAnimations = plugin(({ addBase, addUtilities, matchUtilities, theme }) => {
  addBase({
    "@keyframes enter": {
      from: {
        opacity: "var(--tw-enter-opacity, 1)",
        transform:
          "translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1))",
      },
    },
    "@keyframes exit": {
      to: {
        opacity: "var(--tw-exit-opacity, 1)",
        transform:
          "translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1))",
      },
    },
  });

  addUtilities({
    ".animate-in": {
      animationName: "enter",
      animationDuration: theme("animationDuration.DEFAULT"),
      animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      animationFillMode: "both",
      "--tw-enter-opacity": "initial",
      "--tw-enter-scale": "initial",
      "--tw-enter-translate-x": "initial",
      "--tw-enter-translate-y": "initial",
    },
    ".animate-out": {
      animationName: "exit",
      animationDuration: theme("animationDuration.DEFAULT"),
      animationTimingFunction: "ease-in",
      animationFillMode: "both",
      "--tw-exit-opacity": "initial",
      "--tw-exit-scale": "initial",
      "--tw-exit-translate-x": "initial",
      "--tw-exit-translate-y": "initial",
    },
  });

  const opacityValues = { 0: "0", 50: "0.5", 100: "1" };
  const scaleValues = { 0: "0", 50: ".5", 90: ".9", 95: ".95", 100: "1" };
  const translateValues = { ...theme("translate"), "48%": "48%" };

  matchUtilities({ "fade-in": (value) => ({ "--tw-enter-opacity": value }) }, { values: opacityValues });
  matchUtilities({ "fade-out": (value) => ({ "--tw-exit-opacity": value }) }, { values: opacityValues });
  matchUtilities({ "zoom-in": (value) => ({ "--tw-enter-scale": value }) }, { values: scaleValues });
  matchUtilities({ "zoom-out": (value) => ({ "--tw-exit-scale": value }) }, { values: scaleValues });
  matchUtilities(
    {
      "slide-in-from-top": (value) => ({ "--tw-enter-translate-y": `-${value}` }),
      "slide-in-from-bottom": (value) => ({ "--tw-enter-translate-y": value }),
      "slide-in-from-left": (value) => ({ "--tw-enter-translate-x": `-${value}` }),
      "slide-in-from-right": (value) => ({ "--tw-enter-translate-x": value }),
      "slide-out-to-top": (value) => ({ "--tw-exit-translate-y": `-${value}` }),
      "slide-out-to-bottom": (value) => ({ "--tw-exit-translate-y": value }),
      "slide-out-to-left": (value) => ({ "--tw-exit-translate-x": `-${value}` }),
      "slide-out-to-right": (value) => ({ "--tw-exit-translate-x": value }),
    },
    { values: translateValues }
  );
});

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "2px",
        DEFAULT: "3px",
        md: "3px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        "3xl": "4px",
        full: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
      spacing: {
        "6.5": "1.625rem",
        "38": "9.5rem",
      },
      animationDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [enterExitAnimations],
};
