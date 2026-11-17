import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import WholesalePriceDisplay from "@modules/common/components/wholesale/wholesale-price-display"
import BundlePackBadge from "@modules/common/components/wholesale/bundle-pack-badge"
import AddToQuoteButton from "../add-to-quote-button"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const metadata = product.metadata || {}
  const bundleSize = typeof metadata.bundle_size === "number" ? metadata.bundle_size : Number(metadata.bundle_size) || 1
  const msrp = typeof metadata.mrp === "number" ? metadata.mrp : typeof metadata.msrp === "number" ? metadata.msrp : null
  const seller = (product as any).seller
  const brand = (product as any).brand

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block rounded-2xl bg-white border border-stone-200/90 overflow-hidden hover:border-charcoal-900/40 hover:shadow-md transition duration-200"
    >
      <div data-testid="product-wrapper" className="flex flex-col h-full">
        {/* Image Container with Badge Overlay */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand-50">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
          {bundleSize > 1 && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur text-charcoal-900 shadow-sm border border-stone-200">
                Pack of {bundleSize}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2.5 font-sans">
          <div>
            {/* Brand / Maker line */}
            {(brand?.name || seller?.name) && (
              <span className="text-xs font-bold text-stone-600 uppercase tracking-wide block mb-1">
                {brand?.name || seller?.name}
              </span>
            )}

            {/* Product Title - Enhanced for Mobile Readability */}
            <h3
              className="text-sm sm:text-base font-semibold text-charcoal-900 group-hover:text-terracotta-600 transition leading-snug line-clamp-2 min-h-[2.5rem]"
              data-testid="product-title"
            >
              {product.title}
            </h3>
          </div>

          {/* Pricing & Margin - No MSRP displayed per user instruction */}
          <div className="pt-2 border-t border-stone-100">
            {cheapestPrice ? (
              <WholesalePriceDisplay
                calculatedPrice={cheapestPrice.calculated_price}
                originalPrice={cheapestPrice.original_price}
                msrp={null}
                bundleSize={bundleSize}
                isGated={false}
              />
            ) : (
              <span className="text-xs font-medium text-stone-400">Pricing upon request</span>
            )}
          </div>

          {/* Action Row: Direct Multi-Product Selection for Quote Cart (Default Qty: 1) */}
          <div className="pt-1">
            <AddToQuoteButton product={product} />
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
