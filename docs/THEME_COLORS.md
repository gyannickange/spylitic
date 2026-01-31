# Spylitic Theme Colors

This document describes the Tailwind CSS color system for Spylitic, implementing both dark and light themes with semantic tokens.

## Configuration Files

- **Tailwind Config**: `config/tailwind.config.js`
- **CSS Variables**: `app/assets/tailwind/application.css`

## Dark Mode

Uses class-based dark mode (`darkMode: "class"`). Add the `dark` class to the `<html>` element to activate dark theme.

---

## Color Tokens

### Backgrounds

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `app-bg` | `#F8FAFC` | `#0F172A` | Main app background |
| `hero-bg` | `#EEF2FF` | `#1E1B4B` | Hero sections, headers |
| `card-bg` | `#FFFFFF` | `#020617` | Cards, panels |
| `surface-subtle` | `#F1F5F9` | `#020617` | Subtle surface areas |

### Text

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `text-primary` | `#0F172A` | `#F8FAFC` | Primary text |
| `text-secondary` | `#475569` | `#CBD5E1` | Secondary text |
| `text-muted` | `#64748B` | `#94A3B8` | Muted/helper text |

### Actions & Accents

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `cta` | `#3B82F6` | `#3B82F6` | Primary CTA buttons |
| `cta-hover` | `#2563EB` | `#2563EB` | CTA hover state |
| `link` | `#2563EB` | `#3B82F6` | Text links |
| `focus-ring` | `#93C5FD` | `#60A5FA` | Focus/active ring |

### Insights / Badges

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `badge-bg` | `rgba(34, 211, 238, 0.18)` | `rgba(34, 211, 238, 0.15)` | Badge backgrounds |
| `badge-text` | `#0891B2` | `#22D3EE` | Badge text |
| `badge-hover` | `rgba(34, 211, 238, 0.10)` | `rgba(34, 211, 238, 0.08)` | Badge hover state |

### Borders

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `border-default` | `#E2E8F0` | `#1E293B` | Default borders |
| `border-strong` | `#CBD5E1` | `#334155` | Strong borders |
| `border-subtle` | `#E2E8F0` | `#1E293B` | Subtle borders |

### States

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `success` | `#16A34A` | `#22C55E` | Success states |
| `warning` | `#D97706` | `#F59E0B` | Warning states |
| `error` | `#DC2626` | `#EF4444` | Error states |
| `info` | `#0284C7` | `#38BDF8` | Info states |

---

## Usage Examples

```erb
<!-- Card with proper theming -->
<div class="bg-card-bg border border-border-default rounded-lg p-4">
  <h2 class="text-text-primary font-semibold">Title</h2>
  <p class="text-text-secondary">Description text</p>
  <span class="text-text-muted text-sm">Helper text</span>
</div>

<!-- CTA Button -->
<button class="bg-cta hover:bg-cta-hover text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-focus-ring">
  Primary Action
</button>

<!-- Badge for insights -->
<span class="bg-badge-bg text-badge-text px-2 py-1 rounded text-sm">
  AI Insight
</span>

<!-- State indicators -->
<span class="text-success">Success message</span>
<span class="text-warning">Warning message</span>
<span class="text-error">Error message</span>
<span class="text-info">Info message</span>
```

---

## Golden Rules

1. **Same accent in both themes**: `#3B82F6` is the primary action color in both themes for user mental consistency.

2. **Indigo = structure, not action**: `#1E1B4B` (dark) / `#EEF2FF` (light) are used only for hero/header sections, never for CTAs.

3. **Cyan = insight, never dominant**: Cyan colors are reserved for badges, tags, and AI highlights. Never use cyan for large buttons.

4. **Contrast > aesthetics**: All color combinations meet WCAG AA standards. CTAs should be legible from 1 meter away.
