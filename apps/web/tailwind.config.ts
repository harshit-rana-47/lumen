import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        primary: "hsl(var(--primary))",
        accent: "hsl(var(--accent))",
        surface: "hsl(var(--surface))",
        paper: "hsl(var(--paper))",
        ink: "hsl(var(--ink))",
        "ink-muted": "hsl(var(--ink-muted))",
        "ink-faint": "hsl(var(--ink-faint))",
        lamp: "hsl(var(--lamp))",
        "lamp-soft": "hsl(var(--lamp-soft))",
        "lamp-mist": "hsl(var(--lamp-mist))",
        ember: "hsl(var(--ember))",
        "ember-soft": "hsl(var(--ember-soft))",
        mist: "hsl(var(--mist))",
        line: "hsl(var(--line))",
        danger: "hsl(var(--danger))",
        "paper-elevated": "hsl(var(--paper-elevated))"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"]
      },
      borderRadius: {
        lumen: "var(--radius-md)",
        "lumen-lg": "var(--radius-lg)"
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
        focus: "var(--shadow-focus)"
      },
      transitionTimingFunction: {
        lumen: "var(--ease-standard)",
        "lumen-emphasized": "var(--ease-emphasized)",
        "lumen-soft": "var(--ease-soft)",
        "lumen-press": "var(--ease-press)"
      },
      transitionDuration: {
        micro: "var(--motion-micro)",
        interaction: "var(--motion-interaction)",
        transition: "var(--motion-transition)",
        cinematic: "var(--motion-cinematic)"
      },
      zIndex: {
        raised: "var(--z-raised)",
        sticky: "var(--z-sticky)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)"
      }
    }
  },
  plugins: []
};

export default config;
