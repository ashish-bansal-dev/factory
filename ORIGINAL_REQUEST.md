# Original User Request

## 2026-09-23T16:02:23Z

Implement the Dual-Channel Offer Architecture (Retail ThreadBuy + Wholesale FactoryTribe) and Vendor Subdomain SaaS platform across the Mercur marketplace codebase.

Working directory: /home/dev/mercur-new
Integrity mode: development

## Requirements

### R1. Core Data Models, Enums & Migration
- Extend the `Offer` entity in `packages/core` with `offer_type` ('retail' | 'wholesale'), `bundle_size` (pack step, integer >= 1), optional `mrp` (BigNumber), and `lead_time_days`. Update composite unique index to `["seller_id", "sku", "offer_type"]`.
- Create dedicated `domain` module in `packages/core` with `DomainMapping` entity (fields: `id`, `seller_id`, `domain`, `channel_type`, `is_custom_domain`, `verification_status`, `verification_token`, `verified_at`, `subscription_status`, `branding_config`) and a unique B-tree index on `domain`.
- Add `RETAILER = "retailer"` to `SellerType` in `packages/types`. Enforce that sellers with `seller_type === 'retailer'` can only create retail offers, while manufacturers, distributors, wholesalers, and untyped/legacy sellers can create both retail and wholesale offers.
- Provide a migration utility to backfill existing `seller.metadata.domain_settings` into `DomainMapping` records.

### R2. API Scoping, Routing & Cart Validation
- Implement `GET /store/domains/resolve?hostname=...` for fast tenant and channel resolution.
- Update `/store/products`, `/store/offers`, and product wrapper utilities (`wrapProductVariantsWithOffers`, `wrapProductVariantsWithOfferPrice`) to scope offers and calculate prices according to `x-channel: 'retail' | 'wholesale'` (with query parameter fallback).
- Add domain management endpoints: `/admin/sellers/:id/domains` (list, add, verify, delete) and `/vendor/domains` (list, request, DNS check). Support automated DNS TXT/CNAME resolution via Node `dns.promises` plus manual admin verification override.
- Enforce wholesale cart line item validation on `/store/carts/:id/line-items`: reject quantities that are not multiples of `offer.bundle_size`.

### R3. Admin & Vendor Management Dashboards
- In `packages/vendor` offer creation modal, add a channel selector ('Retail (ThreadBuy)' vs 'Wholesale (FactoryTribe)'). When Wholesale is selected, render pack size (`bundle_size`, default 6) and freight shipping profiles. Disable wholesale selection for Retailer accounts.
- Add an optional `mrp` (Maximum Retail Price) field to offer creation and editing for both channels.
- In `packages/vendor` offer lists, add channel filter tabs (`All`, `Retail`, `Wholesale`) and display badges for `offer_type` and `bundle_size`.
- In `packages/vendor` and `packages/admin` store settings, upgrade domain configuration to manage both ThreadBuy retail domains (`[handle].threadbuy.com` / `brand.com`) and FactoryTribe wholesale domains (`[handle].factorytribe.com` / `b2b.brand.com`) with live "Check DNS" triggers and verification instructions.

### R4. Dual Storefront Multi-Tenancy & Wholesale UX
- In `apps/storefront` (Retail ThreadBuy): Implement algorithmic subdomain extraction (`*.threadbuy.com` -> retail channel) and pass `x-channel: 'retail'` on API requests. Display retail buy-box and optional MRP savings.
- In `apps/storefront-wholesale` (Wholesale FactoryTribe): Implement algorithmic subdomain extraction (`*.factorytribe.com` -> wholesale channel) and pass `x-channel: 'wholesale'` on API requests.
- On Wholesale PDP in `apps/storefront-wholesale`, build the Bulk Add Matrix component: multi-variant quantity matrix with pack step increments (`bundle_size`), dynamic price and MRP margin calculations, single-click bulk add to cart, and wholesale RFQ inquiry submission.

## Acceptance Criteria

### Backend & Model Verification
- [ ] Automated integration tests verify that a manufacturer/wholesaler can create both retail (single-unit) and wholesale (pack size >= 1) offers on the same product variant.
- [ ] Automated integration tests verify that a retailer is rejected when attempting to create a wholesale offer.
- [ ] Automated integration tests verify that `GET /store/products` with `x-channel: retail` returns retail offers and prices, while `x-channel: wholesale` returns wholesale offers, pack prices, and bundle sizes.
- [ ] Automated integration tests verify that adding a line item to a wholesale cart with a quantity not divisible by `bundle_size` fails with a descriptive validation error.
- [ ] Automated integration tests verify `GET /store/domains/resolve` correctly resolves retail subdomains, wholesale subdomains, and custom domains.
- [ ] Migration step successfully backfills existing `seller.metadata.domain_settings` into `DomainMapping` records.

### Dashboard & UI Verification
- [ ] Vendor portal offer creation modal correctly switches form schema between retail and wholesale, including bundle_size and optional MRP.
- [ ] Admin and Vendor domain settings allow configuring and verifying distinct retail and wholesale domains.
- [ ] `bun run lint` and `bun run build` pass cleanly across all packages without type errors or broken references.

### Storefront Verification
- [ ] ThreadBuy storefront displays retail buy-box with single unit purchase and retail shipping.
- [ ] FactoryTribe storefront displays PDP Bulk Add Matrix with pack step increments and dual checkout/inquiry options.

## 2026-09-23T17:04:13Z

User directive: Limit non-required workers. Please streamline and lean out subagent execution:
- Avoid launching redundant parallel verification swarms (e.g. limit gates to a single reviewer/test runner rather than 2 reviewers + 2 challengers + auditor).
- Use single focused workers for milestones where possible.
- Minimize background processes to only strictly necessary implementation and test execution tasks.

## 2026-09-23T17:27:35Z

User directive: Remove any non-essential steps to fast pace implementation.
- Bypass intermediate review/auditing gates between milestones. Transition directly from Milestone 2 -> Milestone 3 -> Milestone 4 without pausing for intermediary reviewers.
- Fast-track implementation across packages/vendor, packages/admin, and the dual storefronts.
- Consolidate all verification into a single final test/build pass at the end.
