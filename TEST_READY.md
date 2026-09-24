# E2E Test Suite Ready

## Test Runner
- Command: `bun run test:integration:http -- dual-channel`
- Expected: all tests pass with exit code 0

## Coverage Summary
| Tier | Count | Description |
|------|------:|-------------|
| 1. Feature Coverage | 24 | Isolation and happy-path checks for dual offers, retailer validation, channel pricing, cart pack divisibility, and domain resolution |
| 2. Boundary & Corner | 18 | Non-divisible cart quantities, case-insensitive channel headers, port/protocol stripping, idempotency, uppercase hostnames |
| 3. Cross-Feature | 6 | Multi-tenant sellers creating dual offers, scoping products, and validating carts across channels |
| 4. Real-World Application | 5 | End-to-end B2B and B2C buyer journeys |
| **Total** | **53** | Complete coverage across R1 & R2 acceptance criteria |

## Feature Checklist
| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|:------:|:------:|:------:|:------:|
| Dual Offer Creation (same SKU & variant) | 5 | 5 | ✓ | ✓ |
| Retailer Wholesale Offer Rejection | 5 | 5 | ✓ | ✓ |
| Channel Scoping & Pack Pricing (`GET /store/products`) | 5 | 5 | ✓ | ✓ |
| Wholesale Cart Divisibility Validation | 5 | 5 | ✓ | ✓ |
| Domain Resolution (`GET /store/domains/resolve`) | 5 | 5 | ✓ | ✓ |
| Domain Settings Backfill Migration | 5 | 5 | ✓ | ✓ |

## Test Files
1. `integration-tests/http/offer/dual-channel/dual-channel-offers.spec.ts`
2. `integration-tests/http/offer/dual-channel/channel-scoping-pricing.spec.ts`
3. `integration-tests/http/offer/dual-channel/wholesale-cart-validation.spec.ts`
4. `integration-tests/http/offer/dual-channel/domain-resolution.spec.ts`
5. `integration-tests/http/offer/dual-channel/domain-migration.spec.ts`
