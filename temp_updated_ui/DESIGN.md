---
name: Prisma Cinematic Studio
colors:
  surface: '#131409'
  surface-dim: '#131409'
  surface-bright: '#393a2c'
  surface-container-lowest: '#0e0f05'
  surface-container-low: '#1b1c10'
  surface-container: '#1f2014'
  surface-container-high: '#2a2b1e'
  surface-container-highest: '#353628'
  on-surface: '#e5e3cf'
  on-surface-variant: '#c9c6bc'
  inverse-surface: '#e5e3cf'
  inverse-on-surface: '#303124'
  outline: '#939187'
  outline-variant: '#48473f'
  surface-tint: '#cac7b5'
  primary: '#fbf7e4'
  on-primary: '#323124'
  primary-container: '#dedbc8'
  on-primary-container: '#616051'
  inverse-primary: '#605f50'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#f9f6f6'
  on-tertiary: '#303030'
  tertiary-container: '#dcdad9'
  on-tertiary-container: '#605f5f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e6e3d0'
  primary-fixed-dim: '#cac7b5'
  on-primary-fixed: '#1c1c10'
  on-primary-fixed-variant: '#484739'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131409'
  on-background: '#e5e3cf'
  surface-variant: '#353628'
typography:
  display-lg:
    fontFamily: Almarai
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Almarai
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Almarai
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Almarai
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Almarai
    fontSize: 20px
    fontWeight: '300'
    lineHeight: '1.6'
  body-md:
    fontFamily: Almarai
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  accent-italic:
    fontFamily: Instrument Serif
    fontSize: 1.1em
    fontWeight: '400'
  label-sm:
    fontFamily: Almarai
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  section-padding: 8rem
  gutter: 2rem
  hero-inset: 4rem
  stack-sm: 0.5rem
  stack-md: 1.5rem
  stack-lg: 4rem
---

## Brand & Style

This design system is built on a foundation of **Cinematic Minimalism**. It targets a high-end creative audience, evoking an emotional response of mystery, prestige, and focused intentionality. The aesthetic is heavily inspired by modern film title sequences and luxury editorial layouts, where the absence of light is as important as the presence of content.

The style utilizes deep blacks, high-contrast cream accents, and sophisticated typography to create a "gallery" effect. Visual interest is driven by negative space and progressive disclosures rather than decorative elements. Every interaction should feel deliberate, smooth, and premium.

## Colors

The palette is strictly curated to maintain a moody, nocturnal atmosphere. 
- **Base Surface:** Pure black (#000000) serves as the infinite canvas, allowing media and typography to "float."
- **Primary Accent:** A warm, desaturated cream (#DEDBC8) is used for key calls-to-action and highlights.
- **Secondary Surfaces:** Tiered grays (#101010 and #212121) provide subtle depth for cards and sections without breaking the dark immersion.
- **Typography:** The neutral (#E1E0CC) ensures high legibility against the dark backgrounds while feeling softer and more "organic" than pure white.

## Typography

The typographic system relies on the structural precision of **Almarai** and the expressive elegance of **Instrument Serif**. 

- **Display & Headlines:** Use Almarai with tight tracking and heavy weights (700-800) for a commanding presence.
- **Body Text:** Utilize the 300 weight of Almarai for a light, airy feel that prevents the dark background from feeling "heavy."
- **Accentuation:** Use Instrument Serif (Italic) sparingly within sentences or as decorative sub-headers to inject a sense of human craft and luxury.
- **Labels:** Small caps and increased letter spacing should be used for metadata and utility labels to maintain a technical, precise look.

## Layout & Spacing

The layout philosophy is "spacious and inset." This design system shuns edge-to-edge content in favor of generous margins that frame the work like a photograph.

- **Hero Inset:** The primary landing area should feature an "inner frame" or inset (roughly 4rem-6rem) from the viewport edge to create a cinematic window effect.
- **Progressive Reveals:** Content should be spaced to allow for vertical scrolling animations, where text blocks fade in or slide up as they enter the viewport.
- **Grid:** A 12-column grid is used, but content should frequently occupy the center 6 or 8 columns to maximize negative space on the flanks.

## Elevation & Depth

This design system avoids traditional shadows, which can look "muddy" on a pure black background. Depth is achieved through **Tonal Layering** and **Atmospheric Blurs**.

- **Surface Levels:** 
  - Level 0: Pure Black (#000000) - Main background.
  - Level 1: Deep Gray (#101010) - Large containers (About cards).
  - Level 2: Dark Gray (#212121) - Interactive elements (Feature cards).
- **Outlines:** Use very low-opacity cream borders (10-15% alpha) to define the edges of cards on black backgrounds.
- **Depth:** Use background blurs (30px+) behind navigation bars and overlays to create a "glass" effect that suggests light passing through dark water.

## Shapes

The shape language is sophisticated and "Soft" (0.25rem - 0.75rem radius). While the brand is modern, sharp corners are avoided to maintain a premium, high-end feel. 

- **Cards:** Use `rounded-lg` (0.5rem) for Feature cards to give them a distinct but subtle presence.
- **Buttons:** Small radius for buttons keeps them looking architectural and professional.
- **Media:** Photography and video should follow the same corner radius rules to ensure a cohesive "framed" look.

## Components

### Buttons
- **Primary:** Warm Cream (#DEDBC8) fill with Black text. No border. Sharp but slightly rounded corners.
- **Secondary:** Ghost style. Transparent fill with a 1px Warm Cream border. Hover state: Cream fill with Black text.

### Cards
- **Feature Cards:** Surface color #212121. Headlines in Almarai 700. Inset padding should be generous (2rem+).
- **About Cards:** Surface color #101010. Designed for longer-form reading. Use Almarai 300 for body copy.

### Input Fields
- Underline-only style or very subtle #212121 background. Focus state: Border-bottom transitions to Warm Cream.

### Lists
- Minimalist markers. Use the Primary Accent color for bullets or numbers. Generous vertical padding between list items.

### Special Component: The "Prisma Reveal"
- A specific component for text reveals where a horizontal line expands from the center, followed by text fading in from 0% to 100% opacity over 1.2 seconds.