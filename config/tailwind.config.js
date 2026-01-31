/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/views/**/*.html.erb",
    "./app/helpers/**/*.rb",
    "./app/assets/stylesheets/**/*.css",
    "./app/javascript/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        // Backgrounds
        "app-bg": "var(--color-app-bg)",
        "hero-bg": "var(--color-hero-bg)",
        "card-bg": "var(--color-card-bg)",
        "surface-subtle": "var(--color-surface-subtle)",

        // Text
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",

        // Actions & Accents
        cta: "var(--color-cta)",
        "cta-hover": "var(--color-cta-hover)",
        link: "var(--color-link)",
        "focus-ring": "var(--color-focus-ring)",

        // Insights / Badges
        "badge-bg": "var(--color-badge-bg)",
        "badge-text": "var(--color-badge-text)",
        "badge-hover": "var(--color-badge-hover)",

        // Borders
        "border-default": "var(--color-border-default)",
        "border-strong": "var(--color-border-strong)",
        "border-subtle": "var(--color-border-subtle)",

        // States
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
      },
    },
  },
  plugins: [],
};
