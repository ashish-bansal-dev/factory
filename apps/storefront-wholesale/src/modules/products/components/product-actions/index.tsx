"use client"

import { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"
import QuickVariantGrid from "../quick-variant-grid"
import { SellerDTO } from "@lib/data/seller"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  isTenant?: boolean
  seller?: SellerDTO
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const countryCode = useParams().countryCode as string

  if ((product.variants?.length ?? 0) === 0) {
    return (
      <div className="bg-sand-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-600 font-sans">
        No product options or variants are currently listed for this product. Use the WhatsApp button to connect directly for custom production inquiries.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-4 font-sans">
      <QuickVariantGrid
        product={product}
        countryCode={countryCode}
        disabled={disabled}
      />
    </div>
  )
}
