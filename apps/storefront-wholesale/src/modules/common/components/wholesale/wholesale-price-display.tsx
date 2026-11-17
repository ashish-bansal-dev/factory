"use client"

import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"

interface WholesalePriceDisplayProps {
  calculatedPrice: string | number
  originalPrice?: string | number | null
  msrp?: number | null
  bundleSize?: number | null
  isGated?: boolean
  currencyCode?: string
  className?: string
}

export default function WholesalePriceDisplay({
  calculatedPrice,
  originalPrice,
  msrp,
  bundleSize = 1,
  isGated = false,
  currencyCode = "inr",
  className = "",
}: WholesalePriceDisplayProps) {
  // If wholesale pricing is gated for guests/unregistered buyers
  if (isGated) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {msrp ? (
          <div className="flex items-baseline gap-1.5 text-xs text-stone-500">
            <span>Est. Retail MRP:</span>
            <span className="font-medium text-charcoal-900">
              {convertToLocale({ amount: msrp / 100, currency_code: currencyCode })}
            </span>
          </div>
        ) : null}
        <LocalizedClientLink
          href="/account"
          className="inline-flex items-center text-xs font-semibold text-terracotta-600 hover:text-terracotta-700 underline decoration-terracotta-600/30 underline-offset-4"
        >
          Register to view wholesale prices &rarr;
        </LocalizedClientLink>
      </div>
    )
  }

  // Calculate gross retail profit margin if MSRP is available
  let marginPercent: number | null = null
  const numericPrice =
    typeof calculatedPrice === "number"
      ? calculatedPrice
      : parseFloat(String(calculatedPrice).replace(/[^0-9.]/g, ""))

  if (msrp && numericPrice && msrp > 0) {
    const unitMsrp = msrp / 100
    if (unitMsrp > numericPrice) {
      marginPercent = Math.round(((unitMsrp - numericPrice) / unitMsrp) * 100)
    }
  }

  const formattedCalculatedPrice =
    typeof calculatedPrice === "number"
      ? convertToLocale({ amount: calculatedPrice, currency_code: currencyCode })
      : calculatedPrice

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-base sm:text-lg font-bold text-charcoal-900 tracking-tight">
          {formattedCalculatedPrice}
        </span>
        <span className="text-xs font-medium text-stone-500">/ pc</span>
        {originalPrice && originalPrice !== calculatedPrice && (
          <span className="line-through text-xs text-stone-400">
            {originalPrice}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        {msrp && (
          <span className="text-xs font-medium text-stone-600">
            MRP {convertToLocale({ amount: msrp / 100, currency_code: currencyCode })}
          </span>
        )}
        {marginPercent !== null && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-forest-100 text-forest-800 border border-forest-300">
            {marginPercent}% margin
          </span>
        )}
      </div>

      {bundleSize && bundleSize > 1 && !isNaN(numericPrice) && (
        <span className="text-xs font-medium text-stone-600 mt-0.5">
          Pack of {bundleSize} pcs ({convertToLocale({ amount: numericPrice * bundleSize, currency_code: currencyCode })} / pack)
        </span>
      )}
    </div>
  )
}
