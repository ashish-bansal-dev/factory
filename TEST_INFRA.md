# E2E Test Infra: Dual-Channel Marketplace & Vendor Subdomain SaaS

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `/home/dev/mercur-new/.agents/ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory & Test Mapping
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|----------------------|:------:|:------:|:------:|
| 1 | Dual Offer Creation (Retail single-unit vs Wholesale pack size) on same variant | ORIGINAL_REQUEST §Acceptance Criteria | 5 | 5 | ✓ |
| 2 | Retailer Wholesale Offer Rejection | ORIGINAL_REQUEST §Acceptance Criteria | 5 | 5 | ✓ |
| 3 | Product Listing Channel Scoping (x-channel retail vs wholesale) | ORIGINAL_REQUEST §Acceptance Criteria | 5 | 5 | ✓ |
| 4 | Wholesale Cart Line Item Pack Divisibility Enforcement | ORIGINAL_REQUEST §Acceptance Criteria | 5 | 5 | ✓ |
| 5 | Domain Resolution (subdomain, custom domain, wholesale subdomain) | ORIGINAL_REQUEST §Acceptance Criteria | 5 | 5 | ✓ |
| 6 | Domain Settings Backfill Migration | ORIGINAL_REQUEST §Acceptance Criteria | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Jest via `medusaIntegrationTestRunner` from `@medusajs/test-utils`
- Command: `bun run test:integration:http -- dual-channel`
- Directory layout: `integration-tests/http/offer/dual-channel/`

## Coverage Thresholds
- Tier 1: Feature Coverage (happy path, isolation)
- Tier 2: Boundary & Corner Cases (bundle_size = 1, bundle_size = 6, non-divisible cart quantities, missing headers, uppercase hostnames)
- Tier 3: Cross-Feature Combinations (manufacturer creates retail + wholesale, resolves domains, scopes products, adds both to cart)
- Tier 4: Real-World Workload Testing (end-to-end B2B and B2C buyer journeys)
