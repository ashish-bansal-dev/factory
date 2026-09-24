# Project: Dual-Channel Offer Architecture & Vendor Subdomain SaaS

## Architecture
Mercur is a Medusa v2-based multi-vendor marketplace platform. This project implements the Dual-Channel Offer Architecture (Retail ThreadBuy + Wholesale FactoryTribe) and Vendor Subdomain SaaS platform across core backend modules, types, API routes, workflows, admin & vendor dashboards, and dual storefronts.

### High-Level Architecture & Data Flow
1. **Multi-Tenancy & Domain Routing**:
   - Hostnames (`*.threadbuy.com`, `*.factorytribe.com`, or custom domains `brand.com`, `b2b.brand.com`) are resolved via `GET /store/domains/resolve?hostname=...` to tenant `seller_id` and `channel_type` ('retail' | 'wholesale').
   - Storefront middleware attaches `x-channel` header ('retail' | 'wholesale') to all downstream API requests.
2. **Channel-Scoped Offers & Pricing**:
   - The `Offer` entity supports `offer_type` ('retail' | 'wholesale'), `bundle_size` (pack step, integer >= 1), optional `mrp` (BigNumber), and `lead_time_days`.
   - Sellers can create multiple offers per variant differentiated by `offer_type` with composite index `["seller_id", "sku", "offer_type"]`.
   - `SellerType.RETAILER` accounts are strictly prevented from creating wholesale offers, while manufacturers, distributors, wholesalers, and legacy sellers can create both.
   - `/store/products` and `/store/offers` evaluate `x-channel` to filter offers and decorate variants with unit price, pack price (`unit_price * bundle_size`), bundle size, and MRP savings.
3. **Cart Divisibility Validation**:
   - Wholesale cart operations validate that line item quantities are strict multiples of `offer.bundle_size`.
4. **Dashboards**:
   - `packages/vendor`: Channel selector in offer creation, bundle size, freight profile filtering, retailer restrictions, channel filter tabs and badges in offer lists, dual-domain management cards.
   - `packages/admin`: Dual-domain management cards with manual verification override.
5. **Dual Storefronts**:
   - `apps/storefront` (Retail ThreadBuy): Subdomain extraction, retail buy-box with single unit purchase and MRP savings.
   - `apps/storefront-wholesale` (Wholesale FactoryTribe): Subdomain extraction, Wholesale PDP Bulk Add Matrix component with pack step increments, dynamic margin calculations, bulk add to cart, and RFQ inquiry modal.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Offer Model Extension | Add `offer_type`, `bundle_size`, `mrp` (with `raw_mrp` jsonb), `lead_time_days`, and update composite unique index to `["seller_id", "sku", "offer_type"]` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Dedicated Domain Module | Create `packages/core/src/modules/domain` with `DomainMapping` entity, service, and unique B-tree index on domain | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Domain-Seller Link | Define cross-module link between DomainMapping and Seller in `packages/core/src/links` | M1 | ORIGINAL_REQUEST §R1 |
| 4 | SellerType.RETAILER Enum | Add `RETAILER = "retailer"` in `packages/types` and enforce in offer creation workflows | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Domain Backfill Migration | Create idempotent migration utility to backfill `seller.metadata.domain_settings` into `DomainMapping` | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Fast Domain Resolve Endpoint | Implement `GET /store/domains/resolve?hostname=...` with indexed lookup & fallback | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Channel Scoping & Pricing | Update `/store/products`, `/store/offers`, and wrapper utilities for `x-channel: retail \| wholesale` | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Virtual Field Stripping | Update `splitComputedVariantFields` to strip virtual fields (`bundle_size`, `pack_price`, `mrp`, `offer_type`) | M2 | Explorer 2 survey |
| 9 | Admin Domain Management | Implement `/admin/sellers/:id/domains` (list, add, verify, delete) with manual override | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Vendor Domain Management | Implement `/vendor/domains` (list, request, DNS check) with Node `dns.promises` | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Wholesale Cart Line Item Validation | Enforce line item quantity is multiple of `offer.bundle_size` on `/store/carts/:id/line-items` | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Vendor Offer Creation Channel UX | Add channel selector, pack size (`bundle_size` default 6), freight profiles, optional `mrp`, retailer disabled | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Vendor Offer Lists Filtering | Add channel filter tabs (`All`, `Retail`, `Wholesale`) and badges for `offer_type` and `bundle_size` | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Vendor & Admin Domain Settings UI | Upgrade domain configuration for ThreadBuy and FactoryTribe with live DNS check triggers | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Retail ThreadBuy Storefront UX | Algorithmic subdomain extraction, `x-channel: 'retail'`, retail buy-box, MRP savings display | M4 | ORIGINAL_REQUEST §R4 |
| 16 | Wholesale FactoryTribe Storefront UX | Algorithmic subdomain extraction, `x-channel: 'wholesale'`, Wholesale PDP Bulk Add Matrix component & RFQ | M4 | ORIGINAL_REQUEST §R4 |
| 17 | Dual-Channel Automated Integration Tests | Complete integration test suites covering all R1 & R2 backend acceptance criteria | M5 | ORIGINAL_REQUEST §Acceptance Criteria |
| 18 | Whole-Repo Lint & Build | Clean `bun run lint` and `bun run build` across all packages | M5 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Data Models, Enums & Migration | Features 1, 2, 3, 4, 5 | none | DONE |
| M2 | API Scoping, Routing & Cart Validation | Features 6, 7, 8, 9, 10, 11 | M1 | DONE |
| M3 | Admin & Vendor Management Dashboards | Features 12, 13, 14 | M1, M2 | IN_PROGRESS (worker: e3c5ee9e-6134-41a6-befd-d02ef81a1b82) |
| M4 | Dual Storefront Multi-Tenancy & Wholesale UX | Features 15, 16 | M2 | IN_PROGRESS (worker: 70e285e1-6d9d-4ae6-a3b0-8233c8849af6) |
| M5 | E2E Integration Testing & Hardening | Features 17, 18 | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Domain Module ↔ Store / Admin / Vendor API
- `DomainMapping`:
  - `id`: string (prefix `dom_`)
  - `seller_id`: string
  - `domain`: string (unique B-tree index)
  - `channel_type`: 'retail' | 'wholesale'
  - `is_custom_domain`: boolean
  - `verification_status`: 'pending' | 'verified' | 'failed'
  - `verification_token`: string
  - `verified_at`: Date | null
  - `subscription_status`: 'active' | 'inactive' | 'trial'
  - `branding_config`: Record<string, unknown> | null
- `GET /store/domains/resolve?hostname=...`:
  - Response: `{ domain: string, seller_id: string, channel_type: 'retail' | 'wholesale', is_custom_domain: boolean, status: string, branding: Record<string, unknown> | null }`

### Offer Module ↔ Store API & Workflows
- `Offer`:
  - `offer_type`: 'retail' | 'wholesale' (default 'retail')
  - `bundle_size`: number (default 1, int >= 1)
  - `mrp`: BigNumber | null
  - `lead_time_days`: number | null
  - Composite unique index: `IDX_offer_seller_sku_unique` on `["seller_id", "sku", "offer_type"]`
- `createOffersWorkflow`:
  - Enforces: if `seller.type === 'retailer'`, then `offer.offer_type` MUST be `'retail'`, else reject with `400 Bad Request`.
- `GET /store/products` & `wrapProductVariantsWithOfferPrice`:
  - Read channel from header `x-channel` (fallback to query param `channel`).
  - Filter offers by `offer_type === channel`.
  - When `wholesale`: compute `pack_price = unit_price * bundle_size`, decorate variant with `bundle_size`, `pack_price`, `mrp`, `offer_type`.
  - `splitComputedVariantFields`: strips virtual fields before querying product graph.

### Cart Line Item Validation
- `POST /store/carts/:id/line-items`:
  - When line item references an offer with `offer_type === 'wholesale'`: require `quantity % offer.bundle_size === 0`. If not, throw `400 Bad Request` with descriptive message e.g. `"Quantity must be a multiple of pack size (6)"`.

## Code Layout
- `packages/types/src/`:
  - `seller/common.ts`: `SellerType.RETAILER = "retailer"`
  - `modules.ts`: `MercurModules.DOMAIN = "domain"`
  - `domain/`: DTOs, interfaces, and types
  - `offer/`: offer type extensions
- `packages/core/src/`:
  - `modules/offer/models/offer.ts`: `offer_type`, `bundle_size`, `mrp`, `lead_time_days`, unique index
  - `modules/domain/`: `DomainMapping` model, service, migrations
  - `links/domain-seller.ts`: cross-module link
  - `workflows/offer/steps/validate-offer-seller-type.ts`: retailer restriction step
  - `api/store/domains/resolve/route.ts`: domain resolver route
  - `api/utils/offers.ts`: channel-scoping, pack pricing calculation
  - `api/store/products/helpers.ts`: virtual field stripping
  - `api/admin/sellers/[id]/domains/`: admin domain management
  - `api/vendor/domains/`: vendor domain management & DNS checks
  - `api/store/carts/[id]/line-items/route.ts` & `workflows/cart/hooks/validate.ts`: pack size divisibility checks
  - `migration-scripts/backfill-domain-settings.ts`: backfill script
- `packages/vendor/src/`:
  - `pages/offers/create/create-offer-form/`: channel selector, bundle_size, freight profiles, mrp, retailer check
  - `pages/offers/[id]/_components/offer-variants-section.tsx`: channel tabs & badges
  - `pages/settings/store/_components/store-domain-settings-section.tsx`: dual domain config
- `packages/admin/src/`:
  - `pages/stores/store-details/components/store-domain-section.tsx`: dual domain config & verify override
- `apps/storefront/`:
  - `src/middleware.ts` & `src/components/cells/ProductDetailsHeader/`: retail channel injection, buy-box & MRP savings
- `apps/storefront-wholesale/`:
  - `src/lib/tenant/resolver.ts`, `src/middleware.ts`: wholesale channel injection
  - `src/modules/products/components/bulk-add-matrix/`: wholesale PDP Bulk Add Matrix component
- `integration-tests/`:
  - `http/offer/dual-channel-offers.spec.ts`: dual channel creation, retailer restriction, cart validation, domain resolution
