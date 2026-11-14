"use client"

import React, { useMemo } from "react"
import { formatPackBreakdown, parsePackBreakdown } from "@lib/util/pack"

interface BundlePackBadgeProps {
  bundleSize?: number | null
  moqPacks?: number | null
  packName?: string | null
  packBreakdown?: Record<string, number> | string | null
  className?: string
}

export default function BundlePackBadge({
  bundleSize = 1,
  moqPacks = 1,
  packName,
  packBreakdown,
  className = "",
}: BundlePackBadgeProps) {
  const parsedBreakdown = useMemo(() => {
    return parsePackBreakdown(packBreakdown)
  }, [packBreakdown])

  const formattedCurve = useMemo(() => {
    return formatPackBreakdown(parsedBreakdown)
  }, [parsedBreakdown])

  if ((!bundleSize || bundleSize <= 1) && !packName && !formattedCurve) {
    return null
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-700 bg-sand-100 border border-stone-200/90 px-2.5 py-0.5 rounded-full ${className}`}
    >
      {packName && (
        <span className="font-bold text-charcoal-900">{packName}</span>
      )}
      {formattedCurve ? (
        <span className="text-terracotta-800 font-semibold">{formattedCurve}</span>
      ) : bundleSize && bundleSize > 1 ? (
        <span className="font-semibold text-charcoal-900">
          {bundleSize} pcs / pack
        </span>
      ) : null}
      {moqPacks && moqPacks > 1 && bundleSize ? (
        <span className="text-stone-500">
          · Min. {moqPacks} packs ({bundleSize * moqPacks} pcs)
        </span>
      ) : null}
    </div>
  )
}
