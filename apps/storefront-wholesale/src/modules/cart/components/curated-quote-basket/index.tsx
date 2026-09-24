"use client"

import { useCuratedQuote } from "@lib/context/curated-quote-context"
import { submitWholesaleInquiry } from "@lib/data/inquiries"
import { Badge, Button, Heading, Input, Label, Text, clx } from "@medusajs/ui"
import Image from "next/image"
import React, { useState } from "react"

export default function CuratedQuoteBasket() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearQuoteCart,
    totalUnits,
    totalItems,
  } = useCuratedQuote()

  const [storeName, setStoreName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null)

  if (items.length === 0) {
    return null
  }

  const buildQuoteMessage = () => {
    const itemsList = items
      .map((item, idx) => {
        const variantText = item.variantTitle ? ` (${item.variantTitle})` : ""
        const skuText = item.sku ? ` [SKU: ${item.sku}]` : ""
        return `${idx + 1}. ${item.productTitle}${variantText}${skuText} - Desired Qty: ${item.quantity}`
      })
      .join("\n")

    const details = [
      storeName ? `Store / Business: ${storeName}` : null,
      contactNumber ? `Contact: ${contactNumber}` : null,
      location ? `Location: ${location}` : null,
      notes ? `Target Price / Notes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    return `Hello! I am requesting a wholesale quote for the following curated catalog items:\n\n${itemsList}\n\nTotal Desired Units: ${totalUnits}\n\n${details}\n\nPlease share your best wholesale pricing, MOQs, and lead times.`
  }

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!storeName.trim()) {
      setFeedback({ message: "Please enter your Store or Business name", type: "error" })
      return
    }
    if (!contactNumber.trim() || contactNumber.trim().length < 8) {
      setFeedback({ message: "Please enter a valid Phone / WhatsApp number", type: "error" })
      return
    }
    if (!location.trim()) {
      setFeedback({ message: "Please enter your City / Location", type: "error" })
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Log lead in Mercur inquiries if at least one product has an ID
      const firstItem = items[0]
      const compiledNotes = buildQuoteMessage()

      if (firstItem?.productId) {
        await submitWholesaleInquiry({
          store_name: storeName.trim(),
          contact_number: contactNumber.trim(),
          location: location.trim(),
          product_id: firstItem.productId,
          variant_id: firstItem.variantId ?? null,
          seller_id: firstItem.sellerId ?? null,
          notes: compiledNotes,
          quantity: totalUnits,
        }).catch((err) => console.warn("Failed to log inquiry backend lead:", err))
      }

      // 2. Open WhatsApp with pre-formatted quote
      const targetPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_PHONE || "919999999999"
      const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(compiledNotes)}`
      window.open(url, "_blank")

      setFeedback({
        message: "Quote request generated! WhatsApp chat opened with your curated items.",
        type: "success",
      })
    } catch (err: any) {
      setFeedback({ message: err?.message || "Failed to dispatch quote", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-6 bg-white border border-ui-border-base rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ui-border-base gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
              Curated Quote & Interest Basket
            </Heading>
            <Badge color="purple" size="small">
              {totalItems} {totalItems === 1 ? "Product" : "Products"} ({totalUnits} units)
            </Badge>
          </div>
          <p className="text-xs text-ui-fg-muted mt-1">
            Catalog products and default variants compiled for wholesale supplier quotation.
          </p>
        </div>

        <button
          type="button"
          onClick={clearQuoteCart}
          className="text-xs text-red-600 hover:text-red-700 font-medium self-start sm:self-auto underline"
        >
          Clear Basket
        </button>
      </div>

      {feedback && (
        <div
          className={clx(
            "text-xs p-3 rounded-lg border font-medium",
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Items List */}
      <div className="divide-y divide-ui-border-subtle">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-ui-bg-subtle rounded-lg overflow-hidden relative shrink-0 border border-ui-border-base">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.productTitle}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ui-fg-muted text-xs">
                    📦
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-ui-fg-base">
                  {item.productTitle}
                </span>
                <span className="text-xs text-ui-fg-muted">
                  {item.variantTitle || "Default Variant"}
                  {item.sku && ` • SKU: ${item.sku}`}
                </span>
                <span className="text-[11px] text-amber-700 font-medium mt-0.5">
                  Awaiting Wholesale Quote
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              {/* Stepper */}
              <div className="flex items-center border border-ui-border-base rounded bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="px-2.5 py-1 text-ui-fg-subtle hover:bg-ui-bg-subtle text-xs font-bold transition"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.id, parseInt(e.target.value, 10) || 1)
                  }
                  className="w-12 text-center text-xs py-1 font-bold text-ui-fg-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-2.5 py-1 text-ui-fg-subtle hover:bg-ui-bg-subtle text-xs font-bold transition"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-xs text-ui-fg-muted hover:text-red-600 transition"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Quote Form */}
      <form
        onSubmit={handleSendWhatsApp}
        className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 sm:p-5 flex flex-col gap-y-4 mt-2"
      >
        <div>
          <span className="font-bold text-sm text-emerald-950 block">
            Send Curated Interest to Suppliers & Marketplace
          </span>
          <p className="text-xs text-emerald-800 mt-0.5">
            Fill your store details to send this curated multi-product quote request directly to vendors via WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-[11px] font-semibold text-emerald-900 mb-1">
              Store / Business Name *
            </Label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Apex Traders"
              required
              className="bg-white text-xs h-9"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-emerald-900 mb-1">
              WhatsApp / Phone *
            </Label>
            <Input
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              required
              className="bg-white text-xs h-9"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-emerald-900 mb-1">
              City / Location *
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Surat, Gujarat"
              required
              className="bg-white text-xs h-9"
            />
          </div>
        </div>

        <div>
          <Label className="text-[11px] font-semibold text-emerald-900 mb-1">
            Target Price / Special Requirements (Optional)
          </Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Looking for target price under $12/unit, delivery required in 2 weeks"
            className="bg-white text-xs h-9"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-emerald-200">
          <span className="text-xs text-emerald-900 font-medium">
            Curated: <strong>{totalItems}</strong> products • <strong>{totalUnits}</strong> total desired units
          </span>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2"
          >
            <span>Send Curated Cart to Suppliers (WhatsApp) →</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
