import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
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
      <div className="flex flex-col text-ui-fg-muted">
        <span className="text-base font-medium" data-testid="product-price">
          Price unavailable
        </span>
      </div>
    )
  }

  const bundleSize = (selectedPrice as any).bundle_size ?? 1
  const mrp = (selectedPrice as any).mrp as string | null
  const mrpNumber = (selectedPrice as any).mrp_number as number | null
  const unitPriceNumber = selectedPrice.calculated_price_number
  const packPrice = (selectedPrice as any).pack_price as string | null

  const hasMrpSavings =
    mrpNumber != null && unitPriceNumber != null && mrpNumber > unitPriceNumber
  const marginPercent =
    hasMrpSavings && mrpNumber > 0
      ? Math.round(((mrpNumber - unitPriceNumber) / mrpNumber) * 100)
      : 0

  return (
    <div className="flex flex-col text-ui-fg-base gap-y-1">
      <div className="flex items-baseline gap-x-2">
        <span
          className={clx("text-2xl font-bold", {
            "text-ui-fg-interactive": selectedPrice.price_type === "sale",
          })}
        >
          {!variant && "From "}
          <span
            data-testid="product-price"
            data-value={selectedPrice.calculated_price_number}
          >
            {selectedPrice.calculated_price}
          </span>
          <span className="text-xs font-normal text-ui-fg-muted ml-1">/ unit</span>
        </span>
        {bundleSize > 1 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
            Pack of {bundleSize}
          </span>
        )}
      </div>

      {bundleSize > 1 && packPrice && (
        <div className="text-sm font-medium text-ui-fg-subtle">
          Pack Price ({bundleSize} units): <span className="font-semibold text-ui-fg-base">{packPrice}</span>
        </div>
      )}

      {mrp && (
        <div className="flex items-center gap-x-2 text-xs">
          <span className="text-ui-fg-muted">MRP:</span>
          <span className="line-through text-ui-fg-muted font-medium">{mrp}</span>
          {marginPercent > 0 && (
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {marginPercent}% Margin
            </span>
          )}
        </div>
      )}

      {selectedPrice.price_type === "sale" && (
        <div className="flex items-center gap-x-2 text-xs">
          <span className="text-ui-fg-subtle">Original: </span>
          <span
            className="line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
          <span className="text-ui-fg-interactive font-medium">
            -{selectedPrice.percentage_diff}%
          </span>
        </div>
      )}

      {!isTenant && (
        <span className="text-xs text-ui-fg-muted font-normal mt-0.5">
          Indicative Wholesale (Contact for volume tiering)
        </span>
      )}
    </div>
  )
}

