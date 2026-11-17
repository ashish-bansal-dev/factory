"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import WholesaleInquiryModal from "../wholesale-inquiry-modal"

interface WholesaleConnectActionsProps {
  product: HttpTypes.StoreProduct
  seller?: {
    id: string
    name: string
    handle?: string
    phone?: string | null
    [key: string]: any
  } | null
  isTenant?: boolean
}

export default function WholesaleConnectActions({
  product,
  seller,
  isTenant,
}: WholesaleConnectActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const sellerPhone = ((seller?.phone || "919782077711").replace(/[^0-9]/g, "")) || "919782077711"
  const sellerName = seller?.name || "Manufacturer"

  const whatsappText = encodeURIComponent(
    `Hello! I am inquiring about wholesale quotation and availability for "${product.title}" on FactoryTribe Wholesale.`
  )
  const whatsappUrl = `https://wa.me/${sellerPhone}?text=${whatsappText}`

  return (
    <div className="flex flex-col gap-y-4 font-sans">
      {/* Desktop & Tablet Unified Connect Actions Box */}
      <div className="rounded-2xl border border-stone-200 bg-sand-50/80 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-forest-700 inline-block" />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-charcoal-900">
              Direct Wholesale Inquiries & Orders
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Connect directly with {sellerName} for pack orders, customized quantities, and official quotation.
          </p>
        </div>

        {/* Dual Primary Connect Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* 1. Request Wholesale Quote Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-6 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 text-sm font-bold shadow-xs transition flex items-center justify-center gap-2.5 active:scale-98"
          >
            <svg
              className="w-4 h-4 text-terracotta-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span>Request Wholesale Quote</span>
          </button>

          {/* 2. Direct WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-6 rounded-full bg-forest-800 text-white hover:bg-forest-900 text-sm font-bold shadow-xs transition flex items-center justify-center gap-2.5 active:scale-98"
          >
            <svg className="w-4 h-4 fill-current text-emerald-400" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.075-1.02-.053-.404-.134-.925-.331-1.609-.645-1.503-.687-2.484-2.222-2.56-2.325-.074-.103-.615-.818-.615-1.56 0-.742.389-1.107.527-1.258.138-.151.3-.189.4-.189.102 0 .204.002.294.006.096.004.225-.036.352.27.13.312.443 1.08.482 1.159.039.078.065.17.013.272-.051.102-.077.166-.153.255-.077.089-.161.198-.231.266-.077.075-.157.157-.068.31.09.153.397.654.852 1.059.585.521 1.079.683 1.233.76.154.077.244.064.334-.039.09-.102.385-.45.488-.604.102-.153.205-.128.346-.076.14.051.897.423 1.05.5.153.077.256.115.294.18.038.064.038.372-.106.777z"/>
            </svg>
            <span>Connect on WhatsApp</span>
          </a>
        </div>

        {/* Wholesale Reassurance Trust Strip */}
        <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500 flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            Quick Response Guarantee
          </span>
          <span>•</span>
          <span>Direct Manufacturer GST Invoice</span>
          <span>•</span>
          <span>Pan-India Transport Delivery</span>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 sm:hidden shadow-xl flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider truncate">
            Direct Inquiry
          </span>
          <span className="font-bold text-sm text-charcoal-900 truncate">
            {product.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-full bg-charcoal-900 text-white text-xs font-bold shadow-xs active:bg-stone-800"
          >
            Request Quote
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-3.5 rounded-full bg-forest-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            aria-label="Connect on WhatsApp"
          >
            <svg className="w-3.5 h-3.5 fill-current text-emerald-400" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.075-1.02-.053-.404-.134-.925-.331-1.609-.645-1.503-.687-2.484-2.222-2.56-2.325-.074-.103-.615-.818-.615-1.56 0-.742.389-1.107.527-1.258.138-.151.3-.189.4-.189.102 0 .204.002.294.006.096.004.225-.036.352.27.13.312.443 1.08.482 1.159.039.078.065.17.013.272-.051.102-.077.166-.153.255-.077.089-.161.198-.231.266-.077.075-.157.157-.068.31.09.153.397.654.852 1.059.585.521 1.079.683 1.233.76.154.077.244.064.334-.039.09-.102.385-.45.488-.604.102-.153.205-.128.346-.076.14.051.897.423 1.05.5.153.077.256.115.294.18.038.064.038.372-.106.777z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Interactive Wholesale Quote / RFQ Modal */}
      <WholesaleInquiryModal
        isOpen={isModalOpen}
        close={() => setIsModalOpen(false)}
        productId={product.id}
        productTitle={product.title}
        sellerId={seller?.id || (product as any).seller_id || null}
        sellerName={sellerName}
        isTenant={isTenant}
      />
    </div>
  )
}
