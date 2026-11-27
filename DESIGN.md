---
name: Kinetic Ledger
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#004f35'
  on-tertiary: '#ffffff'
  tertiary-container: '#006a48'
  on-tertiary-container: '#60eeb1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-xl-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-metric:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system merges the precision, utility, and speed of consumer fintech (Revolut, Wise, Mercury) with institutional education management. It treats academic administration—tuition collection, attendance ledgers, student performance indices, and capacity metrics—as high-velocity financial and operational data streams.

### Aesthetic Foundation
- **Modern Fintech Precision**: Confident typography, aggressive spatial rhythm, and hyper-legible numerical presentations. Zero ornamental clutter.
- **Micro-tactile Layering**: High-contrast foregrounds floating over calm, slate-tinted canvas structures with diffuse ambient occlusion rather than heavy drop shadows.
- **Metric-First Hierarchy**: Key figures and status flags command attention through deliberate color weighting and monospaced tabular numerals.
- **Tone**: Pragmatic, authoritative, razor-sharp, and reassuringly modern.

## Colors

The palette leverages high-contrast state signifiers against a cool, clinical canvas.

### Palette Architecture
- **Primary (`#1D4ED8`)**: Electric Sapphire. Used for primary CTAs, active pagination states, focus rings, selected rows, and interactive links.
- **Secondary (`#0F172A`)**: Deep Obsidian Slate. Used for primary headers, stat block values, and dominant structural elements.
- **Functional Semantics**:
  - **Success / Collected (`#10B981`)**: Vivid Emerald. Reserved for fully collected balances, cleared student clearances, and positive yield deltas.
  - **Critical / Overdue (`#EF4444`)**: Crimson Flare. Used for overdue tuition, academic warnings, non-attendance flags, and destructive actions.
  - **Warning / Pending (`#F59E0B`)**: Warm Amber. Indicates pending parent verifications, processing escrows, and mid-tier thresholds.
- **Neutrals & Canvas**:
  - **Canvas Base**: `#F8FAFC` (Slate 50).
  - **Card Surface**: `#FFFFFF` with `#F1F5F9` (Slate 100) borders.
  - **Subdued Text & Icons**: `#64748B` (Slate 500) and `#94A3B8` (Slate 400).

## Typography

The typographic hierarchy prioritizes rapid scannability and financial rigor.

### Key Rules
- **Tabular Numerals**: Apply `font-feature-settings: "tnum" 1, "cv05" 1` across all body, header, and metric tokens to prevent horizontal jitter during data refreshes and preserve column alignment in ledgers.
- **Numerical Primacy**: All student counts, currency amounts, transaction IDs, and GPA values use high-contrast styling with strict numeric baseline alignments.
- **Labels & Micro-Data**: `label-code` (JetBrains Mono) is strictly applied to system UUIDs, voucher codes, invoice serials, and timestamp references.

## Layout & Spacing

A responsive 12-column grid provides structure across wide analytics dashboards down to mobile handheld audits.

### Structure
- **Desktop (≥1280px)**: 12-column fluid grid, 2rem margins, 1.5rem gutters. Maximum container width capped at 1600px for ultrawide panels.
- **Tablet (768px - 1279px)**: 8-column layout, 1.5rem margins, 1rem gutters. Side navigation collapses to an icon bar.
- **Mobile (<768px)**: 4-column layout, 1rem margins, 0.75rem gutters. Complex data tables switch to stacked card-based records.

### Spacing Principles
- Metrics dashboards use internal card padding of `space-lg` (1.5rem) to maintain expansive breathing room around dense numbers.
- Compact tables use vertical cell padding of `space-sm` (0.5rem) and horizontal cell padding of `space-md` (1rem).

## Elevation & Depth

Visual hierarchy is constructed through soft, multi-stop ambient shadows paired with razor-thin structural borders.

### Surface Tiers
- **Tier 0 (Canvas Base)**: `#F8FAFC`. Background layer holding navigation rails and header utilities.
- **Tier 1 (Surface Cards & Panels)**: Pure `#FFFFFF` surface bordered by a 1px stroke of `#F1F5F9`. Shadow formula: `0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.04)`.
- **Tier 2 (Popovers, Flyouts & Modals)**: Pure `#FFFFFF`, border 1px `#E2E8F0`. Shadow formula: `0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)`.
- **Tier 3 (Floating Command Palettes / Overlays)**: `#FFFFFF` with backdrop blur on underlying layers (`backdrop-filter: blur(8px); background-color: rgba(255, 255, 255, 0.85)`). Shadow: `0 24px 48px -12px rgba(15, 23, 42, 0.14)`.

## Shapes

The design uses generous corner radii to project warmth and consumer software elegance, contrasting the rigid data grids within.

- **Primary Cards & Containers**: `1rem` (`rounded-2xl` equivalent) for standard dashboard cards and summary widgets.
- **Micro Elements**: `0.5rem` (`rounded-lg`) for buttons, form controls, chips, and table row selectors.
- **Pill Badges**: `9999px` (`rounded-full`) strictly reserved for status indicators, counter badges, and numerical trend flags (`+12.4%`).

## Components

### Buttons
- **Primary**: Solid Sapphire (`#1D4ED8`), label in white (`#FFFFFF`), `font-weight: 600`, 0.5rem radius, height 40px, padding 0 16px. Subtle inset highlight (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16)`). Hover state darkens to `#1E40AF`.
- **Secondary**: Surface white (`#FFFFFF`), border 1px solid `#E2E8F0`, text `#0F172A`. Hover transitions background to `#F8FAFC`.
- **Tertiary / Ghost**: Transparent, text `#64748B`, hover background `#F1F5F9`, hover text `#0F172A`.

### Status Badges & Metric Chips
- **Success / Paid**: Background `#ECFDF5`, text `#047857`, border 1px solid `#A7F3D0`.
- **Critical / Overdue**: Background `#FEF2F2`, text `#B91C1C`, border 1px solid `#FECACA`.
- **Warning / Unpaid**: Background `#FFFBEB`, text `#B45309`, border 1px solid `#FDE68A`.
- **Neutral / Draft**: Background `#F8FAFC`, text `#475569`, border 1px solid `#E2E8F0`.
- Badges feature an optional 6px circular pulsing dot for real-time status indication.

### Input Fields & Controls
- **Height**: 40px standard; font size 14px; background `#FFFFFF`; border 1px solid `#CBD5E1`.
- **Focus**: Border color `#1D4ED8`, paired with a 3px external glow `rgba(29, 78, 216, 0.12)`.
- **Monetary / Numeric Inputs**: Left-adorned currency badge or token symbol rendered in JetBrains Mono with tabular numeral alignment.

### Ledger Data Tables
- Header cells: Uppercase 11px (`label-caps`), text `#64748B`, background `#F8FAFC`, bottom border 1px solid `#E2E8F0`.
- Row cells: Height 52px, horizontal padding 16px, bottom border 1px solid `#F1F5F9`. Hover state shifts entire row background to `#F8FAFC`.
- Selection: Checkbox checked sets row highlight to `#EFF6FF` (Blue 50).

### Financial KPI Stat Cards
- Container: Surface white, radius `1rem`, padding `1.5rem`, border 1px solid `#F1F5F9`.
- Architecture:
  1. Top row: Subdued uppercase label + right-aligned circular icon or status pill.
  2. Center row: Huge primary value (e.g., `$1,248,500.00`) set in `data-metric`.
  3. Bottom row: Comparison tag (e.g., `+8.2% vs last term`) in emerald or crimson, accompanied by micro-sparkline or target progress bar.