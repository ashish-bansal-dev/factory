"use client"

import React from "react"

interface BundlePackBadgeProps {
  bundleSize?: number | null
  moqPacks?: number | null
  className?: string
}

export default function BundlePackBadge({
  bundleSize = 1,
  moqPacks = 1,
  className = "",
}: BundlePackBadgeProps) {
  if (!bundleSize || bundleSize <= 1) {
    return null
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-600 bg-sand-100 border border-stone-200/80 px-2 py-0.5 rounded-full ${className}`}>
      <span className="font-semibold text-charcoal-900">{bundleSize} pcs / pack</span>
      {moqPacks && moqPacks > 1 && (
        <span className="text-stone-500">· Min. {moqPacks} packs ({bundleSize * moqPacks} pcs)</span>
      )}
    </div>
  )
}
