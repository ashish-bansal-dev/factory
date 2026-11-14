"use client"

import React from "react"
import { clx } from "@medusajs/ui"
import { VolumeTier } from "@lib/util/pack"

interface VolumeDiscountTableProps {
  tiers: VolumeTier[]
  currentPacks?: number
  className?: string
  compact?: boolean
}

export default function VolumeDiscountTable({
  tiers,
  currentPacks = 0,
  className = "",
  compact = false,
}: VolumeDiscountTableProps) {
  if (!tiers || tiers.length === 0) {
    return null
  }

  const maxDiscount = Math.max(...tiers.map((t) => t.discountPercentage || 0))

  return (
    <div
      className={clx(
        "rounded-xl border border-stone-200 bg-sand-50/70 p-3 font-sans",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-700 inline-block" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-900">
            Tiered Volume Pricing
          </span>
        </div>
        {maxDiscount > 0 && (
          <span className="text-[10px] font-semibold text-forest-700 bg-forest-50 border border-forest-700/20 px-2 py-0.5 rounded-full">
            Save up to {maxDiscount}%
          </span>
        )}
      </div>

      <div
        className={clx(
          "grid gap-2",
          tiers.length <= 3
            ? `grid-cols-${tiers.length}`
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        )}
        style={{
          gridTemplateColumns:
            tiers.length <= 3
              ? `repeat(${tiers.length}, minmax(0, 1fr))`
              : undefined,
        }}
      >
        {tiers.map((tier) => {
          const isSelected =
            currentPacks > 0 &&
            currentPacks >= tier.minQuantity &&
            (tier.maxQuantity == null || currentPacks <= tier.maxQuantity)

          return (
            <div
              key={tier.rangeLabel}
              className={clx(
                "rounded-lg border p-2 text-center transition-all duration-150",
                isSelected
                  ? "border-terracotta-600 bg-terracotta-50/70 shadow-xs ring-1 ring-terracotta-600/30"
                  : "border-stone-200/90 bg-white hover:border-stone-300"
              )}
            >
              <div
                className={clx(
                  "text-[10px] font-medium tracking-tight",
                  isSelected ? "text-terracotta-900 font-bold" : "text-stone-500"
                )}
              >
                {tier.rangeLabel}
              </div>

              <div
                className={clx(
                  "text-xs font-bold mt-0.5",
                  isSelected ? "text-terracotta-900" : "text-charcoal-900"
                )}
              >
                {tier.displayPrice}
              </div>

              {tier.discountPercentage > 0 ? (
                <div className="text-[10px] font-bold text-forest-700 mt-0.5">
                  ({tier.discountPercentage}% off)
                </div>
              ) : (
                <div className="text-[10px] text-stone-400 mt-0.5">Base pack</div>
              )}

              {isSelected && (
                <div className="text-[9px] font-bold uppercase tracking-wider text-terracotta-700 mt-1">
                  Active Tier
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
