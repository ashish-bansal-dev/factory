# Wholesale Storefront Architecture & Flow Rules

## 1. Catalog Gating & Buyer Verification
1. Unregistered visitors can browse product photos, fabric descriptions, brand profiles, and estimated retail MSRP.
2. Wholesale price per piece, bundle pack price, and "Add to Cart" functionality are protected.
3. Call-to-action redirects to `/account/register` with business account application fields (Company Name, Resale Tax ID, Store Website/Instagram).

## 2. Merchandising & Bundle Pack Formulas
1. Products define `metadata.bundle_size` (integer $\ge 1$, e.g., 6, 12). If absent, defaults to 1.
2. Products define `metadata.mrp` or `metadata.msrp` (in cents or base currency).
3. The formula for buyer economics:
   $$\text{Pack Price} = \text{Unit Listed Price} \times \text{bundle\_size}$$
   $$\text{Pack MSRP} = \text{MSRP} \times \text{bundle\_size}$$
   $$\text{Estimated Profit / Pack} = \text{Pack MSRP} - \text{Pack Price}$$
   $$\text{Margin \%} = \frac{\text{MSRP} - \text{Unit Listed Price}}{\text{MSRP}} \times 100$$
4. In cart and line items, quantity must strictly satisfy:
   $$\text{quantity} \pmod{\text{bundle\_size}} = 0$$

## 3. Multi-Vendor Wholesale Cart & MOV
1. In a multi-vendor wholesale order, line items in the cart are grouped by `seller_id` (or `brand_id`).
2. Each vendor group renders:
   - Vendor header & shipping location.
   - Live MOV progress bar.
   - Subtotal for that specific vendor.
3. If any vendor in the cart has not met their MOV threshold, checkout displays a clear banner identifying which vendor needs additional items, preventing accidental under-MOQ order placement.

## 4. Dual Inquiry & Sample Request Flow
1. Buyers can click **"Request Sample"** or **"Contact Brand / Request Quote"**.
2. Submissions POST to `/store/inquiries`.
3. Inquiries are stored authoritatively in Medusa, tagged with:
   - `seller_id`
   - `product_id` / `variant_id`
   - `company_name`, `email`, `phone`, `inquiry_type: "sample" | "quote" | "custom_order"`
   - Dual routing: delivered to the seller's vendor panel and mirrored to FactoryTribe super admin.
