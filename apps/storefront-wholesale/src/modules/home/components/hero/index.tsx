import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Hero() {
  return (
    <div className="relative border-b border-stone-200 bg-sand-50/60 overflow-hidden font-sans">
      {/* Subtle texture / gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sand-100/30 to-sand-100/60 pointer-events-none" />

      <div className="content-container relative py-16 sm:py-24 lg:py-28 flex flex-col items-center text-center">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-700/20 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-forest-700 inline-block animate-pulse" />
          Autumn / Winter 2026 Wholesale Collections Now Live
        </div>

        {/* Serif Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-charcoal-900 tracking-tight max-w-4xl leading-[1.15] mb-6">
          The curated B2B marketplace for <span className="italic font-normal">independent retail boutiques</span> and modern fashion brands.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl font-normal leading-relaxed mb-10">
          Source directly from verified apparel manufacturers and independent labels.
          Enjoy low minimum orders, guaranteed bundle pack margins, and 60-day payment terms.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <LocalizedClientLink
            href="/store"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-charcoal-900 text-white font-medium text-sm hover:bg-stone-800 transition shadow-sm text-center"
          >
            Explore Wholesale Catalog
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/account"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border border-stone-300 text-charcoal-900 font-medium text-sm hover:bg-sand-50 transition text-center"
          >
            Register for Wholesale Pricing
          </LocalizedClientLink>
        </div>

        {/* Trust Badges / Stats Bar (Faire-style) */}
        <div className="mt-16 pt-10 border-t border-stone-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 w-full max-w-4xl text-left">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-1">
              Minimum Orders
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-charcoal-900">
              From $100
            </span>
            <span className="text-xs text-stone-500 mt-0.5">
              Low barrier opening orders
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-1">
              Retail Margins
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-charcoal-900">
              55% – 70%
            </span>
            <span className="text-xs text-stone-500 mt-0.5">
              High-margin wholesale packs
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-1">
              Payment Terms
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-charcoal-900">
              Net 60 Terms
            </span>
            <span className="text-xs text-stone-500 mt-0.5">
              Buy now, pay 60 days later
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-1">
              Direct Sourcing
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-charcoal-900">
              Verified Makers
            </span>
            <span className="text-xs text-stone-500 mt-0.5">
              Zero middlemen markups
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
