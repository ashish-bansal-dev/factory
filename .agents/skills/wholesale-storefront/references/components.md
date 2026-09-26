# Wholesale Storefront Component Inventory (Faire Reference)

## 1. Wholesale Primitives

### 1.1 `WholesalePriceDisplay`
Displays both wholesale price and retail MSRP with dynamic profit margin:
```tsx
<WholesalePriceDisplay
  wholesalePrice={1400} // in cents ($14.00)
  msrp={3800}           // in cents ($38.00)
  currencyCode="USD"
  isGated={!isLoggedIn}
/>
```
- When gated: Renders MSRP + a discrete button or link: `Unlock Wholesale Pricing`.
- When authenticated: Renders wholesale price prominently, followed by `MSRP $38.00` and green/olive pill `63% margin`.

### 1.2 `VendorMOVProgressBar`
Renders progress toward a vendor's Minimum Order Value (MOV):
```tsx
<VendorMOVProgressBar
  vendorName="Lumina Apparel"
  currentAmount={18000} // $180
  minimumOrderValue={25000} // $250
  currencyCode="USD"
/>
```
- Shows a thin progress bar with remaining amount required: *"Add $70.00 more to meet Lumina Apparel's minimum order requirement"*.
- Turns solid forest green with a checkmark when MOV is met: *"Minimum order reached ($250.00)"*.

### 1.3 `BulkVariantMatrix`
Table for rapid B2B purchasing across all size and color combinations on PDP:
- Column 1: Color / Variant Image swatch
- Column 2: Size (e.g. XS, S, M, L, XL)
- Column 3: SKU & In-Stock Status (e.g. *In Stock (48 packs available)*)
- Column 4: Pack Size (e.g. *6 pcs / pack*)
- Column 5: Pack Price (e.g. *$84.00 / pack ($14.00/pc)*)
- Column 6: Quantity Stepper (Increments by 1 pack = 6 pcs)
- Column 7: Line Subtotal
- Sticky Summary Bar: Total Units, Total Packs, Order Subtotal, and "Add Selection to Cart".

### 1.4 `BrandCard` & `BrandSpotlight`
Faire-style brand representation:
- Brand avatar + Cover image.
- Location badge (e.g., *Los Angeles, CA* or *Porto, Portugal*).
- Minimum order value (e.g. *Min. order $150*).
- Lead time (e.g. *Ships in 2-3 business days*).
- Brand values tags (e.g. *Organic*, *Handmade*, *Eco-Friendly*).

### 1.5 `SampleRequestButton`
Secondary action on product cards and PDP allowing vetted buyers to order a single unit sample or fabric swatch before committing to wholesale packs.
