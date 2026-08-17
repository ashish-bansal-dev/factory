# FactoryTribe Architecture & Product Vision

## Executive Summary & Phased Strategy

**FactoryTribe (`factorytribe.com`)** is a hybrid marketplace and brand storefront platform designed for wholesale commerce, starting with a streamlined **Phase 1 Inquiry-Driven Model** and expanding step-by-step into automated e-commerce.

```
                                  ┌──────────────────────────────────────────────┐
                                  │           FactoryTribe Admin Panel           │
                                  │  (Deal Mediation, Prospect Tracking, Leads)  │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                    ┌────────────────────┴────────────────────┐
                                    ▼                                         ▼
                        ┌───────────────────────┐                 ┌───────────────────────┐
                        │   Seller 1 (Vendor)   │                 │   Seller 2 (Vendor)   │
                        │ Internal Type: MFR    │                 │ Internal Type: DIST   │
                        └───────────┬───────────┘                 └───────────┬───────────┘
                                    │                                         │
                                    └────────────────────┬────────────────────┘
                                                         │
                                               Inquiry & Deal Flow
                                                         │
           ┌─────────────────────────────────────────────┼─────────────────────────────────────────────┐
           ▼                                             ▼                                             ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│  🌐 sellerdomain.com (Seller Store)  │  │  🌐 branddomain.com (Brand Store)    │  │  🌐 factorytribe.com (Central Hub)  │
│ • Direct Sales / Direct Inquiry      │  │ • Direct Sales / Direct Inquiry      │  │ • Mediated Deals & Inquiries         │
│ • Copy of Inquiry sent to Admin      │  │ • Copy of Inquiry sent to Admin      │  │ • Buyer Sees Products & Brands       │
│ • Domain Rental Monetization         │  │ • Domain Rental Monetization         │  │ • Seller Type Hidden (Internal Only) │
│ • Engagement: Views, Likes, Dislikes │  │ • Engagement: Views, Likes, Dislikes │  │ • Engagement: Views, Likes, Dislikes │
└──────────────────────────────────────┘  └──────────────────────────────────────┘  └──────────────────────────────────────┘
```

---

## 1. Phase 1 Execution Focus (Simplicity First)

### A. Central Marketplace Hub (`factorytribe.com`)
* **Inquiry & Deal Mediation**: All deal inquiries submitted on `factorytribe.com` route directly to the **Marketplace Admin Panel**. The operator mediates negotiations and coordinates sampling between buyers and sellers.
* **Internal Seller Taxonomy (Hidden from Public)**:
  * Sellers have an internal classification field `seller_type`: `MANUFACTURER`, `DISTRIBUTOR`, or `WHOLESALER`.
  * **Public Buyers do NOT see seller type** on `factorytribe.com`. It is used strictly by the admin for internal tracking, prospect routing, and analytics.

### B. Seller-Branded Domains (`sellerdomain.com`)
* **Direct Dealing & Dual Inquiry Tracking**:
  * On a seller's dedicated domain, buyers can inquire or purchase directly.
  * When a buyer submits an inquiry on `sellerdomain.com`, the inquiry is delivered to the **Seller** AND a duplicate copy is automatically captured in the **FactoryTribe Admin Panel** for prospect tracking and lead intelligence.
* **Domain Rental Monetization**: The marketplace operator charges a fixed monthly/annual domain rental fee (or offers it free as an onboarding incentive).

### C. Storefront Product Engagement Analytics
To capture valuable buyer demand signals, storefronts track product engagement:
* **Product Views (`view_count`)**: Automatically incremented when a buyer opens a product detail page.
* **Product Likes & Dislikes (`like_count`, `dislike_count`)**: Buyers can like or dislike products.
* **Analytics Utilization**: Admins and sellers use view/like ratios to identify trending items, gauge market demand, and prioritize deal follow-ups.

---

## 2. Technical Data Architecture (`packages/core`)

### A. Internal Seller Type Field
```ts
// Internal classification only - not exposed on public storefront API
export enum SellerType {
  MANUFACTURER = "manufacturer",
  DISTRIBUTOR = "distributor",
  WHOLESALER = "wholesaler",
}
```
Field `type: model.enum(SellerType).nullable()` added to `Seller` model in `packages/core/src/modules/seller/models/seller.ts`.

### B. Lead & Prospect Inquiry Engine (`packages/core/src/modules/inquiry`)
```ts
export const Inquiry = model.define("inquiry", {
  id: model.id({ prefix: "inq" }).primaryKey(),
  source_domain: model.text(), // "factorytribe.com" or "sellerdomain.com"
  seller_id: model.text(),
  buyer_name: model.text(),
  buyer_email: model.text(),
  buyer_phone: model.text().nullable(),
  message: model.text(),
  product_id: model.text().nullable(),
  status: model.enum(["new", "in_progress", "mediated", "closed"]).default("new"),
  is_operator_copy: model.boolean().default(true),
})
```

### C. Product Engagement Model Extension
Add engagement counters to Product / Offer models or dedicated `ProductEngagement` table:
* `views_count`: `number` (default: 0)
* `likes_count`: `number` (default: 0)
* `dislikes_count`: `number` (default: 0)

**Store API Endpoints**:
* `POST /store/products/:id/view` $\rightarrow$ Increments `views_count`.
* `POST /store/products/:id/react` $\rightarrow$ Accepts `{ reaction: "like" | "dislike" }` to update counts.

### D. Multi-Brand Engine (`packages/core/src/modules/brand`)
* **Brand Model**: `Brand` (`id`, `name`, `handle`, `description`, `logo`, `banner`, `website_url`, `status`, `metadata`).
* **Approval Lifecycle**: `pending_approval`, `approved`, `rejected`.
* **Medusa v2 Links**:
  * `brand-seller-link`: Cross-module link between `BrandModule` and `SellerModule`.
  * `brand-product-link`: Cross-module link between `BrandModule` and `ProductModule`.
* **Admin Flow**: Admins can directly create brands and assign them to 1 or more sellers (auto-`approved`), and approve/reject vendor requests.
* **Vendor Flow**: Vendors can submit brand creation requests (starts in `pending_approval`) and select approved assigned brands when creating products.

---

## 3. Step-by-Step Evolution Roadmap

| Step | Scope | Key Capabilities | Status |
| :--- | :--- | :--- | :--- |
| **Step 1 (MVP)** | Inquiry & Engagement Focus | `factorytribe.com` inquiry routing, seller domain copy tracking, internal `type` field on Seller, Product views/likes analytics. | In Progress |
| **Step 2** | Multi-Brand Support | Single seller managing multiple brands, Admin assignment & approval workflow (`brand-seller-link`, `brand-product-link`). | Completed |
| **Step 3** | Wholesale Pack Engine | `bundle_size` storefront quantity increments, pack pricing formulas. | Planned |
| **Step 4** | Gated B2B Access | Guest price hiding, Customer Group dynamic discount rules. | Planned |
| **Step 5** | Direct E-Commerce Checkout | Full self-serve cart & checkout on seller domains and main marketplace. | Planned |

---

## 4. Architectural Rules & Guardrails

> [!IMPORTANT]
> **Keep Seller `type` strictly internal during Step 1.**  
> Do not expose `type` on public API responses or storefront UI. Keep storefront browsing clean, simple, and brand-focused.

> [!TIP]
> **Ensure dual inquiry delivery for seller domains.**  
> Inquiries on seller domains must simultaneously notify the seller and record an operator copy in the Admin panel.
