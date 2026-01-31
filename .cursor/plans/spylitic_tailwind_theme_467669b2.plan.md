---
name: Spylitic Tailwind Theme
overview: Create a Tailwind config and semantic color tokens for the Spylitic light/dark palettes using class-based dark mode and CSS variables.
todos:
  - id: add-tailwind-config
    content: Create Tailwind config with content paths and colors.
    status: completed
  - id: add-css-variables
    content: Define light/dark CSS variables in Tailwind entry CSS.
    status: completed
  - id: verify-theme-mapping
    content: Verify tokens match Spylitic palette rules.
    status: completed
isProject: false
---

# Spylitic Tailwind Theme Plan

## Context

- No `config/tailwind.config.js` exists yet; project uses Tailwind via `tailwindcss-rails` and the Tailwind entrypoint is `app/assets/tailwind/application.css` per docs.

## Plan

- Add a Tailwind config at `[config/tailwind.config.js](config/tailwind.config.js)` using the content paths in docs and `darkMode: "class"` to match the class-based strategy you confirmed.
- Define semantic color tokens (e.g., `app-bg`, `hero-bg`, `card-bg`, `surface-subtle`, `border-subtle`, `text-primary`, `text-secondary`, `text-muted`, `cta`, `cta-hover`, `link`, `focus-ring`, `badge-bg`, `badge-text`, `badge-hover`, `success`, `warning`, `error`, `info`, `border-default`, `border-strong`) that map to CSS variables; expose them under `theme.extend.colors` in the config.
- Declare the CSS variables for light and dark palettes in `[app/assets/tailwind/application.css](app/assets/tailwind/application.css)` using `:root` for light and `.dark` for dark, so `dark` class on `html` switches values without changing classnames.
- Keep the primary accent (`#3B82F6`) identical in both themes and ensure indigo/cyan usage follows the rules by limiting indigo tokens to structure and cyan tokens to badges/insights.

## Notes

- I will map the dark theme’s subtle surface border to `border-subtle` and use the light theme’s `border-default`/`border-strong` tokens as provided.
- If you want additional semantic tokens (e.g., separate `link-hover`, `surface-hover`, or `border-strong` for dark), I can include them after this plan is accepted.
