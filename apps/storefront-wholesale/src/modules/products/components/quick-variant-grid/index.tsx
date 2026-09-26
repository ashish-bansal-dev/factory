"use client"

import { addMultipleToCart } from "@lib/data/cart"
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
}

export default function QuickVariantGrid({
  product,
  countryCode,
  disabled = false,
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
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const getVariantAttributes = (variant: HttpTypes.StoreProductVariant) => {
    let size = ""
    let color = ""

    const optionsMap = (variant.options || []).reduce((acc: Record<string, string>, opt: any) => {
      const title = (opt.option?.title || "").toLowerCase()
      if (title.includes("size")) size = opt.value
      if (title.includes("color") || title.includes("colour")) color = opt.value
      acc[opt.option_id] = opt.value
      return acc
    }, {})

    if (!size || !color) {
      for (const prodOpt of product.options || []) {
        const optTitle = (prodOpt.title || "").toLowerCase()
        const val = optionsMap[prodOpt.id]
        if (val) {
          if (!size && optTitle.includes("size")) size = val
          if (!color && (optTitle.includes("color") || optTitle.includes("colour"))) color = val
        }
      }
    }

    if (!size && !color && variant.title && variant.title !== "Default" && variant.title !== "Default Variant") {
      const parts = variant.title.split("/").map((s) => s.trim())
      if (parts.length >= 2) {
        const sizeRegex = /^(xs|s|m|l|xl|xxl|2xl|3xl|4xl|one size|free size|\d{2,3})$/i
        if (sizeRegex.test(parts[0])) {
          size = parts[0]
          color = parts.slice(1).join(" / ")
        } else if (sizeRegex.test(parts[1])) {
          size = parts[1]
          color = parts[0]
        } else {
          color = parts[0]
          size = parts.slice(1).join(" / ")
        }
      } else if (parts.length === 1) {
        size = parts[0]
        color = "Standard"
      }
    }

    if (!size) size = variant.title && variant.title !== "Default" ? variant.title : "Standard"
    if (!color) color = "Standard"

    return { size, color }
  }

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

  const handleAddAll = async () => {
    const selected = sortedVariants.filter((v) => (quantities[v.id] || 0) > 0)
    if (selected.length === 0) return

    const canAddToCart = (v: HttpTypes.StoreProductVariant) => {
      const hasOffer = Boolean((v as { offer_id?: string | null }).offer_id)
      const inStock = v.allow_backorder || (v.inventory_quantity ?? 0) > 0
      return hasOffer && inStock
    }

    const itemsForCart = selected.filter(canAddToCart)
    const itemsForQuote = selected.filter((v) => !canAddToCart(v))

    setIsAddingAll(true)
    setFeedback(null)

    try {
      if (itemsForCart.length > 0) {
        await addMultipleToCart(
          itemsForCart.map((v) => ({
            variantId: v.id,
            offerId: (v as { offer_id?: string | null }).offer_id ?? undefined,
            quantity: quantities[v.id],
          })),
          countryCode
        )
      }

      if (itemsForQuote.length > 0) {
        itemsForQuote.forEach((v) => {
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
        itemsForQuote.length > 0 && itemsForCart.length > 0
          ? `Added ${itemsForCart.length} variant(s) to Cart and ${itemsForQuote.length} to Quote Basket`
          : itemsForQuote.length > 0
          ? `Added ${totalUnits} pcs across ${itemsForQuote.length} variant(s) to Quote Basket`
          : `Added ${totalUnits} pcs to wholesale cart`

      setFeedback({
        message,
        type: "success",
      })
      setQuantities({})
      if (itemsForCart.length > 0 && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-cart-drawer"))
      }
      setTimeout(() => setFeedback(null), 4000)
    } catch (err: any) {
      setFeedback({
        message: err?.message || "Failed to process items",
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

  if (sortedVariants.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-lg font-bold text-charcoal-900">
            Wholesale Packs & Size Matrix
          </h2>
          <p className="text-xs text-stone-500">
            Select pack quantities for each Color & Size
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sand-100 text-charcoal-900 border border-stone-200">
          {sortedVariants.length} {sortedVariants.length === 1 ? "Option" : "Options"}
        </span>
      </div>

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

      {/* MOBILE-FIRST VIEW: Traversal-friendly Compact Variant Cards */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {sortedVariants.map((variant) => {
          const { size, color } = getVariantAttributes(variant)
          const prices = getPricesForVariant(variant)
          const qty = quantities[variant.id] ?? 0
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

          return (
            <div
              key={variant.id}
              className={clx(
                "p-3 rounded-xl border transition-all duration-150 bg-white",
                qty > 0
                  ? "border-terracotta-600 bg-terracotta-50/20 shadow-xs ring-1 ring-terracotta-600/20"
                  : "border-stone-200 hover:border-stone-300"
              )}
            >
              {/* Row 1: Distinct Color & Size Badges + Pack Info (Stock Removed) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Distinct Color Column */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-charcoal-900 border border-stone-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-500 inline-block" />
                    {color}
                  </span>

                  {/* Distinct Size Column */}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sand-200/80 text-charcoal-900 border border-sand-300">
                    Size: {size}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-charcoal-700 bg-sand-100 px-2 py-0.5 rounded-full border border-stone-200">
                    {bundleSize} pcs/pack
                  </span>
                </div>
              </div>

              {/* Row 2: Price & Margin */}
              <div className="flex items-baseline justify-between py-1.5 border-t border-stone-100 text-xs">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-sm text-charcoal-900">
                    {prices ? prices.calculated_price : "Quote"}
                  </span>
                  <span className="text-[11px] text-stone-500">/ pc</span>
                  {prices?.mrp && (
                    <span className="text-[11px] line-through text-stone-400 ml-1">
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

              {/* Row 3: Auto-Selecting Quantity Stepper (Active for all items to enable quote request) */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 font-medium">
                  {qty > 0 ? (
                    <strong className="text-terracotta-700 font-semibold">
                      {Math.round(qty / bundleSize)} pk ({qty} pcs) selected
                    </strong>
                  ) : (
                    "Quantity to order:"
                  )}
                </span>

                <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleStep(variant.id, -bundleSize, bundleSize)}
                    disabled={qty <= 0 || disabled}
                    className="w-10 h-10 flex items-center justify-center text-charcoal-900 active:bg-sand-100 disabled:opacity-30 text-lg font-bold select-none"
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
                    disabled={disabled}
                    className="w-10 h-10 flex items-center justify-center text-charcoal-900 active:bg-sand-100 disabled:opacity-30 text-lg font-bold select-none"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* DESKTOP VIEW: Structured Tabular Grid with Distinct Color & Size Columns (Stock Removed) */}
      <div className="hidden sm:block overflow-x-auto border border-stone-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-xs divide-y divide-stone-200">
          <thead className="bg-sand-100/80 text-stone-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th scope="col" className="py-3 px-3.5">
                Color
              </th>
              <th scope="col" className="py-3 px-3.5">
                Size
              </th>
              <th scope="col" className="py-3 px-3.5">
                Pack & SKU
              </th>
              <th scope="col" className="py-3 px-3.5">
                Retail MRP
              </th>
              <th scope="col" className="py-3 px-3.5">
                Wholesale Price
              </th>
              <th scope="col" className="py-3 px-3.5 text-center min-w-[140px]">
                Pack Quantity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {sortedVariants.map((variant) => {
              const { size, color } = getVariantAttributes(variant)
              const prices = getPricesForVariant(variant)
              const qty = quantities[variant.id] ?? 0
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

              return (
                <tr
                  key={variant.id}
                  className={clx(
                    "hover:bg-sand-50/50 transition-colors",
                    qty > 0 && "bg-terracotta-50/30"
                  )}
                >
                  {/* Distinct Color Column */}
                  <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 text-charcoal-900 border border-stone-200">
                      <span className="w-2 h-2 rounded-full bg-stone-500 inline-block" />
                      {color}
                    </span>
                  </td>

                  {/* Distinct Size Column */}
                  <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sand-200/80 text-charcoal-900 border border-sand-300">
                      {size}
                    </span>
                  </td>

                  {/* Pack & SKU Column */}
                  <td className="py-3 px-3.5 align-middle">
                    <span className="text-[11px] font-semibold text-charcoal-800 bg-sand-100 border border-stone-200 px-2 py-0.5 rounded-full inline-block">
                      Pack of {bundleSize} pcs
                    </span>
                    {variant.sku && (
                      <span className="font-mono text-[10px] text-stone-500 block mt-1">
                        SKU: {variant.sku}
                      </span>
                    )}
                  </td>

                  {/* Retail MRP Column */}
                  <td className="py-3 px-3.5 align-middle whitespace-nowrap">
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

                  {/* Wholesale Price Column */}
                  <td className="py-3 px-3.5 align-middle whitespace-nowrap">
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
                      <span className="text-stone-400 text-xs">Quote</span>
                    )}
                  </td>

                  {/* Pack Quantity Stepper (Enabled for all variants so zero-stock items can be quoted) */}
                  <td className="py-3 px-3.5 align-middle">
                    <div className="flex items-center justify-center border border-stone-300 rounded-lg bg-white shadow-xs overflow-hidden w-28 mx-auto">
                      <button
                        type="button"
                        onClick={() => handleStep(variant.id, -bundleSize, bundleSize)}
                        disabled={qty <= 0 || disabled}
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
                        disabled={disabled}
                        className="w-12 text-center text-xs py-1 font-bold text-charcoal-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleStep(variant.id, bundleSize, bundleSize)}
                        disabled={disabled}
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

        <button
          type="button"
          onClick={handleAddAll}
          disabled={totalUnits === 0 || disabled || isAddingAll}
          className="h-10 px-6 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 disabled:opacity-40 text-xs font-semibold shadow-xs transition"
        >
          {isAddingAll ? "Processing..." : `Add Selected to Order (${totalUnits} pcs)`}
        </button>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 sm:hidden shadow-lg flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-stone-500 font-medium">
            {totalUnits > 0 ? `${totalPacks} pk (${totalUnits} pcs)` : "Select packs above"}
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

        <button
          type="button"
          onClick={handleAddAll}
          disabled={totalUnits === 0 || disabled || isAddingAll}
          className="h-10 px-6 rounded-full bg-charcoal-900 text-white text-xs font-semibold disabled:opacity-40 shadow-xs transition"
        >
          {isAddingAll ? "Adding..." : `Add (${totalUnits} pcs)`}
        </button>
      </div>
    </div>
  )
}
