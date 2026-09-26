# Wholesale Storefront Design Tokens (Faire Reference)

## 1. Color Palette

| Token Role | Tailwind Class / CSS Var | Hex Value | Context / Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `bg-linen` / `bg-[#FAF9F5]` | `#FAF9F5` | Global body & page background |
| **Surface Card** | `bg-white` | `#FFFFFF` | Product cards, modals, tables, white content cards |
| **Subtle Surface** | `bg-sand-50` / `bg-[#F4F1EA]` | `#F4F1EA` | Secondary pills, table headers, sidebar filters |
| **Primary Text** | `text-charcoal-900` / `text-[#18181B]` | `#18181B` | Headings, titles, prices, main labels |
| **Muted Text** | `text-stone-600` / `text-[#57534E]` | `#57534E` | Descriptions, metadata, secondary info |
| **Subtle Text** | `text-stone-400` / `text-[#A8A29E]` | `#A8A29E` | Placeholders, inactive icons, strike-through MSRP |
| **Border Subtle** | `border-stone-200` / `border-[#E7E5E4]` | `#E7E5E4` | Card dividers, matrix grid lines, inputs |
| **Border Strong** | `border-stone-300` / `border-[#D6D3D1]` | `#D6D3D1` | Active inputs, primary borders, table headers |
| **Brand Primary** | `bg-terracotta-600` / `bg-[#C85A32]` | `#C85A32` | Primary wholesale CTAs, active badges |
| **Brand Primary Hover** | `hover:bg-terracotta-700` / `#B24A24` | `#B24A24` | Hover state for primary buttons |
| **Trust Olive (B2B)** | `bg-[#1E3A2F]` / `text-[#2D5A43]` | `#1E3A2F` | Verified brand badge, Net terms, in-stock badge |
| **Warm Ochre / Alert** | `bg-amber-50` / `text-amber-900` | `#FEF3C7` | MOQ warning, low inventory alert, savings highlight |

---

## 2. Typography

### 2.1 Fonts
- **Serif Display**: `font-serif` (Playfair Display / Georgia / Serif) — used for:
  - Hero editorial statements
  - Collection titles (e.g. *"Autumn / Winter 2026 Knitwear"*)
  - Brand spotlight names and quotes
- **Sans-Serif Functional**: `font-sans` (Plus Jakarta Sans / Inter / sans-serif) — used for:
  - Product titles, navigation items, buttons
  - Bulk variant matrix inputs and tabular pricing data
  - Badges, filters, and checkout summaries

### 2.2 Scale
- `text-xs` (11px-12px): Badges, strike-through MSRP, SKU numbers, MOV progress text.
- `text-sm` (13px-14px): Product card titles, matrix row labels, filter items, subtotal labels.
- `text-base` (15px-16px): Main body copy, button labels, wholesale prices on cards.
- `text-lg` (18px): Section titles, PDP product titles, cart total.
- `text-2xl` - `text-4xl` (24px - 36px): Hero headings, brand page headers.

---

## 3. Shadows & Radii
- **Border Radius**: Refined, gentle curvature:
  - Cards & modals: `rounded-lg` (8px) or `rounded-xl` (12px).
  - Badges & pills: `rounded-full`.
  - Matrix table cells & inputs: `rounded-md` (6px).
- **Elevation**:
  - Cards: `shadow-sm` on rest, `hover:shadow-md` on hover with `transition-shadow duration-200`.
  - Floating action bars / Sticky cart bars: `shadow-lg border-t border-stone-200`.
