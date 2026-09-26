"use client"

import { addToCart, addMultipleToCart } from "@lib/data/cart"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
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
  const sortedVariants = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return []
    return [...product.variants].sort((a, b) => {
      const rankA = (a as { variant_rank?: number }).variant_rank ?? 0
      const rankB = (b as { variant_rank?: number }).variant_rank ?? 0
      if (rankA !== rankB) return rankA - rankB
      return 0
    })
  }, [product.variants])

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null)
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleQuantityInputChange = (
    variantId: string,
    rawVal: string,
    _stepSize: number
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
      setQuantities((prev) => ({ ...prev, [variant.id]: 0 }))
      setFeedback({
        message: `Added ${qty} units (${variant.title || "variant"}) to Curated Quote Basket`,
        type: "success",
      })
      setAddingVariantId(null)
      setTimeout(() => setFeedback(null), 3000)
      return
    }

    try {
      await addToCart({
        variantId: variant.id,
        quantity: qty,
        countryCode,
        offerId,
      })
      setQuantities((prev) => ({ ...prev, [variant.id]: 0 }))
      setFeedback({
        message: `Added ${qty} units (${variant.title || "variant"}) to wholesale cart`,
        type: "success",
      })
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: any) {
      setFeedback({
        message: err?.message || "Failed to add to cart",
        type: "error",
      })
    } finally {
      setAddingVariantId(null)
    }
  }

  const handleAddAll = async () => {
    const selected = sortedVariants.filter((v) => (quantities[v.id] || 0) > 0)
    if (selected.length === 0) return

    const withOffer = selected.filter((v) =>
      Boolean((v as { offer_id?: string | null }).offer_id)
    )
    const withoutOffer = selected.filter(
      (v) => !(v as { offer_id?: string | null }).offer_id
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
          ? `Added ${withOffer.length} variant(s) to Cart and ${withoutOffer.length} to Quote Basket`
          : withoutOffer.length > 0
          ? `Added ${totalUnits} pcs across ${withoutOffer.length} variant(s) to Quote Basket`
          : `Added ${totalUnits} pcs across ${withOffer.length} variant(s) to wholesale cart`

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
    let currency = "INR"
    for (const v of sortedVariants) {
      const q = quantities[v.id] || 0
      if (q > 0) {
        const prices = getPricesForVariant(v)
        if (prices) {
          sum += (prices.calculated_price_number || 0) * q
          currency = prices.currency_code || "INR"
        }
      }
    }
    return { sum, currency }
  }, [sortedVariants, quantities])

  const anyVariantHasOffer = useMemo(() => {
    return sortedVariants.some((v) =>
      Boolean((v as { offer_id?: string | null })?.offer_id)
    )
  }, [sortedVariants])

  if (sortedVariants.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-lg font-bold text-charcoal-900">
            Wholesale Packs & Size Curve
          </h2>
          <p className="text-xs text-stone-500">
            Select pack quantities for each size/color variant
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sand-100 text-charcoal-900 border border-stone-200">
          {sortedVariants.length} {sortedVariants.length === 1 ? "Option" : "Options"}
        </span>
      </div>

      {!anyVariantHasOffer && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900">
          <span className="font-semibold block mb-0.5">Custom Manufacturing / Sample Orders</span>
          <p className="text-[11px] text-amber-800">
            No live catalog inventory is listed for instant checkout. You can place a sample request or inquire directly for bulk production pricing.
          </p>
        </div>
      )}

      {feedback && (
        <div
          className={clx(
            "text-xs p-3 rounded-xl border font-medium transition",
            feedback.type === "success"
              ? "bg-forest-50 text-forest-700 border-forest-700/20"
              : "bg-rose-50 text-rose-700 border-rose-200"
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* MOBILE VIEW: Touch-friendly Card List (Traversal-friendly for phone screens) */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {sortedVariants.map((variant) => {
          const prices = getPricesForVariant(variant)
          const inStock = variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0
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

          const hasOffer = Boolean((variant as { offer_id?: string | null })?.offer_id)

          return (
            <div
              key={variant.id}
              className={clx(
                "p-3.5 rounded-xl border transition-all duration-150 bg-white",
                qty > 0
                  ? "border-terracotta-600 bg-terracotta-50/20 shadow-sm"
                  : "border-stone-200 hover:border-stone-300"
              )}
            >
              {/* Row 1: Title, SKU, In-Stock */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-charcoal-900 text-sm">
                    {variant.title || "Default"}
                  </h3>
                  {variant.sku && (
                    <span className="font-mono text-[10px] text-stone-500">
                      SKU: {variant.sku}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-charcoal-800 bg-sand-100 border border-stone-200 px-2 py-0.5 rounded-full">
                    {bundleSize} pcs/pack
                  </span>
                  {!inStock ? (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                      Out
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">
                      In Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Price & Margin */}
              <div className="flex items-baseline justify-between py-1.5 border-t border-stone-100 text-xs">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm text-charcoal-900">
                    {prices ? prices.calculated_price : "Quote"}
                  </span>
                  <span className="text-[11px] text-stone-500">/ pc</span>
                  {prices?.mrp && (
                    <span className="text-[11px] line-through text-stone-400">
                      MRP {prices.mrp}
                    </span>
                  )}
                </div>
                {savingsPercent > 0 && (
                  <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded-full border border-forest-700/20">
                    {savingsPercent}% margin
                  </span>
                )}
              </div>

              {/* Row 3: Touch Stepper & Add */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleStep(variant.id, -bundleSize, bundleSize)}
                    disabled={qty <= 0 || disabled || !inStock}
                    className="w-9 h-9 flex items-center justify-center text-charcoal-900 active:bg-sand-100 disabled:opacity-30 text-lg font-bold select-none"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <div className="w-14 text-center text-xs font-bold text-charcoal-900">
                    {qty === 0 ? "0" : `${qty / bundleSize} pk`}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStep(variant.id, bundleSize, bundleSize)}
                    disabled={disabled || !inStock}
                    className="w-9 h-9 flex items-center justify-center text-charcoal-900 active:bg-sand-100 disabled:opacity-30 text-lg font-bold select-none"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddSingle(variant, bundleSize)}
                  disabled={disabled || !inStock || isRowAdding || isAddingAll}
                  className="h-9 px-4 rounded-lg bg-charcoal-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-40 transition shadow-xs"
                >
                  {isRowAdding ? "..." : !hasOffer ? "+ Quote" : "+ Add Pack"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* DESKTOP VIEW: Structured Tabular Grid */}
      <div className="hidden sm:block overflow-x-auto border border-stone-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-xs divide-y divide-stone-200">
          <thead className="bg-sand-100/80 text-stone-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th scope="col" className="py-3 px-3.5">
                Variant & SKU
              </th>
              <th scope="col" className="py-3 px-3.5">
                Retail MRP
              </th>
              <th scope="col" className="py-3 px-3.5">
                Wholesale Price
              </th>
              <th scope="col" className="py-3 px-3.5 text-center min-w-[130px]">
                Pack Quantity
              </th>
              <th scope="col" className="py-3 px-3.5 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {sortedVariants.map((variant) => {
              const prices = getPricesForVariant(variant)
              const inStock = variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0
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

              const hasOffer = Boolean((variant as { offer_id?: string | null })?.offer_id)

              return (
                <tr
                  key={variant.id}
                  className={clx(
                    "hover:bg-sand-50/50 transition-colors",
                    qty > 0 && "bg-terracotta-50/30"
                  )}
                >
                  <td className="py-3.5 px-3.5 align-middle">
                    <div className="font-semibold text-charcoal-900 text-sm leading-snug">
                      {variant.title || "Default"}
                    </div>
                    {variant.sku && (
                      <span className="font-mono text-[10px] text-stone-500 block mt-0.5">
                        SKU: {variant.sku}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-charcoal-800 bg-sand-100 border border-stone-200 px-2 py-0.5 rounded-full">
                        Pack of {bundleSize} pcs
                      </span>
                      {!hasOffer ? (
                        <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                          Quote on request
                        </span>
                      ) : !inStock ? (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Out of stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-forest-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-forest-700 inline-block" />
                          In stock
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                    {prices?.mrp ? (
                      <div className="flex flex-col">
                        <span className="text-stone-500 line-through font-medium text-xs">
                          {prices.mrp}
                        </span>
                        {savingsPercent > 0 && (
                          <span className="text-[10px] font-bold text-forest-700 mt-0.5">
                            {savingsPercent}% margin
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-stone-400 text-xs">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                    {prices ? (
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-sm text-charcoal-900">
                            {prices.calculated_price}
                          </span>
                          <span className="text-[10px] text-stone-500 font-normal">
                            / pc
                          </span>
                        </div>
                        {bundleSize > 1 && (
                          <div className="text-[11px] text-stone-600 font-medium mt-0.5">
                            {prices.pack_price} <span className="text-stone-500 font-normal">/ pack</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-stone-400 text-xs">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3.5 align-middle">
                    <div className="flex items-center justify-center border border-stone-300 rounded-lg bg-white shadow-xs overflow-hidden w-28 mx-auto">
                      <button
                        type="button"
                        onClick={() => handleStep(variant.id, -bundleSize, bundleSize)}
                        disabled={qty <= 0 || disabled || !inStock}
                        className="w-8 h-8 flex items-center justify-center text-charcoal-900 hover:bg-sand-50 active:bg-sand-100 disabled:opacity-30 text-base font-bold select-none"
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
                          handleQuantityInputChange(variant.id, e.target.value, bundleSize)
                        }
                        onBlur={() => handleBlur(variant.id, bundleSize)}
                        disabled={disabled || !inStock}
                        className="w-12 text-center text-xs py-1 font-bold text-charcoal-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleStep(variant.id, bundleSize, bundleSize)}
                        disabled={disabled || !inStock}
                        className="w-8 h-8 flex items-center justify-center text-charcoal-900 hover:bg-sand-50 active:bg-sand-100 disabled:opacity-30 text-base font-bold select-none"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-[10px] text-center text-stone-500 mt-1 font-medium">
                      {qty > 0 ? (
                        <span className="text-terracotta-700 font-semibold">
                          {Math.round(qty / bundleSize)} {Math.round(qty / bundleSize) === 1 ? "pack" : "packs"}
                        </span>
                      ) : (
                        <span>0 packs</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-3.5 text-right align-middle whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleAddSingle(variant, bundleSize)}
                      disabled={disabled || !inStock || isRowAdding || isAddingAll}
                      className="h-8 px-3 rounded-full border border-stone-300 text-xs font-semibold text-charcoal-900 hover:bg-charcoal-900 hover:text-white transition shadow-xs"
                    >
                      {isRowAdding ? "..." : !hasOffer ? "+ Quote" : "+ Add"}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* DESKTOP Bottom Summary Bar */}
      <div className="hidden sm:flex border border-stone-200 items-center justify-between gap-3 bg-sand-50 p-4 rounded-xl">
        <div className="text-xs text-charcoal-900 flex items-center gap-3">
          <span>
            Selected: <strong className="font-bold text-sm text-charcoal-900">{totalUnits}</strong> pcs ({totalPacks} {totalPacks === 1 ? "pack" : "packs"})
          </span>
          {totalUnits > 0 && totalEstimatedAmount.sum > 0 && (
            <span>
              Order Subtotal:{" "}
              <strong className="font-serif font-bold text-base text-charcoal-900">
                {convertToLocale({
                  amount: totalEstimatedAmount.sum,
                  currency_code: totalEstimatedAmount.currency,
                })}
              </strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddAll}
            disabled={totalUnits === 0 || disabled || isAddingAll}
            className="h-10 px-6 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 disabled:opacity-40 text-xs font-semibold shadow-xs transition"
          >
            {isAddingAll ? "Adding..." : !anyVariantHasOffer
              ? `Request Quote (${totalUnits} pcs)`
              : `Add Selected to Cart (${totalUnits} pcs)`}
          </button>
          {onOpenInquiry && (
            <button
              type="button"
              onClick={onOpenInquiry}
              className="h-10 px-4 rounded-full border border-stone-300 bg-white text-xs font-semibold text-charcoal-900 hover:bg-sand-50 shadow-xs transition"
            >
              Direct Inquiry
            </button>
          )}
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR (Always available when scrolling on phone) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 sm:hidden shadow-lg flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-stone-500 font-medium">
            {totalUnits > 0 ? `${totalPacks} pk (${totalUnits} pcs)` : "Select packs"}
          </span>
          <span className="font-bold text-sm text-charcoal-900">
            {totalUnits > 0 && totalEstimatedAmount.sum > 0
              ? convertToLocale({
                  amount: totalEstimatedAmount.sum,
                  currency_code: totalEstimatedAmount.currency,
                })
              : "Wholesale Packs"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenInquiry && (
            <button
              type="button"
              onClick={onOpenInquiry}
              className="h-10 px-3.5 rounded-full border border-stone-300 bg-white text-xs font-medium text-charcoal-900 shadow-xs"
            >
              Inquire
            </button>
          )}
          <button
            type="button"
            onClick={handleAddAll}
            disabled={totalUnits === 0 || disabled || isAddingAll}
            className="h-10 px-5 rounded-full bg-charcoal-900 text-white text-xs font-semibold disabled:opacity-40 shadow-xs transition"
          >
            {isAddingAll ? "Adding..." : `Add to Cart (${totalUnits})`}
          </button>
        </div>
      </div>
    </div>
  )
}
