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
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-charcoal-900">
          {formattedCalculatedPrice}
        </span>
        <span className="text-xs text-stone-500 font-normal">/ pc</span>
        {originalPrice && originalPrice !== calculatedPrice && (
          <span className="line-through text-xs text-stone-400">
            {originalPrice}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {msrp && (
          <span className="text-stone-500">
            MRP {convertToLocale({ amount: msrp / 100, currency_code: currencyCode })}
          </span>
        )}
        {marginPercent !== null && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-forest-50 text-forest-700 border border-forest-700/20">
            {marginPercent}% margin
          </span>
        )}
      </div>

      {bundleSize && bundleSize > 1 && !isNaN(numericPrice) && (
        <span className="text-[11px] text-stone-500 mt-0.5">
          Pack of {bundleSize} pcs ({convertToLocale({ amount: numericPrice * bundleSize, currency_code: currencyCode })} / pack)
        </span>
      )}
    </div>
  )
}
