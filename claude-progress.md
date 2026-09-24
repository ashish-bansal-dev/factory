# Claude Progress -- Mercur.js

This is the session log and current-state tracker. Keep it short: prune old
session detail aggressively. The per-spec source of truth lives in
`docs/specs/SPEC-*.md` (status + Evidence) — this file is just the running log.

## Current Verified State

- **Repository root**: `/Users/viktorholik/Desktop/mercur`
- **Current branch**: `main`
- **Current version**: `2.2.0-rc.1`
- **Standard startup path**: `bun install && bun run dev`
- **Standard verification path**: `bun run build`, `bun run lint` (oxlint),
  `bun run test:integration:http -- <pattern>`
- **Current blocker**: none

## Session — Panel auth collision, branch `fix/panel-auth-session-collision`

Admin and vendor panels shared one API session cookie, so logging in to one logged the other out.
Both panels now keep their JWT in origin-local storage and send `Authorization` (+ `x-seller-id`
for vendor) via `getAuthHeaders` (exported from `@mercurjs/admin` / `@mercurjs/vendor`);
`@mercurjs/client` gained a `headers` option; `POST /vendor/sellers/select` returns `seller_id` and
only writes the session for session-authenticated callers. Host apps + `templates/basic` clients
updated. Verified: `bun run build`, `test:integration:http -- panel-auth` (2/2). Not verified in a
browser. **Open risk**: the messaging block's panel SSE (`EventSource` + `withCredentials`) can't
send a bearer header, so it falls back to polling until it gets a token-exchange flow.
Uncommitted.

## Session — Wholesale Order Grid & PDP 2-Column Redesign
- **Wholesale PDP 2-Column Layout**:
  - Reorganized `ProductTemplate` in `apps/storefront-wholesale` into a 2-column layout: left column contains sticky featured `ImageGallery` with interactive thumbnail selector; right column contains product title, badges, and the cart addition grid.
  - Added formatted Description Box and Product Information specifications accordion (`ProductTabs`) directly below the grid.
- **Variant Order Grid & Cart Steps**:
  - Upgraded `QuickVariantGrid` with columns for Variant & monospace copyable Variant ID, MRP with savings percentage, Wholesale Unit & Pack Price, and `+/-` pack stepper.
  - Enforced pack increments (`bundle_size`) on `+/-` and input blur, preventing invalid pack quantity checkout errors.
  - Added row-level "+ Add" and bulk summary cart addition ("Add Selected to Cart", "WhatsApp Quote").
- **Vendor Panel Wholesale Offer Persistence**:
  - Updated batch create (`POST /vendor/offers/batch`) and update workflows to persist `offer_type`, `bundle_size`, `mrp`, and `lead_time_days` to database columns.
  - Updated vendor offer edit and pricing display components.

## Session — Subdomain Scoping & Buybox Inventory Fixes
- **Tenant Subdomain Scoping**:
  - Implemented tenant header propagation in `apps/storefront/src/lib/data/cookies.ts` (`getAuthHeaders` now reads `x-tenant-handle`, `x-seller-id`, `x-is-tenant`, `x-channel` via `next/headers`).
  - Scoped cache tags (`tenant-${handle}-...`) and isolated cart cookies (`_medusa_cart_${handle}`).
  - Scoped catalog queries in `apps/storefront/src/lib/data/products.ts` (`listProducts`, `listProductsWithSort`, `searchProducts`) and `apps/storefront/src/lib/data/offers.ts` (`listOffers`) to tenant seller.
  - Updated category/collection listing pages (`categories/page.tsx`, `categories/[category]/page.tsx`, `collections/[handle]/page.tsx`) to pass resolved `seller_id` to `SearchProductsListing` and `ProductListing`.
  - Added RLS scoping to `GET /store/offers` and `GET /store/offers/:id` in `packages/core` to respect `x-tenant-handle` and `x-seller-id`.
- **Zero-Stock & Buybox Reserved Stock Fix**:
  - Fixed `isPurchasable` import in `ProductDetailsHeader.tsx`.
  - Updated store offer helpers and query config to calculate net available stock (`stocked_quantity - reserved_quantity`).
  - Disabled Add-to-Cart and updated button label when available stock is 0.
- **Verification**:
  - Full workspace build: `turbo run build` (13/13 successful).
  - Next.js storefront build: `next build` in `apps/storefront` (Compiled successfully in 11.8s).
  - Integration tests passing: `channel-scoping-pricing.spec.ts` (7/7) and `domain-resolution.spec.ts` (8/8).

## Session — Admin Inventory (MER-139), branch `feat/admin-inventory`

Spec + audit: `docs/specs/spec-3-admin-inventory/`. Implemented (type-clean; deps built; lint
warnings pre-existing only): **D-01** remove admin create-inventory-item flow; **D-04** drop
"Details" suffix; **D-06** Edit Attributes `InlineTip`; **D-12** Manage-Qty warning `InlineTip`;
**D-13** Edit Details flip (Title required / SKU optional); **D-15** toast copy → Figma verbatim +
subtitle; **D-18** Create Reservation warning `InlineTip`. Added all prompt/warning i18n keys and
regenerated the `$schema.json` inventory block (inventory subtree 66/66 parity).

Also done: **D-16** delete item + delete level prompts (verbatim copy, `{{location}}` interp);
**D-17** reservation delete two cases (discriminator `reservation.line_item_id` → unfulfilled-order
"Got it" info prompt vs deletable confirm); **D-19** bulk "Edit stock levels" pre-confirm prompt;
**D-14** adjust-qty empty-quantity message. Schema parity 67/67.

Also done (frontend, build-clean): **D-02** Product + Store columns + reorder (In stock before
Reserved); list now requests `+variants.product.title,+seller.name`. **D-03** filters =
SKU/Store/Location/Height/Width/MID code/Material (dropped Length/Weight/Requires-shipping) +
default sort `title` ascending (**G3b**); `seller_id` flows through the query. **D-14** reservation
required-field messages (schema moved to `buildCreateReservationSchema(t)`). Fixed a pre-existing
`AdminInventoryItemParams`→`AdminInventoryItemsParams` typo.

All touched files type-clean (`tsc --noEmit`); remaining tsc errors are pre-existing
(`@custom-types/*` alias cascade + untouched `inventory-metadata`/`inventory-stock-form`).

**Backend-remaining (needs running API — NOT verifiable in this worktree per project constraints):**
- Admin `inventory-items` route override in `packages/core` so the **Store filter** (`seller_id`
  param) is accepted and the **Store column** seller-link is guaranteed to resolve. (Store column
  may already resolve via global links in `fields`; the `seller_id` filter needs the override.)
- **D-05** Associated-offers sidebar (needs offer reverse-link on the inventory detail contract).
- **D-07** bulk store-ownership gate; **D-08** vendor notifications (subscribers); **D-09/D-10**
  admin location scoping to the item's store.
- **D-11** locations `…` right-align — uses canonical `columnHelper.action`; live visual check.
See `docs/specs/spec-3-admin-inventory/blueprint.md` for the route-override plan.

## Integration test (spin up to verify)

`integration-tests/http/inventory/admin/inventory.spec.ts` — type-clean (only jest-global noise
under standalone tsc, same as every spec). Run later with:
`bun run test:integration:http -- inventory/admin/inventory`. It seeds a seller + offer-backed
inventory item (stock location → shipping → product → offer) and asserts:
1. **Store column** — `GET /admin/inventory-items?fields=+seller.name` resolves the seller link
   (should PASS; validates D-02 Store column).
2. **Product via offer** — offer inventory links to the *offer, not the variant* (memory
   `offer-inventory-not-on-variant`), so `inventory_item.variants` is EMPTY; the product is
   reached through the offer. Test asserts `item.offer?.product?.title`.
3. **seller_id filter** — specifies D-03 backend; expected RED until the core route override lands.

⚠️ **Finding to action:** because offer inventory has no variant link, the current frontend Product
column (`variants?.[0]?.product?.title` in `use-inventory-table-columns.tsx`) will show `-` for
offer items. The list must reach Product through the offer instead. Test #2 confirms the exact
offer field/alias to use (verify `offer` vs `offers` when the suite runs), then update the column +
the list `fields` request accordingly.

Verify: `bun install` done; built `@mercurjs/types|client|dashboard-shared`; `tsc --noEmit`
touched-files clean (remaining errors are pre-existing `@custom-types/*` alias + workspace drift).

## Session — Vendor Campaigns Figma Sync (branch `feat/vendor-campaigns-figma-sync`)

Spec: `docs/specs/spec-1-vendor-campaigns/` (brief / blueprint / assert / deltas).

**Implemented:** D01 list Type column · D02 list Status column · D04 general row order
(Description before Identifier) · D05 configuration expiry warning · D06 merged
Spend+Budget into one Budget card (deleted `campaign-spend/`, updated detail sidebar +
skeleton) · D07 identifier tooltip · D08 no-limit helper text · D09 add-promotions tip
+ plural add toast · D11 create validation (name/identifier required, spend-currency
`refine`, i18n `campaigns.validation.*`) · D12 toast copy aligned to Figma
(non-interpolated, pluralized add/remove; wired missing remove-promotion toasts).

**Backend implemented (previously flagged as gated):**
- **D03 filters (frontend + backend)** — extended
  `packages/core/src/api/vendor/campaigns/validators.ts` (`budget_type` + `status`)
  and translated them in `route.ts` GET into `query.graph` filters (budget.type;
  starts_at/ends_at date ranges with `$or … null` for open-ended = active). Re-wired
  the `useCampaignTableFilters` hook, query passthrough, and list `filters` prop.
- **D08 "Limit usage per" (frontend, backend already supported)** — `Combobox`
  (customer / email / promotion code) in create form-fields (usage-only); schema +
  defaults gained `budget.attribute`; submit sets type `use_by_attribute` when an
  attribute is chosen (mirrors admin). Backend `VendorCreateCampaignBudget` already
  accepts `attribute` and the workflow forwards it — no backend change needed. Detail
  Budget card renders the attribute label.

**Tests:**
- `integration-tests/http/campaigns/vendor/campaigns.spec.ts` extended for D03/D08:
  `budget_type=spend|usage` filtering (+ invalid value → 400), `status=active|
  scheduled|expired` filtering (incl. open-ended = active, scheduled excluded from
  active; + invalid value → 400), and a `use_by_attribute` create with `attribute`
  persisting (D08). Not runnable in a fresh worktree (needs full install + Postgres);
  syntax-verified via TS `transpileModule`. Run in CI / installed checkout:
  `bun run test:integration:http -- campaigns/vendor`.

**Still out of scope:**
- **D12 notification-drawer entry** — backend notification template, out of UI scope.

**Verification:** vendor `tsc --noEmit` (root node_modules symlinked from main) shows
no NEW errors from these changes — remaining campaign errors are pre-existing/
environmental (unbuilt core route-map → `CampaignDTO` vs `AdminCampaign`,
`@custom-types` alias, `DEFAULT_CAMPAIGN_VALUES` enum). `oxlint` on changed files: no
new warnings. Full `bun run lint` + `bun run build` still owed in a fully-installed
checkout / CI (fresh worktree has no install).
- **Active spec**: _(none in progress — pick the highest-priority unfinished
  `docs/specs/SPEC-*.md`)_

## Session Log

### Session: 2026-09-24 -- Fix Out-of-Stock on Product Details & Buybox Inventory Resolution

- **Issue.** Vendor retail offer defined on Shirt-102 (`http://localhost:3000/in/products/shirt-102?men%27s+size=38&color=Grey`) displayed "OUT OF STOCK" on retail storefront despite vendor having stock and active offer.
- **Root Cause Analysis.**
  1. `packages/core/src/api/store/offers/query-config.ts`: `defaultStoreOfferFields` was missing `manage_inventory` and `allow_backorder`.
  2. `packages/core/src/api/store/offers/helpers.ts`: `wrapOffersWithInventoryQuantityForSalesChannel` strictly filtered levels by `channelLocationIds.has(level.location_id)`. When the default sales channel had no linked stock locations configured (`channelLocationIds.size === 0`), stocked count evaluated to 0 for all offers. Also, offers with `manage_inventory === false` or `allow_backorder === true` were not handled.
  3. `apps/storefront/src/lib/helpers/buybox.ts` & `ProductDetailsHeader.tsx`: `getOfferStock` and `isPurchasable` solely checked `inventory_quantity > 0`, ignoring `allow_backorder` and `manage_inventory === false`.
  4. Database: `sales_channel_stock_location` had 0 rows for `sloc_01M394WZJH8QMEGSZY085QHZRV` (Pehnava Store) and `product_sales_channel` had 0 rows for `shirt-102`.
- **Changes Applied.**
  - `packages/core/src/api/store/offers/query-config.ts`: Added `manage_inventory` and `allow_backorder` to `defaultStoreOfferFields`.
  - `packages/core/src/api/store/offers/helpers.ts`: Enhanced `wrapOffersWithInventoryQuantityForSalesChannel` to:
    - Grant in-stock status and default stock for `manage_inventory === false` and `allow_backorder === true`.
    - Fall back gracefully to available location levels if `channelLocationIds.size === 0`.
  - `apps/storefront/src/lib/helpers/buybox.ts`: Updated `StoreOffer`, `getOfferStock`, and `isPurchasable` to support `manage_inventory === false` and `allow_backorder === true`.
  - `apps/storefront/src/components/cells/ProductDetailsHeader/ProductDetailsHeader.tsx` & `OfferCard.tsx`: Updated `isStockMaxLimitReached` and button state to respect backorders and unmanaged inventory.
  - Linked `sloc_01M394WZJH8QMEGSZY085QHZRV` and products to `sc_01KYRTC7GDYH13MCEX0HS51H31` in `release` database.
- **Verification.**
  - `apps/storefront`: `tsc --noEmit` and `next build` passed cleanly.
  - Workspace: All 13 packages built successfully via `turbo run build`.
  - Integration tests: `dual-channel-offers.spec.ts` (8/8) and `channel-scoping-pricing.spec.ts` (7/7) passed.

### Session: 2026-07-29 -- Admin Reviews (MER-152, SPEC-2)

- **Goal.** Promote reviews from the registry block into `@mercurjs/core` and build the
  admin reviews UI to match Figma (canvas `40015049:1019815`, BASIC/store reviews).
- **Backend.** `packages/core/src/modules/review` (model + `status` enum + migration + service);
  links customer/order/seller/product; `workflows/review` (create/update/respond-add-once/delete
  + validate); admin/vendor/store API routes + validators + query-config + middlewares (registered
  in all three aggregators). `MercurModules.REVIEW` + review DTOs added to `@mercurjs/types`.
- **Admin UI.** `pages/reviews/{review-list,review-detail,review-edit,review-respond,common}` +
  `hooks/api/reviews.tsx`; route in `get-route-map.tsx`; sidebar entry after Stores; `reviews.*`
  i18n. List (Review ID/Rating stars/Content/Store/Customer/Date/Status badge/Response + Rating/
  Status/Date filters), detail (two-column + Customer/Order/Store sidebar cards), Edit drawer
  (Status+Rating), Respond drawer (add-once), delete-action hook.
- **Block removed.** `packages/registry/src/reviews/` + `registry.json` entry + built `r/` artifacts.
- **Verified.** types+core build ✓, admin ESM bundle ✓, `tsc` clean on review files, `oxlint` clean.
  Added `integration-tests/http/review/admin/review.spec.ts` (runs in CI — worktree can't run it).
- **Next.** CI integration run; migration apply on live DB; Figma visual parity; vendor-notify rule.

### Session Log (prior)

### Session: 2026-07-21 -- Vendor offer-targeted promotions (PR #1268)

- **Goal.** Port the Medusa promotion-create form into the vendor panel and add
  offer-level targeting so a vendor's "Amount off offers" promotion actually
  discounts the vendor's offers at checkout. Branch `feat/vendor-offer-promotions`.

- **Key decision — how an offer is targeted.** `ApplicationMethodTargetType`
  (`order`/`items`/`shipping_methods`) is a hardcoded Medusa enum; **offer is NOT
  a new target type**. An offer *is* a line item, so target stays `items` and
  "offer" is a new **rule attribute** with value path **`items.metadata.offer_id`**.
  The store add-to-cart route already writes `metadata.offer_id` onto the cart
  line; the promotion engine reads item-scope rules via `pickValueFromObject`, so
  matching needs no engine change — just the attribute + the metadata present in
  the compute context. `offer` replaces `product` in the vendor items-attributes
  (Figma dropdown = Offer/Category/Collection/Type/Tag). Rule-value dropdown uses
  `labelAttr: "sku"` (Offer has no `title`); seller-scoped via the `offer.seller_id`
  column (there is **no `offer_seller` pivot** — the link is read-only on the column).

- **Landed (backend, packages/core).** `rule-attributes-map.ts` (offer attr),
  `rule-query-configuration.ts` (offer→sku), `rule-value-options/.../route.ts`
  (offer branch: filter offers by `seller_id`), `validators.ts` (allow `once`
  allocation), `workflows/cart/utils/fields.ts` (add `items.metadata` to
  `cartFieldsForRefreshSteps` so rules see it), and the root-cause fix in
  `workflows/cart/steps/prepare-adjustments-from-promotion-actions.ts`.

- **Bug found + fixed (affected ALL seller promotions).** The seller-scoping of
  computed line-item adjustments compared `promotion.seller.id` to
  `lineItem.variant.product.seller.id`. Master products are not seller-owned, so
  that value is empty and every seller-scoped line discount was **silently
  dropped**. Now resolved from **`lineItem.offer.seller_id`**. This is why offer
  promotions produced 0 discount even though rule + metadata were correct.

- **Landed (vendor panel).** `templates.ts` → 3 Figma types (Amount off offers /
  Percentage off items / Buy X Get Y); submit handler no longer hard-codes
  `application_method.type: 'percentage'` and now sends `buy_rules`; added
  `is_tax_inclusive` switch + `once` allocation; schema `value` accepts
  string|number; removed the `country`/`product` attribute hard-filter in
  `rules-form-field.tsx`, passed `target_type` to the attributes hook, fixed a
  stale `promotion-create/...` import → `create/...`; offer-based
  `requiredProductRule`; i18n keys.

- **What was NOT done / owed.** (1) Buy X Get Y is wired at the type/template
  level but its buy-quantity UX wasn't deeply exercised — verify buy_rules +
  apply_to_quantity flow. (2) Update-promotion / edit-rules drawer wasn't
  re-audited for the offer attribute. (3) The Confluence promotions doc still
  omits "Amount off offers" — not updated. (4) No automatic-promotion (non-code)
  cart test; only code-applied. (5) Vendor promotions area has ~11 pre-existing
  tsc errors (tsup/esbuild ships anyway) — left as baseline.

- **Also in the PR (not my work, per user request to commit all).**
  `apps/vendor/.../store-setup.tsx` (pre-existing), `query-config.ts`
  (`limit`/`used` fields) and `create-seller-promotions.ts` (campaign linking) —
  unrelated, uncovered by these tests.

- **Verified.** Core + vendor builds clean. `test:integration:http` —
  promotions store+vendor 37/37 pass (incl. cart E2E: targeted offer discounted
  500 / discount_total 500; non-matching offer 0), offer/cart 8 pass (2 skipped),
  no regression.

- **Next.** Address owed items above; consider splitting the two unrelated files
  into their own PR.

Newest first. One entry per session, kept to a few lines: goal, what landed,
how it was verified, what's owed/next. Move durable facts into
`docs/specs/SPEC-*.md` Evidence or into memory — not here.

### Session: 2026-09-24 -- Dual-Channel Offer Architecture (Retail ThreadBuy + Wholesale FactoryTribe) & Subdomain SaaS

- **Goal.** Implement unified dual-channel commerce engine across Retail and Wholesale with vendor subdomain SaaS, channel-specific offer policies, pack sizes, optional MRP, and domain tenancy.
- **Landed.**
  - `packages/types`: Added `SellerType.RETAILER`, domain DTOs (`DomainMappingDTO`, `CreateDomainMappingDTO`, `UpdateDomainMappingDTO`, `DomainVerificationStatus`, `DomainChannelType`).
  - `packages/core`: `Offer` model extended with `offer_type`, `bundle_size`, `mrp`, `lead_time_days`, and composite unique index migrated to `["seller_id", "sku", "offer_type"]`. Added `seller_type_check` migration. Dedicated `domain` module + `domain-seller` remote link with fast `GET /store/domains/resolve?hostname=...`. Added `validateOfferSellerTypeStep` guarding retailer capabilities. Channel-scoping on `/store/products`, `/store/offers`, and pricing wrappers via `x-channel: 'retail' | 'wholesale'`. Cart line-item pack size (`bundle_size`) validation. Admin/vendor domain management with Node `dns.promises` TXT/CNAME resolution.
  - `packages/vendor` & `packages/admin`: Vendor offer creation channel selector, freight profiles, pack size, MRP inputs/badges, offer list tabs, and dual-domain store settings. Admin domain management with manual approval overrides.
  - `apps/storefront` & `apps/storefront-wholesale`: Algorithmic subdomain extraction, `x-channel` header injection, retail buy-box MRP savings, and Wholesale PDP Bulk Add Matrix component.
- **Verified.** Workspace `bun run build` passed (`13 successful, 13 total`). All 5 dual-channel integration test suites passed (`32 passed, 32 total` across `dual-channel-offers.spec.ts`, `domain-resolution.spec.ts`, `wholesale-cart-validation.spec.ts`, `channel-scoping-pricing.spec.ts`, `domain-migration.spec.ts`).
- **Next.** Deploy wildcard DNS configs (`*.threadbuy.com`, `*.factorytribe.com`) to staging/production clusters.

### Session NN: YYYY-MM-DD -- <spec / short title>

- **Goal.** One line.
- **Landed.** Key files/behavior (terse).
- **Verified.** build / lint / test result.
- **Owed / next.** What the next session should pick up.

## Definition Of Done

A change is done only when:

- target behavior is implemented
- `bun run build` and `bun run lint` pass
- a relevant integration test was run (for behavior changes)
- evidence is recorded in this file
- the repo remains restartable from `bun install && bun run dev`
