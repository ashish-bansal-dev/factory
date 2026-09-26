"use client"

import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"

interface BrandTrustCardProps {
  seller?: {
    id: string
    name: string
    handle: string
    logo?: string | null
    description?: string | null
    metadata?: Record<string, any> | null
  } | null
  productId: string
  productTitle: string
}

export default function BrandTrustCard({
  seller,
}: BrandTrustCardProps) {
  const brandName = seller?.name || "Verified Wholesale Brand"
  const brandHandle = seller?.handle || ""
  const mov = Number(seller?.metadata?.minimum_order_value) || Number(seller?.metadata?.mov) || 0

  return (
    <div className="rounded-2xl border border-stone-200 bg-sand-50/70 p-4 sm:p-5 font-sans">
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-stone-200/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center overflow-hidden font-serif font-bold text-sm text-charcoal-900 shadow-xs">
            {seller?.logo ? (
              <img
                src={seller.logo}
                alt={brandName}
                className="w-full h-full object-cover"
              />
            ) : (
              brandName.slice(0, 2).toUpperCase()
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {brandHandle ? (
                <LocalizedClientLink
                  href={`/sellers/${brandHandle}`}
                  className="font-serif text-base sm:text-lg font-bold text-charcoal-900 hover:text-terracotta-600 transition"
                >
                  {brandName}
                </LocalizedClientLink>
              ) : (
                <span className="font-serif text-base sm:text-lg font-bold text-charcoal-900">
                  {brandName}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-forest-700 bg-forest-50 border border-forest-700/20 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 text-forest-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Maker
              </span>
            </div>
            <span className="text-xs text-stone-500 block mt-0.5">
              Direct manufacturer • Ships within 2-4 business days across India
            </span>
          </div>
        </div>
      </div>

      {/* Indian Market Wholesale Trust Badges */}
      <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-stone-600">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-700 inline-block shrink-0" />
          {mov > 0 ? (
            <span>
              <strong className="font-semibold text-charcoal-900">
                {convertToLocale({ amount: mov, currency_code: "INR" })}
              </strong>{" "}
              Min. Order
            </span>
          ) : (
            <span>
              <strong className="font-semibold text-charcoal-900">Pack Sourcing</strong> • No MOV
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600 inline-block shrink-0" />
          <span><strong className="font-semibold text-charcoal-900">GST Invoice</strong> • Net Terms</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block shrink-0" />
          <span>Verified Factory QC</span>
        </div>
      </div>
    </div>
  )
}
