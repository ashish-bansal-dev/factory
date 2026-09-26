"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useCuratedQuote } from "@lib/context/curated-quote-context"
import { usePathname } from "next/navigation"

interface CartDrawerProps {
  cart?: HttpTypes.StoreCart | null
}

export default function CartDropdown({ cart }: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const pathname = usePathname()

  const {
    items: curatedQuoteItems,
    removeItem: removeQuoteItem,
    updateQuantity: updateQuoteQuantity,
    totalItems: curatedQuoteCount,
    totalUnits: curatedQuoteTotalUnits,
  } = useCuratedQuote()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Listen to global open drawer event (e.g. after adding from PDP)
  useEffect(() => {
    const handleOpenDrawer = () => setIsOpen(true)
    window.addEventListener("open-cart-drawer", handleOpenDrawer)
    return () => window.removeEventListener("open-cart-drawer", handleOpenDrawer)
  }, [])

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const cartItemsCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const totalItems = cartItemsCount + curatedQuoteCount

  const subtotal = cart?.subtotal ?? 0
  const currencyCode = cart?.currency_code || "inr"

  const hasCartItems = Boolean(cart?.items && cart.items.length > 0)
  const hasQuoteItems = Boolean(curatedQuoteItems && curatedQuoteItems.length > 0)

  const handleUpdateQty = async (lineId: string, newQty: number) => {
    if (newQty <= 0) {
      handleDeleteItem(lineId)
      return
    }
    setUpdatingId(lineId)
    try {
      await updateLineItem({ lineId, quantity: newQty })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteItem = async (lineId: string) => {
    setUpdatingId(lineId)
    try {
      await deleteLineItem(lineId)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSendQuoteWhatsApp = () => {
    const list = curatedQuoteItems
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productTitle} (${it.variantTitle || "Standard"}) - Qty: ${it.quantity} pcs`
      )
      .join("\n")

    const message = encodeURIComponent(
      `Hello FactoryTribe! I would like to request a wholesale quotation for:\n\n${list}\n\nPlease share factory pricing, delivery lead time, and GST quotation.`
    )

    try {
      fetch("/api/inquiry-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "cart_drawer_quote",
          items: curatedQuoteItems,
          total_units: curatedQuoteTotalUnits,
          notes: list,
        }),
      }).catch(() => {})
    } catch {}

    window.open(`https://wa.me/919782077711?text=${message}`, "_blank")
  }

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          data-testid="cart-drawer-panel"
          className="w-screen max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-300 ease-out"
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-sand-50/70">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-charcoal-900">
                Wholesale Cart
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand-100 text-charcoal-800 border border-stone-200">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-charcoal-900 hover:bg-stone-200/60 transition cursor-pointer"
              aria-label="Close cart drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {!hasCartItems && !hasQuoteItems ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center text-stone-400 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-1">
                  Your wholesale cart is empty
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mb-6">
                  Explore verified Indian fashion manufacturers and direct factory pack pricing.
                </p>
                <LocalizedClientLink
                  href="/store"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-charcoal-900 text-white text-xs font-semibold hover:bg-stone-800 transition shadow-xs"
                >
                  Browse Wholesale Catalog &rarr;
                </LocalizedClientLink>
              </div>
            ) : (
              <>
                {/* 1. Direct Checkout Cart Items */}
                {hasCartItems && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900">
                        Checkout Orders ({cart!.items!.length})
                      </span>
                      <span className="text-[10px] text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-700/20 font-semibold">
                        Ready to ship
                      </span>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {cart!.items!.map((item) => {
                        const bundleSize =
                          Number((item.metadata as any)?.bundle_size) ||
                          Number((item.variant as any)?.bundle_size) ||
                          1
                        const isUpdating = updatingId === item.id
                        const itemUnitPrice = item.unit_price || 0
                        const itemLineTotal = item.total ?? itemUnitPrice * item.quantity

                        return (
                          <div key={item.id} className="py-3.5 flex gap-3.5 items-start">
                            {/* Thumbnail */}
                            <div className="w-16 h-20 rounded-xl overflow-hidden bg-sand-50 border border-stone-200 shrink-0">
                              <Thumbnail
                                thumbnail={item.thumbnail}
                                images={item.variant?.product?.images}
                                size="square"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between min-h-[5rem]">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-xs text-charcoal-900 line-clamp-1">
                                    {item.title}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id)}
                                    disabled={isUpdating}
                                    className="text-stone-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                                    title="Remove item"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>

                                {item.variant_title && (
                                  <span className="text-[11px] text-stone-500 block">
                                    {item.variant_title}
                                  </span>
                                )}

                                {bundleSize > 1 && (
                                  <span className="inline-block text-[10px] font-semibold text-charcoal-800 bg-sand-100 px-2 py-0.5 rounded-full border border-stone-200 mt-1">
                                    Pack of {bundleSize} pcs
                                  </span>
                                )}
                              </div>

                              {/* Stepper & Price Row */}
                              <div className="flex items-center justify-between pt-2 mt-1">
                                <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(item.id, item.quantity - bundleSize)}
                                    disabled={isUpdating}
                                    className="w-7 h-7 flex items-center justify-center text-charcoal-900 hover:bg-sand-50 disabled:opacity-30 text-sm font-bold"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center text-xs font-bold text-charcoal-900">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(item.id, item.quantity + bundleSize)}
                                    disabled={isUpdating}
                                    className="w-7 h-7 flex items-center justify-center text-charcoal-900 hover:bg-sand-50 disabled:opacity-30 text-sm font-bold"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-right">
                                  <span className="font-bold text-xs text-charcoal-900 block">
                                    {convertToLocale({
                                      amount: itemLineTotal,
                                      currency_code: currencyCode,
                                    })}
                                  </span>
                                  <span className="text-[10px] text-stone-500">
                                    {convertToLocale({
                                      amount: itemUnitPrice,
                                      currency_code: currencyCode,
                                    })}
                                    /pc
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Curated Quote / Custom Production Items */}
                {hasQuoteItems && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-terracotta-600 inline-block" />
                        <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900">
                          Quote Requests ({curatedQuoteItems.length})
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-terracotta-700 bg-terracotta-50 px-2 py-0.5 rounded-full border border-terracotta-200">
                        Zero Upfront Payment
                      </span>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {curatedQuoteItems.map((quoteItem) => (
                        <div key={quoteItem.id} className="py-3.5 flex gap-3.5 items-start bg-sand-50/40 p-3 rounded-xl border border-stone-200/70 mb-2">
                          {/* Thumbnail */}
                          <div className="w-16 h-20 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0 relative">
                            {quoteItem.thumbnail ? (
                              <img
                                src={quoteItem.thumbnail}
                                alt={quoteItem.productTitle}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300 font-serif text-xs">
                                Quote
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 flex flex-col justify-between min-h-[5rem]">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-xs text-charcoal-900 line-clamp-1">
                                  {quoteItem.productTitle}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => removeQuoteItem(quoteItem.id)}
                                  className="text-stone-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                                  title="Remove quote item"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>

                              {quoteItem.variantTitle && (
                                <span className="text-[11px] text-stone-500 block">
                                  Option: {quoteItem.variantTitle}
                                </span>
                              )}

                              {quoteItem.sellerName && (
                                <span className="text-[10px] text-stone-400 block mt-0.5">
                                  Maker: {quoteItem.sellerName}
                                </span>
                              )}
                            </div>

                            {/* Stepper & Status Row */}
                            <div className="flex items-center justify-between pt-2 mt-1">
                              <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => updateQuoteQuantity(quoteItem.id, quoteItem.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center text-charcoal-900 hover:bg-sand-50 text-sm font-bold"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-charcoal-900">
                                  {quoteItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuoteQuantity(quoteItem.id, quoteItem.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center text-charcoal-900 hover:bg-sand-50 text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right">
                                <span className="text-[11px] font-semibold text-terracotta-700 bg-terracotta-50 px-2 py-0.5 rounded-full border border-terracotta-200 inline-block">
                                  Quote on WhatsApp
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dedicated WhatsApp Quote CTA */}
                    <button
                      type="button"
                      onClick={handleSendQuoteWhatsApp}
                      className="w-full h-11 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.053-1.637-.362-.977-.406-1.603-1.399-1.651-1.464-.049-.064-.405-.538-.405-1.026 0-.488.256-.729.346-.827.091-.098.199-.122.265-.122.066 0 .132.001.189.004.06.002.141-.023.22.167.083.199.281.684.306.734.025.049.041.107.008.173-.033.065-.05.106-.099.163-.049.057-.104.128-.148.172-.049.049-.1.103-.043.201.057.098.254.419.546.679.375.335.691.439.789.488.098.049.156.041.214-.025.058-.066.248-.29.314-.389.066-.098.132-.082.222-.049.091.033.578.272.677.322.099.049.165.074.19.115.025.041.025.24-.119.645z" />
                      </svg>
                      <span>Request Quote via WhatsApp ({curatedQuoteTotalUnits} pcs) &rarr;</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drawer Footer for Checkout Items */}
          {hasCartItems && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-sand-50/70 flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-stone-600">
                  Cart Subtotal
                </span>
                <span className="font-serif text-xl font-bold text-charcoal-900">
                  {convertToLocale({
                    amount: subtotal,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>

              <p className="text-[11px] text-stone-500 leading-tight">
                GST Input Tax Credit & Net 60 financing options verified at checkout.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <LocalizedClientLink
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-11 rounded-full border border-stone-300 bg-white text-charcoal-900 hover:bg-sand-50 text-xs font-semibold flex items-center justify-center transition shadow-xs text-center"
                >
                  View Cart
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-11 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 text-xs font-semibold flex items-center justify-center transition shadow-xs text-center"
                >
                  Checkout &rarr;
                </LocalizedClientLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative font-sans">
      {/* Cart Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center gap-2 h-10 px-3 sm:px-3.5 rounded-full border border-stone-300 bg-sand-50/80 hover:bg-white text-charcoal-900 transition shadow-xs active:scale-95 cursor-pointer"
        aria-label="Open wholesale cart drawer"
        data-testid="nav-cart-link"
      >
        {/* Shopping Bag Icon */}
        <svg
          className="w-5 h-5 text-charcoal-900"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>

        <span className="hidden sm:inline-block text-xs font-semibold text-charcoal-900">
          Cart
        </span>

        {/* High-Contrast Badge */}
        {totalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-terracotta-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-xs border-2 border-white animate-in zoom-in-50 duration-150">
            {totalItems}
          </span>
        )}
      </button>

      {/* Render Slide-over Drawer directly on document.body using portal */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(drawerContent, document.body)}
    </div>
  )
}
