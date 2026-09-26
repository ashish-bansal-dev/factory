---
name: wholesale-storefront
description: Production-grade B2B wholesale storefront engineering skill inspired by Faire (faire.com). Governs visual tokens, editorial layouts, bulk variant matrices, vendor minimum order values (MOV), pack pricing logic, and gated catalog experiences in apps/storefront-wholesale. Trigger whenever designing, styling, building, or modifying wholesale B2B pages, components, or buyer flows in FactoryTribe.
---

# wholesale-storefront — Faire-Inspired B2B Storefront Design System

This skill governs the visual architecture, component patterns, and transactional flows of **FactoryTribe Wholesale** (`apps/storefront-wholesale`), modeled after leading wholesale marketplaces like **Faire (`faire.com`)**.

## Core Philosophy

1. **Editorial Commerce**: Warm, sophisticated, and trustworthy aesthetic (warm linen canvas, charcoal typography, serif collection headings, olive/terracotta trust accents).
2. **Wholesale Utility**: Fast, frictionless bulk buying. Never force a wholesale retailer to click 10 separate dropdowns to buy a size curve. Use high-density bulk variant matrices.
3. **Transparent Margins**: Always empower retail buyers with unit margins and estimated retail value:
   $$\text{Margin \%} = \frac{\text{MSRP} - \text{Wholesale Price}}{\text{MSRP}} \times 100$$
4. **Vendor Boundaries & Trust**: Minimum order values (MOV), lead times, and brand stories must be front-and-center on cards, brand pages, and cart groups.

---

## References (Read before writing code)

- **`references/tokens.md`** — Color palette (linen, charcoal, terracotta, olive), typography scales, spacing tokens, and border radii.
- **`references/components.md`** — Wholesale component library: `BulkVariantMatrix`, `WholesaleProductCard`, `BrandSpotlightBanner`, `VendorMOVProgressBar`, `GatedPricingBadge`, `SampleRequestModal`.
- **`references/flows.md`** — Architectural rules for gated pricing states, bundle pack validation, multi-vendor cart splitting, and inquiry routing.

---

## The Wholesale Workflow

### 1. Identify the Page Archetype & Buyer Auth State
- **Archetype**:
  - *Curated Marketplace Hub* (`app/[countryCode]/page.tsx`): Editorial hero, "Shop by Brand", wholesale deal rails, retailer onboarding banner.
  - *Wholesale PDP* (`app/[countryCode]/products/[handle]/page.tsx`): Image gallery, brand info card (MOV/lead time), Bulk Variant Matrix, volume discount table, sample request CTA.
  - *Wholesale Catalog / Discovery* (`app/[countryCode]/store/page.tsx`): Faceted search with MOV, lead-time, category, and margin filters.
  - *Vendor-Split Cart* (`app/[countryCode]/cart/page.tsx`): Grouped by vendor with MOV progress indicators.
  - *Brand Storefront* (`app/[countryCode]/brands/[handle]/page.tsx`): Dedicated vendor header, banner, brand story, linesheets, and vendor catalog.
- **Buyer State**:
  - *Guest*: Gated wholesale price (`MSRP $36.00 · Register to View Wholesale Prices`).
  - *Approved Buyer*: Net wholesale price + strike-through MSRP + margin percentage.

### 2. Adhere to Design System Rules
- Follow `references/tokens.md` — never use raw arbitrary hex values or garish neon colors.
- Maintain human-readable code: no unnecessary AI commentary, clean TypeScript, strong typing.
- Always verify bundling and build with `bun run build` in `apps/storefront-wholesale`.
