import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import {
  calculateBundleSize,
  calculatePackMsrp,
  calculateRetailMargin,
  formatPackBreakdown,
  getPackDescription,
  getUnitMrp,
  isWholesaleVariant,
  parsePackBreakdown,
} from "@lib/util/pack"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
  isTenant = false,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  isTenant?: boolean
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return (
      <div className="flex flex-col text-ui-fg-muted font-sans">
        <span className="text-base font-medium" data-testid="product-price">
          Price unavailable
        </span>
      </div>
    )
  }

  const wholesaleVariants = (product.variants || []).filter(isWholesaleVariant)
  const targetVariant =
    variant ||
    (wholesaleVariants.length > 0
      ? wholesaleVariants[0]
      : product.variants && product.variants[0])

  const breakdown = parsePackBreakdown(
    (targetVariant as any)?.metadata?.pack_breakdown ||
      (targetVariant as any)?.pack_breakdown
  )
  const packDescription = getPackDescription(targetVariant)
  const formattedBreakdown = formatPackBreakdown(breakdown)
  const bundleSize = calculateBundleSize(targetVariant, breakdown)

  const currency = selectedPrice.currency_code || "INR"
  const unitPriceNumber = selectedPrice.calculated_price_number || 0
  const packPriceNumber =
    (selectedPrice as any).pack_price_number ?? unitPriceNumber * bundleSize

  const unitMsrpNumber = getUnitMrp(targetVariant)
  const packMsrpNumber = calculatePackMsrp(targetVariant, bundleSize)
  const marginPercent = calculateRetailMargin(packMsrpNumber, packPriceNumber)

  return (
    <div className="flex flex-col text-charcoal-900 gap-y-1.5 font-sans">
      <div className="flex items-baseline gap-x-2 flex-wrap">
        <span
          className={clx("text-2xl sm:text-3xl font-bold tracking-tight", {
            "text-terracotta-600": selectedPrice.price_type === "sale",
          })}
        >
          {!variant && "From "}
          <span
            data-testid="product-price"
            data-value={selectedPrice.calculated_price_number}
          >
            {selectedPrice.calculated_price}
          </span>
          <span className="text-xs font-normal text-stone-500 ml-1">/ unit</span>
        </span>

        {bundleSize > 1 && (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sand-200/80 text-charcoal-900 border border-sand-300">
            Pack of {bundleSize} pcs
          </span>
        )}

        {marginPercent > 0 && (
          <span className="text-xs font-bold text-forest-700 bg-forest-50 border border-forest-700/20 px-2 py-0.5 rounded-full">
            {marginPercent}% Retail Margin
          </span>
        )}
      </div>

      {/* Pack Breakdown & Specifications */}
      {(packDescription || formattedBreakdown) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {packDescription && (
            <span className="font-semibold text-charcoal-900">{packDescription}</span>
          )}
          {formattedBreakdown && (
            <span className="inline-flex items-center text-[11px] font-semibold text-terracotta-800 bg-terracotta-50/80 border border-terracotta-200 px-2 py-0.5 rounded-full">
              {formattedBreakdown}
            </span>
          )}
        </div>
      )}

      {/* Pack Price vs Pack MSRP */}
      {bundleSize > 1 && (
        <div className="text-xs font-medium text-stone-600 flex items-center gap-2 flex-wrap">
          <span>
            Pack Price:{" "}
            <strong className="font-bold text-charcoal-900">
              {convertToLocale({
                amount: packPriceNumber,
                currency_code: currency,
              })}
            </strong>
          </span>

          {packMsrpNumber && (
            <>
              <span className="text-stone-300">•</span>
              <span>
                Pack MSRP:{" "}
                <span className="line-through text-stone-500">
                  {convertToLocale({
                    amount: packMsrpNumber,
                    currency_code: currency,
                  })}
                </span>
              </span>
            </>
          )}
        </div>
      )}

      {!isTenant && (
        <span className="text-[11px] text-stone-500 font-normal mt-0.5">
          Wholesale Trade Pricing • Volume breaks available in grid below
        </span>
      )}
    </div>
  )
}
