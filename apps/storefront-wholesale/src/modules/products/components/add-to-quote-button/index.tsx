"use client"

import React, { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { useCuratedQuote } from "@lib/context/curated-quote-context"

interface AddToQuoteButtonProps {
  product: HttpTypes.StoreProduct
  variantId?: string | null
  variantTitle?: string | null
  variant?: "card" | "pdp"
  className?: string
}

export default function AddToQuoteButton({
  product,
  variantId,
  variantTitle,
  variant = "card",
  className = "",
}: AddToQuoteButtonProps) {
  const { hasItem, toggleItem } = useCuratedQuote()

  const seller = (product as any).seller || (product as any).sellers?.[0]
  const targetVariant = useMemo(() => {
    if (variantId && product.variants?.length) {
      return product.variants.find((v) => v.id === variantId)
    }
    return (
      product.variants?.find((v) => (v.metadata as any)?.variant_type === "wholesale") ||
      product.variants?.[0] ||
      null
    )
  }, [product.variants, variantId])

  const resolvedVariantId = variantId || targetVariant?.id || null
  const isSelected = hasItem(product.id, resolvedVariantId)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    toggleItem({
      productId: product.id,
      productTitle: product.title,
      productHandle: product.handle,
      thumbnail: product.thumbnail || product.images?.[0]?.url || null,
      variantId: resolvedVariantId,
      variantTitle: variantTitle || targetVariant?.title || null,
      sku: targetVariant?.sku || null,
      quantity: 1,
      sellerId: seller?.id || null,
      sellerName: seller?.name || null,
    })
  }

  if (variant === "pdp") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`h-12 px-6 rounded-full font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
          isSelected
            ? "bg-forest-800 text-white hover:bg-forest-900 border border-forest-800"
            : "bg-white text-charcoal-900 border-2 border-stone-300 hover:border-charcoal-900 hover:bg-sand-50"
        } ${className}`}
      >
        {isSelected ? (
          <>
            <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>In Quote Cart</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-terracotta-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add to Quote Cart</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`w-full py-2 px-3 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 ${
        isSelected
          ? "bg-forest-800 text-white hover:bg-forest-900 border border-forest-800"
          : "bg-white/95 backdrop-blur-xs text-charcoal-900 border border-stone-300 hover:border-charcoal-900 hover:bg-sand-50 hover:shadow-xs"
      } ${className}`}
      title={isSelected ? "Remove from Quote Cart" : "Add to Quote Cart (Default Qty: 1)"}
    >
      {isSelected ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>In Quote Cart</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 text-charcoal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add to Quote</span>
        </>
      )}
    </button>
  )
}
