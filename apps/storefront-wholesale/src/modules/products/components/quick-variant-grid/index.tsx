"use client"

import { addToCart, addMultipleToCart } from "@lib/data/cart"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Badge, Button, clx } from "@medusajs/ui"
import React, { useMemo, useState } from "react"
import { useCuratedQuote } from "@lib/context/curated-quote-context"

interface QuickVariantGridProps {
  product: HttpTypes.StoreProduct
  countryCode: string
  disabled?: boolean
  onOpenInquiry?: () => void
}

export default function QuickVariantGrid({
  product,
  countryCode,
  disabled = false,
  onOpenInquiry,
}: QuickVariantGridProps) {
  // 1. Sort default: by variant_rank ascending, preserving natural variant sequence
  const sortedVariants = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return []
    return [...product.variants].sort((a, b) => {
      const rankA = (a as { variant_rank?: number }).variant_rank ?? 0
      const rankB = (b as { variant_rank?: number }).variant_rank ?? 0
      if (rankA !== rankB) return rankA - rankB
      return 0
    })
  }, [product.variants])

  // Quantities map keyed by variant ID
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null)
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleQuantityInputChange = (
    variantId: string,
    rawVal: string,
    stepSize: number
  ) => {
    if (rawVal === "") {
      setQuantities((prev) => ({ ...prev, [variantId]: 0 }))
      return
    }
    const parsed = parseInt(rawVal, 10)
    if (isNaN(parsed) || parsed < 0) {
      setQuantities((prev) => ({ ...prev, [variantId]: 0 }))
      return
    }
    setQuantities((prev) => ({ ...prev, [variantId]: parsed }))
  }

  const handleBlur = (variantId: string, stepSize: number) => {
    const current = quantities[variantId] || 0
    if (current > 0 && current % stepSize !== 0) {
      const snapped = Math.ceil(current / stepSize) * stepSize
      setQuantities((prev) => ({ ...prev, [variantId]: snapped }))
    }
  }

  const handleStep = (variantId: string, delta: number, stepSize: number) => {
    const current = quantities[variantId] || 0
    let next: number
    if (delta > 0) {
      if (current === 0) {
        next = stepSize
      } else {
        next = current + stepSize
      }
    } else {
      next = Math.max(0, current - stepSize)
    }
    setQuantities((prev) => ({
      ...prev,
      [variantId]: next,
    }))
  }

  const { addItem: addCuratedQuoteItem } = useCuratedQuote()

  // Row-level instant add
  const handleAddSingle = async (
    variant: HttpTypes.StoreProductVariant,
    stepSize: number
  ) => {
    const currentQty = quantities[variant.id] || 0
    const qty = currentQty > 0 ? currentQty : stepSize
    const offerId = (variant as { offer_id?: string | null }).offer_id ?? undefined
    const hasOffer = Boolean(offerId)

    setAddingVariantId(variant.id)
    setFeedback(null)

    if (!hasOffer) {
      addCuratedQuoteItem({
        productId: product.id,
        productTitle: product.title,
        productHandle: product.handle,
        thumbnail: product.thumbnail,
        variantId: variant.id,
        variantTitle: variant.title || "Default Variant",
        sku: variant.sku || null,
        quantity: qty,
      })
      if (currentQty === 0) {
        setQuantities((prev) => ({ ...prev, [variant.id]: stepSize }))
      }
      setFeedback({
        message: `Added ${qty} units of "${variant.title || "variant"}" to Curated Quote Basket 📋`,
        type: "success",
      })
      setTimeout(() => setFeedback(null), 3500)
      setAddingVariantId(null)
      return
    }

    try {
      await addToCart({
        variantId: variant.id,
        offerId,
        quantity: qty,
        countryCode,
      })
      if (currentQty === 0) {
        setQuantities((prev) => ({ ...prev, [variant.id]: stepSize }))
      }
      const packCount = Math.round(qty / stepSize)
      setFeedback({
        message: `Added ${qty} units (${packCount} pack${packCount > 1 ? "s" : ""}) of ${variant.title || "variant"} to cart`,
        type: "success",
      })
      setTimeout(() => setFeedback(null), 3500)
    } catch (err: any) {
      setFeedback({
        message: err?.message || "Failed to add to cart",
        type: "error",
      })
    } finally {
      setAddingVariantId(null)
    }
  }

  // Bulk add all variants with qty > 0
  const handleAddAll = async () => {
    const selected = sortedVariants.filter((v) => (quantities[v.id] || 0) > 0)
    if (selected.length === 0) return

    const withOffer = selected.filter((v) =>
      Boolean((v as { offer_id?: string | null }).offer_id)
    )
    const withoutOffer = selected.filter(
      (v) => !Boolean((v as { offer_id?: string | null }).offer_id)
    )

    setIsAddingAll(true)
    setFeedback(null)

    try {
      if (withOffer.length > 0) {
        await addMultipleToCart(
          withOffer.map((v) => ({
            variantId: v.id,
            offerId: (v as { offer_id?: string | null }).offer_id ?? undefined,
            quantity: quantities[v.id],
          })),
          countryCode
        )
      }

      if (withoutOffer.length > 0) {
        withoutOffer.forEach((v) => {
          addCuratedQuoteItem({
            productId: product.id,
            productTitle: product.title,
            productHandle: product.handle,
            thumbnail: product.thumbnail,
            variantId: v.id,
            variantTitle: v.title || "Default Variant",
            sku: v.sku || null,
            quantity: quantities[v.id],
          })
        })
      }

      const totalUnits = selected.reduce((sum, v) => sum + quantities[v.id], 0)
      const message =
        withoutOffer.length > 0 && withOffer.length > 0
          ? `Added ${withOffer.length} variant(s) to Cart and ${withoutOffer.length} to Curated Quote Basket 📋`
          : withoutOffer.length > 0
          ? `Added ${totalUnits} units across ${withoutOffer.length} variant(s) to Curated Quote Basket 📋`
          : `Added ${totalUnits} units across ${withOffer.length} variant(s) to Cart`

      setFeedback({
        message,
        type: "success",
      })
      setQuantities({})
      setTimeout(() => setFeedback(null), 4000)
    } catch (err: any) {
      setFeedback({
        message: err?.message || "Failed to add items",
        type: "error",
      })
    } finally {
      setIsAddingAll(false)
    }
  }

  // Calculate totals
  const totalUnits = useMemo(() => {
    return Object.values(quantities).reduce((acc, q) => acc + (q || 0), 0)
  }, [quantities])

  const totalPacks = useMemo(() => {
    let packs = 0
    for (const v of sortedVariants) {
      const q = quantities[v.id] || 0
      if (q > 0) {
        const bSize =
          Number((v as any)?.bundle_size) ||
          Number((v as any)?.calculated_price?.bundle_size) ||
          1
        packs += Math.round(q / bSize)
      }
    }
    return packs
  }, [sortedVariants, quantities])

  const totalEstimatedAmount = useMemo(() => {
    let sum = 0
    let currency = "USD"
    for (const v of sortedVariants) {
      const q = quantities[v.id] || 0
      if (q > 0) {
        const prices = getPricesForVariant(v)
        if (prices) {
          sum += (prices.calculated_price_number || 0) * q
          currency = prices.currency_code
        }
      }
    }
    return { sum, currency }
  }, [sortedVariants, quantities])

  // Check if any variant has an active offer
  const anyVariantHasOffer = useMemo(() => {
    return sortedVariants.some((v) =>
      Boolean((v as { offer_id?: string | null })?.offer_id)
    )
  }, [sortedVariants])

  if (sortedVariants.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3 border border-ui-border-base rounded-xl p-3 sm:p-5 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ui-border-base gap-2">
        <div>
          <span className="font-bold text-base text-ui-fg-base">
            Wholesale Variant Order Grid
          </span>
          <p className="text-xs text-ui-fg-muted mt-0.5">
            Step quantities in pack sizes. Add individual variants or order multiple at once.
          </p>
        </div>
        <Badge color="blue" size="small" className="self-start sm:self-auto">
          {sortedVariants.length} {sortedVariants.length === 1 ? "Variant" : "Variants"}
        </Badge>
      </div>

      {!anyVariantHasOffer && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
          <div className="font-semibold flex items-center gap-1.5 text-amber-800 mb-0.5">
            <span>No Active Supplier Offers</span>
          </div>
          <p className="text-[11px] text-amber-700">
            Currently no seller offers are listed for these variants. You can inquire directly with suppliers on WhatsApp below for custom pricing and availability.
          </p>
        </div>
      )}

      {feedback && (
        <div
          className={clx(
            "text-xs p-3 rounded-lg border font-medium",
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Variant Grid Table */}
      <div className="overflow-x-auto -mx-1 sm:mx-0 border border-ui-border-base rounded-lg">
        <table className="w-full text-left text-xs divide-y divide-ui-border-base">
          <thead className="bg-ui-bg-subtle text-ui-fg-muted uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th scope="col" className="py-2.5 px-3">
                Variant & ID
              </th>
              <th scope="col" className="py-2.5 px-3">
                MRP
              </th>
              <th scope="col" className="py-2.5 px-3">
                Wholesale Price
              </th>
              <th scope="col" className="py-2.5 px-3 text-center min-w-[130px]">
                Qty (+/-)
              </th>
              <th scope="col" className="py-2.5 px-3 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border-subtle bg-white">
            {sortedVariants.map((variant) => {
              const prices = getPricesForVariant(variant)
              const inStock =
                variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0
              const qty = quantities[variant.id] ?? 0
              const isRowAdding = addingVariantId === variant.id
              const bundleSize =
                Number((variant as any)?.bundle_size) ||
                Number((variant as any)?.calculated_price?.bundle_size) ||
                prices?.bundle_size ||
                1

              const mrpNum = prices?.mrp_number ?? null
              const unitPriceNum = prices?.calculated_price_number ?? null
              const savingsPercent =
                mrpNum && unitPriceNum && mrpNum > unitPriceNum
                  ? Math.round(((mrpNum - unitPriceNum) / mrpNum) * 100)
                  : 0

              const hasOffer = Boolean(
                (variant as { offer_id?: string | null })?.offer_id
              )

              return (
                <tr
                  key={variant.id}
                  className={clx(
                    "hover:bg-ui-bg-subtle/50 transition-colors",
                    qty > 0 && "bg-emerald-50/20"
                  )}
                >
                  {/* Variant & ID */}
                  <td className="py-3 px-3 align-middle">
                    <div className="font-semibold text-ui-fg-base text-sm leading-snug">
                      {variant.title || "Default"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {variant.sku && (
                        <span
                          className="font-mono text-[10px] text-ui-fg-muted"
                          title="SKU"
                        >
                          SKU: {variant.sku}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        Pack of {bundleSize}
                      </span>
                      {!hasOffer ? (
                        <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          No active offer
                        </span>
                      ) : !inStock ? (
                        <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          Out of stock
                        </span>
                      ) : variant.allow_backorder ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Backorder
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                          In stock
                        </span>
                      )}
                    </div>
                  </td>

                  {/* MRP */}
                  <td className="py-3 px-3 align-middle whitespace-nowrap">
                    {prices?.mrp ? (
                      <div className="flex flex-col">
                        <span className="text-ui-fg-muted line-through font-medium text-xs">
                          {prices.mrp}
                        </span>
                        {savingsPercent > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">
                            {savingsPercent}% OFF
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-ui-fg-muted text-xs">—</span>
                    )}
                  </td>

                  {/* Wholesale Price */}
                  <td className="py-3 px-3 align-middle whitespace-nowrap">
                    {prices ? (
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-sm text-ui-fg-base">
                            {prices.calculated_price}
                          </span>
                          <span className="text-[10px] text-ui-fg-muted font-normal">
                            / unit
                          </span>
                        </div>
                        {bundleSize > 1 && (
                          <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                            {prices.pack_price}{" "}
                            <span className="text-ui-fg-muted font-normal">
                              / pack
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-ui-fg-muted text-xs">—</span>
                    )}
                  </td>

                  {/* Qty (+/-) */}
                  <td className="py-3 px-3 align-middle">
                    <div className="flex items-center justify-center border border-ui-border-base rounded-md bg-white shadow-sm overflow-hidden w-28 mx-auto">
                      <button
                        type="button"
                        onClick={() => handleStep(variant.id, -bundleSize, bundleSize)}
                        disabled={qty <= 0 || disabled || !inStock}
                        className="w-8 h-8 flex items-center justify-center text-ui-fg-base hover:bg-ui-bg-subtle active:bg-ui-bg-base disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold transition-colors select-none"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        step={bundleSize}
                        value={qty === 0 ? "" : qty}
                        placeholder="0"
                        onChange={(e) =>
                          handleQuantityInputChange(
                            variant.id,
                            e.target.value,
                            bundleSize
                          )
                        }
                        onBlur={() => handleBlur(variant.id, bundleSize)}
                        disabled={disabled || !inStock}
                        className="w-12 text-center text-xs py-1 font-bold text-ui-fg-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleStep(variant.id, bundleSize, bundleSize)}
                        disabled={disabled || !inStock}
                        className="w-8 h-8 flex items-center justify-center text-ui-fg-base hover:bg-ui-bg-subtle active:bg-ui-bg-base disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold transition-colors select-none"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-[10px] text-center text-ui-fg-muted mt-1 font-medium">
                      {qty > 0 ? (
                        <span className="text-purple-700 font-semibold">
                          {Math.round(qty / bundleSize)}{" "}
                          {Math.round(qty / bundleSize) === 1 ? "pack" : "packs"}
                        </span>
                      ) : (
                        <span>0 packs</span>
                      )}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-right align-middle whitespace-nowrap">
                    <Button
                      type="button"
                      size="small"
                      variant="secondary"
                      onClick={() => handleAddSingle(variant, bundleSize)}
                      disabled={disabled || !inStock || isRowAdding || isAddingAll}
                      isLoading={isRowAdding}
                      className={clx(
                        "text-xs h-8 px-3 font-semibold transition",
                        !hasOffer
                          ? "border-purple-300 text-purple-800 hover:bg-purple-100 bg-purple-50/50"
                          : "hover:bg-ui-bg-base hover:text-white"
                      )}
                    >
                      {!hasOffer ? "+ Quote 📋" : "+ Add"}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk Order & Cart Addition Bar */}
      <div className="pt-3 border-t border-ui-border-base flex flex-col sm:flex-row items-center justify-between gap-3 bg-ui-bg-subtle/60 p-3 rounded-lg">
        <div className="text-xs text-ui-fg-base flex items-center gap-3">
          <span>
            Selected: <strong className="font-bold text-sm text-ui-fg-base">{totalUnits}</strong> units ({totalPacks} {totalPacks === 1 ? "pack" : "packs"})
          </span>
          {totalUnits > 0 && totalEstimatedAmount.sum > 0 && (
            <span>
              Est:{" "}
              <strong className="font-bold text-sm text-emerald-800">
                {convertToLocale({
                  amount: totalEstimatedAmount.sum,
                  currency_code: totalEstimatedAmount.currency,
                })}
              </strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="primary"
            size="small"
            onClick={handleAddAll}
            disabled={totalUnits === 0 || disabled || isAddingAll}
            isLoading={isAddingAll}
            className="flex-1 sm:flex-none h-9 px-5 text-xs font-semibold"
          >
            {!anyVariantHasOffer
              ? `Add Selected to Quote Basket (${totalUnits}) 📋`
              : `Add Selected to Cart (${totalUnits})`}
          </Button>
          {onOpenInquiry && (
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={onOpenInquiry}
              className="h-9 px-3.5 text-xs font-medium border-emerald-500 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
            >
              WhatsApp Quote
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
