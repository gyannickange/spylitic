---
name: Add Typography Fonts
overview: Configure Space Grotesk for headings and Inter for body text in Tailwind config and load fonts from Google Fonts.
todos:
  - id: update-tailwind-config
    content: Add fontFamily to Tailwind config
    status: completed
  - id: load-google-fonts
    content: Import fonts in application.css
    status: completed
  - id: set-body-font
    content: Apply font-body to body tag
    status: completed
isProject: false
---

# Add Typography Fonts Plan

## Typography System

- **Headings**: Space Grotesk
- **Body text**: Inter

## Implementation

### 1. Update Tailwind Config

Add font families to `[config/tailwind.config.js](config/tailwind.config.js)`:

```javascript
theme: {
  extend: {
    fontFamily: {
      heading: ['"Space Grotesk"', 'sans-serif'],
      body: ['Inter', 'sans-serif'],
    },
    // ... existing colors
  }
}
```

### 2. Load Fonts from Google Fonts

Add Google Fonts import to `[app/assets/tailwind/application.css](app/assets/tailwind/application.css)` before the `@import "tailwindcss"` line:

```css
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap");
```

### 3. Set Default Body Font

Update `[app/views/layouts/application.html.erb](app/views/layouts/application.html.erb)` to apply Inter as the default body font by adding `font-body` class to the `<body>` tag.

## Usage Examples

```erb
<!-- Headings use Space Grotesk -->
<h1 class="font-heading text-4xl font-bold">Title</h1>
<h2 class="font-heading text-2xl font-semibold">Subtitle</h2>

<!-- Body text uses Inter (default) -->
<p class="text-base">Regular paragraph text</p>
<span class="text-sm">Small text</span>
```

## Font Weights

- **Space Grotesk**: 400, 500, 600, 700
- **Inter**: 300, 400, 500, 600, 700
