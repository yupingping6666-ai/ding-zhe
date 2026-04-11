import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
          glow: "hsl(var(--primary-glow))",
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Type colors */
        care: {
          DEFAULT: "hsl(var(--care))",
          foreground: "hsl(var(--care-foreground))",
          surface: "hsl(var(--care-surface))",
          muted: "hsl(var(--care-muted))",
          light: "hsl(var(--care-light))",
        },
        todo: {
          DEFAULT: "hsl(var(--todo))",
          foreground: "hsl(var(--todo-foreground))",
          surface: "hsl(var(--todo-surface))",
          muted: "hsl(var(--todo-muted))",
          light: "hsl(var(--todo-light))",
        },
        confirm: {
          DEFAULT: "hsl(var(--confirm))",
          foreground: "hsl(var(--confirm-foreground))",
          surface: "hsl(var(--confirm-surface))",
          muted: "hsl(var(--confirm-muted))",
          light: "hsl(var(--confirm-light))",
        },
        /* Status colors */
        deferred: {
          DEFAULT: "hsl(var(--deferred))",
          foreground: "hsl(var(--deferred-foreground))",
          surface: "hsl(var(--deferred-surface))",
          muted: "hsl(var(--deferred-muted))",
        },
        awaiting: {
          DEFAULT: "hsl(var(--awaiting))",
          foreground: "hsl(var(--awaiting-foreground))",
          surface: "hsl(var(--awaiting-surface))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          surface: "hsl(var(--success-surface))",
        },
        skip: {
          DEFAULT: "hsl(var(--skip))",
          foreground: "hsl(var(--skip-foreground))",
        },
        expired: {
          DEFAULT: "hsl(var(--expired))",
          surface: "hsl(var(--expired-surface))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(0)", opacity: "1" },
          to: { transform: "translateY(100%)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "badge-bounce": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "pet-bounce": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "30%": { transform: "translateY(-8px) scale(1.05)" },
          "60%": { transform: "translateY(-3px) scale(1.02)" },
        },
        "pet-wiggle-happy": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-5deg)" },
          "40%": { transform: "rotate(5deg)" },
          "60%": { transform: "rotate(-3deg)" },
          "80%": { transform: "rotate(3deg)" },
        },
        "pet-sleepy": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(2px) scale(0.98)" },
        },
        "heart-pop": {
          "0%": { transform: "scale(0) translateY(0)", opacity: "1" },
          "50%": { transform: "scale(1.2) translateY(-15px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(-25px)", opacity: "0" },
        },
        "nest-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(14 90% 65% / 0.1)" },
          "50%": { boxShadow: "0 0 30px hsl(14 90% 65% / 0.25)" },
        },
        "shimmer": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "pet-breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        "food-fall": {
          "0%": { transform: "translateY(-30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "text-float-fade": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-25px)", opacity: "0" },
        },
        "completion-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "narrative-reveal": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "tail-sway": {
          "0%, 100%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
        "tail-wag": {
          "0%, 100%": { transform: "rotate(-15deg)" },
          "50%": { transform: "rotate(15deg)" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "msg-appear": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slide-down 0.25s ease-in",
        "fade-in": "fade-in 0.25s ease-out",
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "badge-bounce": "badge-bounce 0.3s ease-out",
        "wiggle": "wiggle 0.5s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "pet-bounce": "pet-bounce 0.5s ease-out",
        "pet-happy": "pet-wiggle-happy 0.8s ease-in-out",
        "pet-sleepy": "pet-sleepy 4s ease-in-out infinite",
        "heart-pop": "heart-pop 0.6s ease-out forwards",
        "nest-glow": "nest-glow 3s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "pet-breathe": "pet-breathe 3s ease-in-out infinite",
        "food-fall": "food-fall 0.6s ease-out",
        "text-float-fade": "text-float-fade 2s ease-out forwards",
        "completion-pop": "completion-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "narrative-reveal": "narrative-reveal 0.6s ease-out forwards",
        "tail-sway": "tail-sway 2s ease-in-out infinite",
        "tail-wag": "tail-wag 0.4s ease-in-out infinite",
        "typing-dot": "typing-dot 1.2s ease-in-out infinite",
        "msg-appear": "msg-appear 0.25s ease-out",
        "shake": "shake 0.4s ease-in-out",
      },
      boxShadow: {
        "card-default": "var(--shadow-card)",
        "card-care": "var(--shadow-care)",
        "card-todo": "var(--shadow-todo)",
        "card-confirm": "var(--shadow-confirm)",
        "card-deferred": "var(--shadow-deferred)",
        "card-awaiting": "var(--shadow-awaiting)",
        "btn-success": "var(--shadow-success-btn)",
        "overlay": "var(--shadow-overlay)",
        "chooser": "var(--shadow-chooser)",
        "float": "var(--shadow-float)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
