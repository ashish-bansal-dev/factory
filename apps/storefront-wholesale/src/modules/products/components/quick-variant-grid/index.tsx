"use client"

import { addMultipleToCart } from "@lib/data/cart"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import {
  calculateBundleSize,
  calculatePackMsrp,
  calculateRetailMargin,
  formatPackBreakdown,
  getPackDescription,
  getUnitMrp,
  getVariantAvailability,
  getVolumeTiers,
  isWholesaleVariant,
  parsePackBreakdown,
  VolumeTier,
} from "@lib/util/pack"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React, { useMemo, useState } from "react"
import { useCuratedQuote } from "@lib/context/curated-quote-context"
import VolumeDiscountTable from "../volume-discount-table"
import WholesaleInquiryModal, {
  WholesaleInquiryModalProps,
} from "../wholesale-inquiry-modal"

interface QuickVariantGridProps {
  product: HttpTypes.StoreProduct
  countryCode: string
  disabled?: boolean
  seller?: {
    id: string
    name: string
    [key: string]: any
  } | null
  isTenant?: boolean
}

export default function QuickVariantGrid({
  product,
  countryCode,
  disabled = false,
  seller,
  isTenant,
}: QuickVariantGridProps) {
  const sortedVariants = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return []
    return [...product.variants]
      .filter(isWholesaleVariant)
      .sort((a, b) => {
        const rankA = (a as { variant_rank?: number }).variant_rank ?? 0
        const rankB = (b as { variant_rank?: number }).variant_rank ?? 0
        if (rankA !== rankB) return rankA - rankB
        return 0
      })
  }, [product.variants])

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [feedback, setFeedback] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  // Quote modal state
  const [quoteModalConfig, setQuoteModalConfig] = useState<{
    isOpen: boolean
    variantId?: string | null
    packName?: string | null
    packBreakdown?: string | Record<string, number> | null
    bundleSize?: number | null
    selectedPacks?: number | null
    selectedSummary?: string | null
    initialQuantity?: number | null
    initialNotes?: string | null
  }>({
    isOpen: false,
  })

  const getVariantAttributes = (variant: HttpTypes.StoreProductVariant) => {
    let size = ""
    let color = ""

    const optionsMap = (variant.options || []).reduce(
      (acc: Record<string, string>, opt: any) => {
        const title = (opt.option?.title || "").toLowerCase()
        if (title.includes("size")) size = opt.value
        if (title.includes("color") || title.includes("colour")) color = opt.value
        acc[opt.option_id] = opt.value
        return acc
      },
      {}
    )

    if (!size || !color) {
      for (const prodOpt of product.options || []) {
        const optTitle = (prodOpt.title || "").toLowerCase()
        const val = optionsMap[prodOpt.id]
        if (val) {
          if (!size && optTitle.includes("size")) size = val
          if (!color && (optTitle.includes("color") || optTitle.includes("colour")))
            color = val
        }
      }
    }

    if (
      !size &&
      !color &&
      variant.title &&
      variant.title !== "Default" &&
      variant.title !== "Default Variant"
    ) {
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

    if (!size)
      size =
        variant.title && variant.title !== "Default"
          ? variant.title
          : "Standard"
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

  // Calculate totals
  const totalUnits = useMemo(() => {
    return Object.values(quantities).reduce((acc, q) => acc + (q || 0), 0)
  }, [quantities])

  const totalPacks = useMemo(() => {
    let packs = 0
    for (const v of sortedVariants) {
      const q = quantities[v.id] || 0
      if (q > 0) {
        const breakdown = parsePackBreakdown(
          (v as any).metadata?.pack_breakdown || (v as any).pack_breakdown
        )
        const bSize = calculateBundleSize(v, breakdown)
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

  const handleOpenQuoteModal = (targetVariant?: HttpTypes.StoreProductVariant) => {
    if (targetVariant) {
      const breakdown = parsePackBreakdown(
        (targetVariant as any).metadata?.pack_breakdown ||
          (targetVariant as any).pack_breakdown
      )
      const packDescription = getPackDescription(targetVariant)
      const bundleSize = calculateBundleSize(targetVariant, breakdown)
      const q = quantities[targetVariant.id] || bundleSize
      const packs = Math.round(q / bundleSize)
      const breakdownStr = formatPackBreakdown(breakdown)

      setQuoteModalConfig({
        isOpen: true,
        variantId: targetVariant.id,
        packName: packDescription,
        packBreakdown: breakdown,
        bundleSize,
        selectedPacks: packs,
        initialQuantity: q,
        initialNotes: `Inquiry for ${packDescription || targetVariant.title}: ${packs} pack(s) (${q} pcs)${
          breakdownStr ? ` [${breakdownStr}]` : ""
        }`,
      })
      return
    }

    // Multiple variants selected in grid
    const selected = sortedVariants.filter((v) => (quantities[v.id] || 0) > 0)

    if (selected.length > 0) {
      const summaryLines = selected.map((v) => {
        const bd = parsePackBreakdown(
          (v as any).metadata?.pack_breakdown || (v as any).pack_breakdown
        )
        const pn = getPackDescription(v) || v.title
        const bs = calculateBundleSize(v, bd)
        const q = quantities[v.id]
        const pk = Math.round(q / bs)
        const fmt = formatPackBreakdown(bd)
        return `• ${pn}: ${pk} pack(s) (${q} pcs)${fmt ? ` [${fmt}]` : ""}`
      })

      const primary = selected[0]
      const primaryBreakdown = parsePackBreakdown(
        (primary as any).metadata?.pack_breakdown ||
          (primary as any).pack_breakdown
      )

      setQuoteModalConfig({
        isOpen: true,
        variantId: selected.length === 1 ? primary.id : null,
        packName:
          selected.length === 1
            ? getPackDescription(primary) || primary.title
            : `${selected.length} Pack Options Selected`,
        packBreakdown: selected.length === 1 ? primaryBreakdown : null,
        bundleSize:
          selected.length === 1
            ? calculateBundleSize(primary, primaryBreakdown)
            : null,
        selectedPacks: totalPacks,
        selectedSummary: `Selected ${totalPacks} packs (${totalUnits} pcs total across ${selected.length} variant(s))`,
        initialQuantity: totalUnits,
        initialNotes: `Bulk Wholesale Quote Request for ${product.title}:\n${summaryLines.join(
          "\n"
        )}`,
      })
    } else {
      // General product quote
      const firstVariant = sortedVariants[0]
      const firstBreakdown = firstVariant
        ? parsePackBreakdown(
            (firstVariant as any).metadata?.pack_breakdown ||
              (firstVariant as any).pack_breakdown
          )
        : null
      const firstBundle = firstVariant
        ? calculateBundleSize(firstVariant, firstBreakdown)
        : 1

      setQuoteModalConfig({
        isOpen: true,
        variantId: firstVariant?.id,
        packName:
          getPackDescription(firstVariant) ||
          firstVariant?.title ||
          "Wholesale Pack",
        packBreakdown: firstBreakdown,
        bundleSize: firstBundle,
        selectedPacks: 1,
        initialQuantity: firstBundle * 5,
        initialNotes: `Inquiry for wholesale pricing and delivery lead times for ${product.title}.`,
      })
    }
  }

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

      const totalUnitsSelected = selected.reduce(
        (sum, v) => sum + quantities[v.id],
        0
      )
      const message =
        itemsForQuote.length > 0 && itemsForCart.length > 0
          ? `Added ${itemsForCart.length} variant(s) to Cart and ${itemsForQuote.length} to Quote Basket`
          : itemsForQuote.length > 0
          ? `Added ${totalUnitsSelected} pcs across ${itemsForQuote.length} variant(s) to Quote Basket`
          : `Added ${totalUnitsSelected} pcs to wholesale cart`

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

  if (sortedVariants.length === 0) {
    return (
      <div className="bg-sand-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-600 font-sans">
        No wholesale packs or bulk variants are currently listed for this product. Use the Request a Quote button to connect directly for custom production inquiries.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-4 font-sans">
      {/* Header with Prominent Quote CTA Banner */}
      <div className="rounded-2xl border border-stone-200 bg-sand-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-forest-700 inline-block" />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-charcoal-900">
              Wholesale Packs & Size Curve Matrix
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Pre-assembled packs, dedicated inventory, and tiered volume pricing.
          </p>
        </div>

        {/* PROMINENT INQUIRY & WHATSAPP ACTIONS */}
        <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => handleOpenQuoteModal()}
            className="h-10 px-5 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-charcoal-900 hover:border-charcoal-900 text-xs font-bold shadow-xs transition flex items-center gap-2 flex-1 sm:flex-none justify-center"
          >
            <svg
              className="w-4 h-4 text-terracotta-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span>Request a Quote</span>
          </button>

          <a
            href={`https://wa.me/${((seller as any)?.phone || "919782077711").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Hello! I am inquiring about wholesale pricing for "${product.title}" on FactoryTribe Wholesale.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-full bg-forest-800 text-white hover:bg-forest-900 text-xs font-bold shadow-xs transition flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
          >
            <svg className="w-3.5 h-3.5 fill-current text-emerald-400" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.075-1.02-.053-.404-.134-.925-.331-1.609-.645-1.503-.687-2.484-2.222-2.56-2.325-.074-.103-.615-.818-.615-1.56 0-.742.389-1.107.527-1.258.138-.151.3-.189.4-.189.102 0 .204.002.294.006.096.004.225-.036.352.27.13.312.443 1.08.482 1.159.039.078.065.17.013.272-.051.102-.077.166-.153.255-.077.089-.161.198-.231.266-.077.075-.157.157-.068.31.09.153.397.654.852 1.059.585.521 1.079.683 1.233.76.154.077.244.064.334-.039.09-.102.385-.45.488-.604.102-.153.205-.128.346-.076.14.051.897.423 1.05.5.153.077.256.115.294.18.038.064.038.372-.106.777z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {feedback && (
        <div
          className={clx(
            "text-xs p-3.5 rounded-xl border font-medium transition",
            feedback.type === "success"
              ? "bg-forest-50 text-forest-700 border-forest-700/20"
              : "bg-rose-50 text-rose-700 border-rose-200"
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* MOBILE-FIRST VIEW: Traversal-friendly Compact Variant Cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {sortedVariants.map((variant) => {
          const { size, color } = getVariantAttributes(variant)
          const prices = getPricesForVariant(variant)
          const qty = quantities[variant.id] ?? 0

          const breakdown = parsePackBreakdown(
            (variant as any).metadata?.pack_breakdown ||
              (variant as any).pack_breakdown
          )
          const packDescription = getPackDescription(variant)
          const formattedBreakdown = formatPackBreakdown(breakdown)
          const bundleSize = calculateBundleSize(variant, breakdown)

          const currency = prices?.currency_code || "INR"
          const unitPriceNum = prices?.calculated_price_number ?? 0
          const packPriceNum =
            prices?.pack_price_number ?? unitPriceNum * bundleSize

          const unitMsrpNum = getUnitMrp(variant)
          const packMsrpNum = calculatePackMsrp(variant, bundleSize)
          const marginPercent = calculateRetailMargin(packMsrpNum, packPriceNum)

          const availability = getVariantAvailability(variant)
          const volumeTiers = getVolumeTiers(
            variant,
            product,
            packPriceNum,
            currency
          )

          const currentPacks = Math.round(qty / bundleSize)

          return (
            <div
              key={variant.id}
              className={clx(
                "p-3.5 rounded-2xl border transition-all duration-150 bg-white",
                qty > 0
                  ? "border-terracotta-600 bg-terracotta-50/20 shadow-xs ring-1 ring-terracotta-600/20"
                  : "border-stone-200 hover:border-stone-300"
              )}
            >
              {/* Row 1: Distinct Color & Size Badges + Pack Name/Curve */}
              <div className="flex flex-col gap-1.5 mb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Color Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-charcoal-900 border border-stone-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-500 inline-block" />
                      {color}
                    </span>

                    {/* Size Badge */}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sand-200/80 text-charcoal-900 border border-sand-300">
                      Size: {size}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold text-charcoal-800 bg-sand-100 px-2 py-0.5 rounded-full border border-stone-200">
                    {bundleSize} pcs/pack
                  </span>
                </div>

                {/* Pack Specification or Curve breakdown */}
                {(packDescription || formattedBreakdown) && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {packDescription && (
                      <span className="text-[11px] font-bold text-charcoal-900">
                        {packDescription}
                      </span>
                    )}
                    {formattedBreakdown && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-terracotta-800 bg-terracotta-50/70 border border-terracotta-200/80 px-2 py-0.5 rounded-full">
                        {formattedBreakdown}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Row 2: Dedicated Inventory & Availability Messaging Badge */}
              <div className="mb-2.5">
                {availability.status === "in_stock" ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-forest-700 bg-forest-50 border border-forest-700/20 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-700 inline-block" />
                    {availability.badgeText}
                  </span>
                ) : availability.status === "backorder" ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                    {availability.badgeText}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenQuoteModal(variant)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-stone-700 bg-stone-100 border border-stone-300 hover:border-stone-400 hover:bg-stone-200 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
                    {availability.badgeText}
                  </button>
                )}
              </div>

              {/* Row 3: Unit MSRP vs Pack Price with Calculated Retail Margin % */}
              <div className="py-2 border-t border-stone-100 text-xs flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-charcoal-900">
                      {prices?.calculated_price ?? "Quote"}
                    </span>
                    <span className="text-[11px] text-stone-500">/ pc</span>

                    {prices?.pack_price && bundleSize > 1 && (
                      <span className="text-[11px] font-semibold text-charcoal-800 ml-1">
                        ({prices.pack_price} / pack)
                      </span>
                    )}
                  </div>

                  {marginPercent > 0 && (
                    <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-700/20 shrink-0">
                      {marginPercent}% margin
                    </span>
                  )}
                </div>

                {packMsrpNum && (
                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <span>
                      Pack MSRP:{" "}
                      <span className="line-through font-medium">
                        {convertToLocale({
                          amount: packMsrpNum,
                          currency_code: currency,
                        })}
                      </span>
                    </span>
                    {unitMsrpNum && (
                      <span className="text-stone-400">
                        ({convertToLocale({
                          amount: unitMsrpNum,
                          currency_code: currency,
                        })} / pc)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Row 4: Tiered Volume Discount Pricing Table (if applicable) */}
              {volumeTiers.length > 0 && (
                <div className="mb-2">
                  <VolumeDiscountTable
                    tiers={volumeTiers}
                    currentPacks={currentPacks}
                  />
                </div>
              )}

              {/* Row 5: Auto-Selecting Quantity Stepper */}
              <div className="flex items-center justify-between pt-2.5 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 font-medium">
                  {qty > 0 ? (
                    <strong className="text-terracotta-700 font-semibold">
                      {currentPacks} pk ({qty} pcs) selected
                    </strong>
                  ) : (
                    "Quantity to order:"
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleStep(variant.id, -bundleSize, bundleSize)
                      }
                      disabled={qty <= 0 || disabled}
                      className="w-9 h-9 flex items-center justify-center text-charcoal-900 active:bg-sand-100 disabled:opacity-30 text-base font-bold select-none"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <div className="w-14 text-center text-xs font-bold text-charcoal-900">
                      {qty === 0 ? "0" : `${qty / bundleSize} pk`}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleStep(variant.id, bundleSize, bundleSize)
                      }
                      disabled={disabled}
                      className="w-9 h-9 flex items-center justify-center text-charcoal-900 active:bg-sand-100 disabled:opacity-30 text-base font-bold select-none"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenQuoteModal(variant)}
                    title="Request a quote for this pack"
                    className="h-9 px-2.5 rounded-lg border border-stone-200 text-stone-600 hover:text-charcoal-900 hover:bg-stone-50 text-[11px] font-semibold"
                  >
                    Quote
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* DESKTOP VIEW: Structured Tabular Grid */}
      <div className="hidden sm:block overflow-x-auto border border-stone-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-xs divide-y divide-stone-200">
          <thead className="bg-sand-100/80 text-stone-600 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th scope="col" className="py-3.5 px-4">
                Color
              </th>
              <th scope="col" className="py-3.5 px-4">
                Size
              </th>
              <th scope="col" className="py-3.5 px-4">
                Pack & Ratio Breakdown
              </th>
              <th scope="col" className="py-3.5 px-4">
                Availability
              </th>
              <th scope="col" className="py-3.5 px-4">
                Retail MSRP
              </th>
              <th scope="col" className="py-3.5 px-4">
                Wholesale Price
              </th>
              <th
                scope="col"
                className="py-3.5 px-4 text-center min-w-[150px]"
              >
                Pack Quantity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {sortedVariants.map((variant) => {
              const { size, color } = getVariantAttributes(variant)
              const prices = getPricesForVariant(variant)
              const qty = quantities[variant.id] ?? 0

              const breakdown = parsePackBreakdown(
                (variant as any).metadata?.pack_breakdown ||
                  (variant as any).pack_breakdown
              )
              const packDescription = getPackDescription(variant)
              const formattedBreakdown = formatPackBreakdown(breakdown)
              const bundleSize = calculateBundleSize(variant, breakdown)

              const currency = prices?.currency_code || "INR"
              const unitPriceNum = prices?.calculated_price_number ?? 0
              const packPriceNum =
                prices?.pack_price_number ?? unitPriceNum * bundleSize

              const unitMsrpNum = getUnitMrp(variant)
              const packMsrpNum = calculatePackMsrp(variant, bundleSize)
              const marginPercent = calculateRetailMargin(
                packMsrpNum,
                packPriceNum
              )

              const availability = getVariantAvailability(variant)
              const volumeTiers = getVolumeTiers(
                variant,
                product,
                packPriceNum,
                currency
              )
              const currentPacks = Math.round(qty / bundleSize)

              return (
                <React.Fragment key={variant.id}>
                  <tr
                    className={clx(
                      "hover:bg-sand-50/50 transition-colors",
                      qty > 0 && "bg-terracotta-50/20"
                    )}
                  >
                    {/* Color Column */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 text-charcoal-900 border border-stone-200">
                        <span className="w-2 h-2 rounded-full bg-stone-500 inline-block" />
                        {color}
                      </span>
                    </td>

                    {/* Size Column */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sand-200/80 text-charcoal-900 border border-sand-300">
                        {size}
                      </span>
                    </td>

                    {/* Pack & Breakdown Column */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-col gap-1">
                        {packDescription ? (
                          <span className="text-xs font-bold text-charcoal-900">
                            {packDescription}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-charcoal-900">
                            Pack of {bundleSize} pcs
                          </span>
                        )}

                        {formattedBreakdown ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-terracotta-800 bg-terracotta-50/80 border border-terracotta-200 px-2 py-0.5 rounded-full w-fit">
                            {formattedBreakdown}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-500 font-medium">
                            {bundleSize} pcs / pack
                          </span>
                        )}

                        {variant.sku && (
                          <span className="font-mono text-[10px] text-stone-400 mt-0.5 block">
                            SKU: {variant.sku}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dedicated Inventory & Availability Messaging */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      {availability.status === "in_stock" ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-forest-700 bg-forest-50 border border-forest-700/20 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-forest-700 inline-block" />
                          {availability.badgeText}
                        </span>
                      ) : availability.status === "backorder" ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                          {availability.badgeText}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenQuoteModal(variant)}
                          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-stone-700 bg-stone-100 border border-stone-300 hover:border-stone-400 hover:bg-stone-200 px-2.5 py-1 rounded-full transition cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
                          {availability.badgeText}
                        </button>
                      )}
                    </td>

                    {/* Retail MSRP Column */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      {packMsrpNum ? (
                        <div className="flex flex-col">
                          <span className="text-stone-500 line-through font-medium text-xs">
                            {convertToLocale({
                              amount: packMsrpNum,
                              currency_code: currency,
                            })}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-0.5">
                            {unitMsrpNum
                              ? `${convertToLocale({
                                  amount: unitMsrpNum,
                                  currency_code: currency,
                                })} / pc`
                              : "Pack MSRP"}
                          </span>
                          {marginPercent > 0 && (
                            <span className="text-[10px] font-bold text-forest-700 bg-forest-50 border border-forest-700/20 px-1.5 py-0.5 rounded-full mt-1 w-fit">
                              {marginPercent}% margin
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Wholesale Price Column */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
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
                              {prices.pack_price}{" "}
                              <span className="text-stone-500 font-normal">
                                / pack
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400 text-xs">Quote</span>
                      )}
                    </td>

                    {/* Pack Quantity Stepper */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center border border-stone-300 rounded-lg bg-white shadow-2xs overflow-hidden w-28">
                          <button
                            type="button"
                            onClick={() =>
                              handleStep(variant.id, -bundleSize, bundleSize)
                            }
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
                              handleQuantityInputChange(
                                variant.id,
                                e.target.value,
                                bundleSize
                              )
                            }
                            onBlur={() => handleBlur(variant.id, bundleSize)}
                            disabled={disabled}
                            className="w-12 text-center text-xs py-1 font-bold text-charcoal-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleStep(variant.id, bundleSize, bundleSize)
                            }
                            disabled={disabled}
                            className="w-8 h-8 flex items-center justify-center text-charcoal-900 hover:bg-sand-50 active:bg-sand-100 disabled:opacity-30 text-base font-bold select-none"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-[10px] text-center text-stone-500 mt-1 font-medium">
                          {qty > 0 ? (
                            <span className="text-terracotta-700 font-semibold">
                              {currentPacks}{" "}
                              {currentPacks === 1 ? "pack" : "packs"}
                            </span>
                          ) : (
                            <span>0 packs</span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Optional Volume Discount Tiers row */}
                  {volumeTiers.length > 0 && (
                    <tr className="bg-sand-50/40">
                      <td colSpan={7} className="py-2 px-4 border-t border-stone-100">
                        <VolumeDiscountTable
                          tiers={volumeTiers}
                          currentPacks={currentPacks}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* DESKTOP Bottom Action Bar - Browse & Inquiry Only */}
      <div className="hidden sm:flex border border-stone-200 items-center justify-between gap-4 bg-sand-50 p-4 rounded-2xl shadow-2xs">
        <div className="text-xs text-charcoal-900 flex items-center gap-4 flex-wrap">
          <span className="font-serif text-sm font-semibold text-charcoal-900">
            Wholesale Sourcing & Inquiries
          </span>
          <span className="text-stone-500 text-xs">
            Direct factory pack pricing • Verified QC • Pan-India shipping
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Prominent 'Request a Quote' CTA button */}
          <button
            type="button"
            onClick={() => handleOpenQuoteModal()}
            className="h-11 px-6 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 text-xs font-bold shadow-xs transition flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-terracotta-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span>Request Wholesale Quote</span>
          </button>

          {/* Connect on WhatsApp CTA */}
          <a
            href={`https://wa.me/${((seller as any)?.phone || "919782077711").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Hello! I am inquiring about wholesale pricing and availability for "${product.title}" on FactoryTribe Wholesale.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-6 rounded-full bg-forest-800 text-white hover:bg-forest-900 text-xs font-bold shadow-xs transition flex items-center gap-2"
          >
            <svg className="w-4 h-4 fill-current text-emerald-400" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.075-1.02-.053-.404-.134-.925-.331-1.609-.645-1.503-.687-2.484-2.222-2.56-2.325-.074-.103-.615-.818-.615-1.56 0-.742.389-1.107.527-1.258.138-.151.3-.189.4-.189.102 0 .204.002.294.006.096.004.225-.036.352.27.13.312.443 1.08.482 1.159.039.078.065.17.013.272-.051.102-.077.166-.153.255-.077.089-.161.198-.231.266-.077.075-.157.157-.068.31.09.153.397.654.852 1.059.585.521 1.079.683 1.233.76.154.077.244.064.334-.039.09-.102.385-.45.488-.604.102-.153.205-.128.346-.076.14.051.897.423 1.05.5.153.077.256.115.294.18.038.064.038.372-.106.777z"/>
            </svg>
            <span>Connect on WhatsApp</span>
          </a>

          {/* Transactional cart adding code commented out for Browse-Only pipeline
          <button
            type="button"
            onClick={handleAddAll}
            disabled={totalUnits === 0 || disabled || isAddingAll}
            className="h-10 px-6 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 disabled:opacity-40 text-xs font-semibold shadow-xs transition"
          >
            {isAddingAll
              ? "Processing..."
              : `Add Selected to Order (${totalUnits} pcs)`}
          </button>
          */}
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR - Browse & Inquiry Only */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 sm:hidden shadow-lg flex items-center justify-between gap-2.5">
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-stone-500 font-medium truncate">
            Wholesale Inquiries
          </span>
          <span className="font-bold text-sm text-charcoal-900 truncate">
            {product.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenQuoteModal()}
            className="h-10 px-4 rounded-full bg-charcoal-900 text-white text-xs font-bold shadow-xs active:bg-stone-800"
          >
            Request Quote
          </button>

          <a
            href={`https://wa.me/${((seller as any)?.phone || "919782077711").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Hello! I am inquiring about wholesale pricing for "${product.title}" on FactoryTribe Wholesale.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-3.5 rounded-full bg-forest-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current text-emerald-400" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.075-1.02-.053-.404-.134-.925-.331-1.609-.645-1.503-.687-2.484-2.222-2.56-2.325-.074-.103-.615-.818-.615-1.56 0-.742.389-1.107.527-1.258.138-.151.3-.189.4-.189.102 0 .204.002.294.006.096.004.225-.036.352.27.13.312.443 1.08.482 1.159.039.078.065.17.013.272-.051.102-.077.166-.153.255-.077.089-.161.198-.231.266-.077.075-.157.157-.068.31.09.153.397.654.852 1.059.585.521 1.079.683 1.233.76.154.077.244.064.334-.039.09-.102.385-.45.488-.604.102-.153.205-.128.346-.076.14.051.897.423 1.05.5.153.077.256.115.294.18.038.064.038.372-.106.777z"/>
            </svg>
            <span>WhatsApp</span>
          </a>

          {/* Transactional cart button commented out
          <button
            type="button"
            onClick={handleAddAll}
            disabled={totalUnits === 0 || disabled || isAddingAll}
            className="h-10 px-4 rounded-full bg-charcoal-900 text-white text-xs font-semibold disabled:opacity-40 shadow-xs transition"
          >
            {isAddingAll ? "Adding..." : `Add (${totalUnits} pcs)`}
          </button>
          */}
        </div>
      </div>

      {/* Wholesale Inquiry / RFQ Modal */}
      <WholesaleInquiryModal
        isOpen={quoteModalConfig.isOpen}
        close={() =>
          setQuoteModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
        productId={product.id}
        productTitle={product.title}
        variantId={quoteModalConfig.variantId}
        sellerId={seller?.id || (product as any).seller?.id || null}
        sellerName={seller?.name || (product as any).seller?.name || null}
        isTenant={isTenant}
        packName={quoteModalConfig.packName}
        packBreakdown={quoteModalConfig.packBreakdown}
        bundleSize={quoteModalConfig.bundleSize}
        selectedPacks={quoteModalConfig.selectedPacks}
        selectedSummary={quoteModalConfig.selectedSummary}
        initialQuantity={quoteModalConfig.initialQuantity}
        initialNotes={quoteModalConfig.initialNotes}
      />
    </div>
  )
}
