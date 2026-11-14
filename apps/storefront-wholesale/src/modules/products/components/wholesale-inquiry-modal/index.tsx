"use client"

import { Dialog, Transition } from "@headlessui/react"
import { Button, Heading, Input, Label, Text } from "@medusajs/ui"
import React, { Fragment, useEffect, useMemo, useState } from "react"
import { submitWholesaleInquiry } from "@lib/data/inquiries"
import { formatPackBreakdown, parsePackBreakdown } from "@lib/util/pack"

export interface WholesaleInquiryModalProps {
  isOpen: boolean
  close: () => void
  productId: string
  productTitle: string
  variantId?: string | null
  sellerId?: string | null
  sellerName?: string | null
  isTenant?: boolean
  packName?: string | null
  packBreakdown?: string | Record<string, number> | null
  bundleSize?: number | null
  selectedPacks?: number | null
  selectedSummary?: string | null
  initialQuantity?: number | null
  initialNotes?: string | null
}

export default function WholesaleInquiryModal({
  isOpen,
  close,
  productId,
  productTitle,
  variantId,
  sellerId,
  sellerName,
  isTenant,
  packName,
  packBreakdown,
  bundleSize,
  selectedPacks,
  selectedSummary,
  initialQuantity,
  initialNotes,
}: WholesaleInquiryModalProps) {
  const [storeName, setStoreName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [location, setLocation] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)

  const parsedBreakdown = useMemo(() => {
    return parsePackBreakdown(packBreakdown)
  }, [packBreakdown])

  const formattedBreakdown = useMemo(() => {
    return formatPackBreakdown(parsedBreakdown)
  }, [parsedBreakdown])

  // Sync initial pre-filled values whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialQuantity && initialQuantity > 0) {
        setQuantity(String(initialQuantity))
      } else {
        setQuantity("")
      }

      if (initialNotes) {
        setNotes(initialNotes)
      } else {
        const defaultNotesParts: string[] = []
        if (packName) defaultNotesParts.push(`Pack: ${packName}`)
        if (formattedBreakdown) defaultNotesParts.push(`Breakdown: ${formattedBreakdown}`)
        if (bundleSize && bundleSize > 1) defaultNotesParts.push(`Pack size: ${bundleSize} pcs`)
        if (selectedPacks && selectedPacks > 0) defaultNotesParts.push(`Requested packs: ${selectedPacks}`)

        if (defaultNotesParts.length > 0) {
          setNotes(`Quote request for ${defaultNotesParts.join(" • ")}`)
        } else {
          setNotes("")
        }
      }
    }
  }, [
    isOpen,
    initialQuantity,
    initialNotes,
    packName,
    formattedBreakdown,
    bundleSize,
    selectedPacks,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!storeName.trim()) {
      setErrorMessage("Please enter your Store or Business Name")
      return
    }
    if (!contactNumber.trim() || contactNumber.trim().length < 8) {
      setErrorMessage("Please enter a valid Phone / WhatsApp number")
      return
    }
    if (!location.trim()) {
      setErrorMessage("Please enter your City / Pincode")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await submitWholesaleInquiry({
        store_name: storeName.trim(),
        contact_number: contactNumber.trim(),
        location: location.trim(),
        product_id: productId,
        variant_id: variantId || null,
        seller_id: sellerId || null,
        source_domain: typeof window !== "undefined" ? window.location.hostname : null,
        quantity: quantity ? parseInt(quantity, 10) : null,
        notes: notes.trim() || null,
      })

      if (res.success && res.whatsapp_url) {
        setWhatsappUrl(res.whatsapp_url)
        window.open(res.whatsapp_url, "_blank")
      } else {
        setErrorMessage(res.error || "Failed to submit inquiry. Please try again.")
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setWhatsappUrl(null)
    setErrorMessage(null)
    close()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[80] font-sans" onClose={handleModalClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 sm:p-7 text-left align-middle shadow-2xl transition-all border border-stone-200">
                {!whatsappUrl ? (
                  <>
                    <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 border border-forest-700/20 px-2.5 py-0.5 rounded-full inline-block">
                          {isTenant && sellerName
                            ? `Quote Direct from ${sellerName}`
                            : "B2B Wholesale Trade Quote"}
                        </span>
                        <Heading level="h3" className="font-serif text-xl font-bold text-charcoal-900 mt-1.5">
                          Request a Wholesale Quote
                        </Heading>
                      </div>
                      <button
                        onClick={handleModalClose}
                        className="text-stone-400 hover:text-charcoal-900 text-2xl p-1 leading-none rounded-lg transition"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Pre-filled Variant & Pack Specs Card */}
                    <div className="rounded-xl border border-stone-200 bg-sand-50/70 p-3.5 mt-3.5 mb-4 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-charcoal-900">
                          {productTitle}
                        </span>
                        {bundleSize && bundleSize > 1 ? (
                          <span className="text-[10px] font-bold text-charcoal-900 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                            {bundleSize} pcs / pack
                          </span>
                        ) : null}
                      </div>

                      {packName && (
                        <div className="text-[11px] text-stone-700 font-medium mt-1.5 flex items-center gap-1.5">
                          <span className="text-stone-500">Pack:</span>
                          <span className="font-bold text-charcoal-900">{packName}</span>
                        </div>
                      )}

                      {formattedBreakdown && (
                        <div className="text-[11px] text-terracotta-700 font-semibold mt-1">
                          {formattedBreakdown}
                        </div>
                      )}

                      {selectedSummary && (
                        <div className="text-[11px] text-stone-600 mt-2 pt-2 border-t border-stone-200 font-medium">
                          {selectedSummary}
                        </div>
                      )}
                    </div>

                    {errorMessage && (
                      <div className="p-3 mb-3.5 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                        {errorMessage}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-y-3.5">
                      <div>
                        <Label className="text-xs font-semibold text-charcoal-900 mb-1 block">
                          Store or Business Name *
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Amber Boutique or Fab Retail Ltd."
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          required
                          disabled={isSubmitting}
                          className="rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-x-3">
                        <div>
                          <Label className="text-xs font-semibold text-charcoal-900 mb-1 block">
                            WhatsApp / Phone *
                          </Label>
                          <Input
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-charcoal-900 mb-1 block">
                            City / Pincode *
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g. Mumbai / 400001"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3">
                        <div>
                          <Label className="text-xs font-semibold text-charcoal-900 mb-1 block">
                            Requested Pieces / Qty
                          </Label>
                          <Input
                            type="number"
                            placeholder={bundleSize ? `e.g. ${bundleSize * 5}` : "e.g. 50"}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isSubmitting}
                            className="rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-charcoal-900 mb-1 block">
                            Target Lead Time / Date
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g. Within 14 days"
                            disabled={isSubmitting}
                            className="rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-charcoal-900 mb-1 block">
                          Custom Requirements / Notes
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Need bulk sample, GST billing, or custom pack ratio"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          disabled={isSubmitting}
                          className="rounded-lg text-xs"
                        />
                      </div>

                      <div className="mt-3 flex flex-col gap-y-2.5">
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full h-11 bg-charcoal-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-full shadow-xs transition"
                          isLoading={isSubmitting}
                        >
                          Submit RFQ & Open Direct WhatsApp Chat →
                        </Button>
                        <span className="text-[11px] text-center text-stone-500">
                          Direct maker communication • GST invoices & wholesale net terms supported.
                        </span>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 border border-forest-700/20 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                      ✓
                    </div>
                    <Heading level="h3" className="font-serif text-xl font-bold text-charcoal-900">
                      Quote Request Received!
                    </Heading>
                    <Text className="text-xs text-stone-600 mt-1.5 mb-5 max-w-sm mx-auto">
                      Your wholesale inquiry for{" "}
                      <strong className="text-charcoal-900">{productTitle}</strong> has been
                      logged authoritatively with the brand.
                    </Text>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full h-11 rounded-full bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs transition shadow-xs"
                    >
                      Open WhatsApp Chat Directly →
                    </a>

                    <button
                      onClick={handleModalClose}
                      className="mt-3 text-xs text-stone-500 hover:text-charcoal-900 underline"
                    >
                      Return to Product
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
