"use client"

import React, { useEffect, useState } from "react"
import { useCuratedQuote } from "@lib/context/curated-quote-context"

export default function FloatingQuoteCart() {
  const { totalItems, totalUnits } = useCuratedQuote()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || totalItems === 0) {
    return null
  }

  const handleOpenDrawer = () => {
    window.dispatchEvent(new Event("open-cart-drawer"))
  }

  return (
    <aside
      aria-label="Wholesale Quote Cart"
      className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-50 flex justify-center pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="pointer-events-auto bg-charcoal-900/95 backdrop-blur-md text-white px-4 sm:px-5 py-3 rounded-2xl sm:rounded-full shadow-2xl border border-stone-700/80 flex items-center justify-between sm:justify-start gap-3 sm:gap-4 max-w-lg w-full sm:w-auto">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-terracotta-600 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-charcoal-900 font-extrabold text-[10px] flex items-center justify-center shadow-xs">
              {totalItems}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-sand-50">
                Wholesale Quote Cart
              </span>
            </div>
            <span className="text-[11px] text-stone-300">
              {totalItems} {totalItems === 1 ? "product" : "products"} selected (Qty: {totalUnits})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenDrawer}
          className="h-9 sm:h-10 px-4 rounded-xl sm:rounded-full bg-forest-700 hover:bg-forest-600 active:bg-forest-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Review & Send</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
