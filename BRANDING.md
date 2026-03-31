# Pulsar Brand Guidelines

Version 2.0 | March 2026

---

## 1. Brand Overview

Pulsar is a market intelligence platform built for precision and speed.
The visual identity pairs a near-black monochrome base with smooth
semantic color accents, inspired by Linear's design philosophy: minimal,
functional, and typographically driven.

**Design Principles**

- Dark-first monochrome base. Color is reserved for meaning.
- Dual-typeface system: Space Grotesk for reading, Space Mono for data.
- Density over decoration. Data speaks, UI stays quiet.
- Subtle borders, no shadows. Depth through layering.
- Green means up, red means down. Nothing else uses color.

---

## 2. Logo

The Pulsar mark is an asymmetric starburst icon, a geometric
representation of a pulsar's electromagnetic emission.

| Context          | Size     | File              |
|------------------|----------|-------------------|
| Favicon          | 16-48px  | `favicon.ico`     |
| Sidebar brand    | 22px     | `logo.png`        |
| Landing page     | 28-64px  | `logo.png`        |
| PWA small        | 192px    | `icon-192.png`    |
| PWA large        | 512px    | `icon-512.png`    |
| iOS home screen  | 180px    | `apple-touch-icon.png` |

**Rules**

- White icon on dark backgrounds, dark on light backgrounds.
- Minimum size: 16px. Clear space: 25% of icon width.
- Never rotate, skew, recolor, or add effects.

---

## 3. Typography

Pulsar uses a dual-typeface system from the Space type family.

### 3.1 Space Grotesk — Body & UI

A geometric sans-serif for body copy, descriptions, navigation,
labels, and all general UI text. Clean, highly readable, modern.

```
font-family: 'Space Grotesk', system-ui, sans-serif;
```

**Weights**: 300 (Light) through 700 (Bold), variable.
**Usage**: Applied globally via `font-sans` class on `<html>`.

| Context              | Weight      | Size     |
|----------------------|-------------|----------|
| Body text            | Regular 400 | 14px     |
| Labels, nav items    | Medium 500  | 14px     |
| Card titles          | Semibold 600| 14-16px  |
| Descriptions, meta   | Regular 400 | 12px     |
| Buttons              | Medium 500  | 13-14px  |

### 3.2 Space Mono — Headings & Data

A monospaced typeface for page titles, section headings, prices,
percentages, and all numeric/financial data. Gives the platform
its distinctive technical character.

```
font-family: 'Space Mono', ui-monospace, monospace;
```

**Weights**: 400 (Regular), 700 (Bold).
**Usage**: Auto-applied to `<h1>`-`<h4>` via CSS base layer.
Explicitly used via `font-mono` class on prices and data.

| Context              | Weight  | Size     | Classes                        |
|----------------------|---------|----------|--------------------------------|
| Hero title           | Bold    | 36-60px  | `font-mono font-bold`          |
| Page title           | Bold    | 24px     | `font-mono` (auto via h1)      |
| Section heading      | Bold    | 18px     | `font-mono` (auto via h2)      |
| Prices               | Bold    | 14px     | `font-mono font-bold tabular-nums` |
| Change values        | Medium  | 12-14px  | `font-mono tabular-nums`       |
| Timestamps, IDs      | Regular | 12px     | `font-mono`                    |

### 3.3 Numeric Display

All financial data uses `tabular-nums` for perfect column alignment:

```html
<span class="font-mono font-bold tabular-nums">$142.58</span>
<span class="font-mono tabular-nums text-positive">+1.67%</span>
```

---

## 4. Color System

The palette is monochrome with two semantic accent colors.
All grays use OKLCH with zero chroma. Accent colors use low
chroma (0.13-0.14) for a smooth, desaturated appearance that
blends with the monochrome base.

### 4.1 Dark Theme (Default)

**Monochrome Base**

| Token                 | Value              | Hex      | Usage                    |
|-----------------------|--------------------|----------|--------------------------|
| `--background`        | `oklch(0.06 0 0)`  | #0e0e0e  | Page background          |
| `--card`              | `oklch(0.10 0 0)`  | #191919  | Cards, elevated surfaces |
| `--muted`             | `oklch(0.13 0 0)`  | #202020  | Secondary surfaces       |
| `--foreground`        | `oklch(0.93 0 0)`  | #ededed  | Primary text             |
| `--muted-foreground`  | `oklch(0.45 0 0)`  | #6b6b6b  | Secondary text           |
| `--primary`           | `oklch(0.93 0 0)`  | #ededed  | CTA buttons, active nav  |
| `--primary-foreground`| `oklch(0.06 0 0)`  | #0e0e0e  | Text on primary buttons  |
| `--border`            | `oklch(1 0 0 / 6%)`| —        | Borders, dividers        |
| `--input`             | `oklch(1 0 0 / 8%)`| —        | Input borders            |

**Semantic Accents**

| Token          | Value                   | Hex      | Usage                |
|----------------|-------------------------|----------|----------------------|
| `--positive`   | `oklch(0.72 0.13 152)`  | #6bc992  | Gains, price up      |
| `--negative`   | `oklch(0.68 0.13 25)`   | #c98472  | Losses, price down   |
| `--destructive`| `oklch(0.65 0.14 22)`   | #c07a68  | Delete, errors       |

**Chart Palette**

| Token       | Value                  | Usage           |
|-------------|------------------------|-----------------|
| `--chart-1` | `oklch(0.93 0 0)`     | Primary (white) |
| `--chart-2` | `oklch(0.72 0.13 152)`| Positive green  |
| `--chart-3` | `oklch(0.58 0 0)`     | Neutral gray    |
| `--chart-4` | `oklch(0.68 0.13 25)` | Negative red    |
| `--chart-5` | `oklch(0.25 0 0)`     | Dark gray       |

### 4.2 Light Theme

Same structure, adjusted for light background readability:

| Token        | Value                  | Usage          |
|--------------|------------------------|----------------|
| `--positive` | `oklch(0.45 0.14 152)` | Darker green   |
| `--negative` | `oklch(0.50 0.14 22)`  | Darker red     |

### 4.3 Color Usage Rules

Color is **only** used for semantic financial meaning:

| Meaning          | Class              | Dark Result      |
|------------------|--------------------|------------------|
| Price increase   | `text-positive`    | Smooth green     |
| Price decrease   | `text-negative`    | Smooth red       |
| Gain badge       | `bg-positive/10 text-positive` | Tinted green |
| Loss badge       | `bg-negative/10 text-negative` | Tinted red   |
| Error message    | `text-destructive` | Muted red        |
| Live indicator   | `bg-positive`      | Green dot        |
| Offline          | `bg-muted-foreground` | Gray dot      |

Everything else (buttons, nav, cards, text) remains monochrome.

### 4.4 Flash Animations

Price change flashes use the semantic colors at low opacity:

```css
/* Positive flash: smooth green tint */
0%:   oklch(0.72 0.13 152 / 12%)
100%: transparent

/* Negative flash: smooth red tint */
0%:   oklch(0.68 0.13 25 / 12%)
100%: transparent
```

---

## 5. Spacing & Layout

### 5.1 Border Radius

Base: `0.5rem` (8px).

| Token        | Size | Usage                    |
|--------------|------|--------------------------|
| `radius-sm`  | 5px  | Badges, small elements   |
| `radius-md`  | 6px  | Inputs, small buttons    |
| `radius-lg`  | 8px  | Cards, dialogs           |
| `radius-xl`  | 11px | Large cards, modals      |

### 5.2 Layout Grid

- Max content width: `max-w-6xl` (1152px)
- Sidebar width: 220px fixed
- Page padding: `px-6` (24px)
- Card gap: `gap-4` (16px)
- Section gap: `gap-6` to `gap-8`

### 5.3 Depth Model

Borders are the primary depth cue. No box shadows.

```css
border border-border            /* Standard card */
hover:border-foreground/15      /* Hover lift */
ring-1 ring-foreground/10       /* Card outline (ui/card) */
```

---

## 6. Components

### 6.1 Buttons

| Variant      | Style                        | Usage              |
|--------------|------------------------------|--------------------|
| `default`    | White bg, dark text          | Primary CTA        |
| `outline`    | Border only, transparent     | Secondary action   |
| `ghost`      | No border, subtle hover      | Nav, tertiary      |
| `secondary`  | Dark gray bg, light text     | Alternative        |
| `destructive`| Muted red tint               | Delete, remove     |

### 6.2 Cards

```html
<div class="rounded-xl border border-border bg-card p-4">
  <h3 class="font-mono text-sm font-semibold">Title</h3>
  <p class="mt-1 text-xs text-muted-foreground">Description</p>
</div>
```

- `rounded-xl`, `border border-border`, `bg-card`
- No box shadows. Hover: `hover:border-foreground/15`
- Titles use `font-mono`, descriptions use inherited `font-sans`

### 6.3 Asset Rows

```html
<div class="grid items-center gap-4 border-b border-border px-4 py-2.5">
  <span class="text-sm font-medium">AAPL</span>           <!-- Space Grotesk -->
  <span class="font-mono font-bold tabular-nums">$192.53</span>  <!-- Space Mono -->
  <span class="font-mono text-xs tabular-nums text-positive">+1.24%</span>
</div>
```

### 6.4 Badges

| Variant    | Style                                | Usage           |
|------------|--------------------------------------|-----------------|
| `positive` | `bg-positive/10 text-positive`       | Gain indicator  |
| `negative` | `bg-negative/10 text-negative`       | Loss indicator  |
| `default`  | `bg-primary text-primary-foreground` | Primary label   |
| `secondary`| `bg-secondary text-secondary-foreground` | Category    |
| `outline`  | Border only                          | Neutral tag     |

---

## 7. Font Pairing in Practice

### Page Header
```
Dashboard                    ← h1, Space Mono, bold, 24px
Track your portfolio         ← p, Space Grotesk, regular, 14px, muted
```

### Data Table
```
AAPL  Apple Inc.             ← Space Grotesk, medium, 14px
      $192.53  +1.24%        ← Space Mono, bold, 14px + green
```

### Landing Hero
```
Market Intelligence,         ← h1, Space Mono, bold, 60px
Simplified                   ← same h1 but muted-foreground

Real-time stock tracking...  ← p, Space Grotesk, regular, 18px, muted
```

### Navigation
```
Dashboard                    ← Space Grotesk, medium, 14px
Portfolio                    ← Space Grotesk, medium, 14px
```

---

## 8. Motion & Animation

| Animation       | Duration | Usage                 |
|-----------------|----------|-----------------------|
| `flash-positive`| 500ms    | Green price flash     |
| `flash-negative`| 500ms    | Red price flash       |
| `animate-pulse` | CSS std  | Live status dot       |
| `transition`    | 150ms    | Hover states          |

---

## 9. Do / Don't

**Do:**
- Use `text-positive` / `text-negative` for financial values
- Use `font-mono` for all numeric/financial data and headings
- Use `font-sans` (Space Grotesk) for body text and UI labels
- Keep borders subtle (`oklch ... / 6%`)
- Let the monochrome base dominate; color is the exception

**Don't:**
- Use green/red for anything non-financial (badges, buttons, tags)
- Add saturated colors (no blue, amber, purple, teal)
- Mix typefaces beyond the two defined fonts
- Add box shadows to cards or containers
- Use gradients for decorative purposes

---

## 10. Technical Reference

**Fonts**: Loaded via `next/font/google`. Space Grotesk → `--font-sans`.
Space Mono → `--font-mono`. CSS base layer auto-applies `font-mono`
to `h1`-`h4` headings.

**Colors**: OKLCH color space. Monochrome grays use zero chroma.
Semantic accents use chroma 0.13-0.14 for smooth, desaturated tones.

**Theme**: Stored in `localStorage` key `"theme"`. Default: `"dark"`.
Applied via classList on `<html>`.

**File Structure**:
```
globals.css          Color tokens, font rules, animations
layout.tsx           Font imports (Space Grotesk + Space Mono)
components/ui/       Primitives (button, input, card, badge)
components/shared/   Shared (sidebar, header, asset-row, price-change)
```
