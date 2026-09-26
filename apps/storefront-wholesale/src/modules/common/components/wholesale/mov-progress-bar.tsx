"use client"

import React from "react"
import { convertToLocale } from "@lib/util/money"

interface VendorMOVProgressBarProps {
  vendorName: string
  currentTotal: number // in cents or base units
  minimumOrderValue: number // in cents or base units
  currencyCode?: string
  className?: string
}

export default function VendorMOVProgressBar({
  vendorName,
  currentTotal,
  minimumOrderValue,
  currencyCode = "inr",
  className = "",
}: VendorMOVProgressBarProps) {
  if (!minimumOrderValue || minimumOrderValue <= 0) {
    return null
  }

  const isMet = currentTotal >= minimumOrderValue
  const percentage = Math.min(100, Math.round((currentTotal / minimumOrderValue) * 100))
  const remaining = Math.max(0, (minimumOrderValue - currentTotal) / 100)

  return (
    <div className={`p-3 rounded-lg border bg-sand-50 ${isMet ? "border-forest-700/30" : "border-stone-200"} ${className}`}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-charcoal-900">
          {vendorName} Minimum Order: {convertToLocale({ amount: minimumOrderValue / 100, currency_code: currencyCode })}
        </span>
        {isMet ? (
          <span className="inline-flex items-center gap-1 font-semibold text-forest-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Minimum Met
          </span>
        ) : (
          <span className="text-stone-600 font-normal">
            Add <span className="font-semibold text-terracotta-600">{convertToLocale({ amount: remaining, currency_code: currencyCode })}</span> to meet minimum
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isMet ? "bg-forest-700" : "bg-terracotta-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
