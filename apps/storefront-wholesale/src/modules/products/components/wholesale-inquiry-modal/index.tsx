"use client"

import { Dialog, Transition } from "@headlessui/react"
import { Button, Heading, Input, Label, Text } from "@medusajs/ui"
import React, { Fragment, useState } from "react"
import { submitWholesaleInquiry } from "@lib/data/inquiries"

interface WholesaleInquiryModalProps {
  isOpen: boolean
  close: () => void
  productId: string
  productTitle: string
  variantId?: string
  sellerId?: string
  sellerName?: string
  isTenant?: boolean
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
}: WholesaleInquiryModalProps) {
  const [storeName, setStoreName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [location, setLocation] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)

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
        // Attempt immediate redirect/open
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
      <Dialog as="div" className="relative z-[80]" onClose={handleModalClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-ui-border-base">
                {!whatsappUrl ? (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-ui-border-subtle">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {isTenant && sellerName ? `Connect with ${sellerName}` : "Wholesale Sourcing"}
                        </span>
                        <Heading level="h3" className="text-lg font-bold text-ui-fg-base mt-1">
                          Direct WhatsApp Inquiry
                        </Heading>
                      </div>
                      <button
                        onClick={handleModalClose}
                        className="text-ui-fg-muted hover:text-ui-fg-base text-xl p-1 leading-none"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-ui-fg-subtle mt-2 mb-4">
                      Inquiring for: <strong className="text-ui-fg-base">{productTitle}</strong>.
                      Share your business details to receive wholesale trade prices and catalog.
                    </p>

                    {errorMessage && (
                      <div className="p-2.5 mb-3 text-xs rounded bg-rose-50 border border-rose-200 text-rose-700">
                        {errorMessage}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
                      <div>
                        <Label className="text-xs font-medium text-ui-fg-subtle mb-1 block">
                          Store / Business Name *
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Apex Fashion Store"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-x-2">
                        <div>
                          <Label className="text-xs font-medium text-ui-fg-subtle mb-1 block">
                            WhatsApp / Phone *
                          </Label>
                          <Input
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-ui-fg-subtle mb-1 block">
                            City / Pincode *
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g. Surat / 395002"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2">
                        <div>
                          <Label className="text-xs font-medium text-ui-fg-subtle mb-1 block">
                            Expected Quantity
                          </Label>
                          <Input
                            type="number"
                            placeholder="e.g. 50"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-ui-fg-subtle mb-1 block">
                            Requirement Notes
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g. Need bulk sample"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-y-2">
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          isLoading={isSubmitting}
                        >
                          Send Inquiry & Open WhatsApp →
                        </Button>
                        <span className="text-[11px] text-center text-ui-fg-muted">
                          Your contact is kept confidential between you and the verified brand/supplier.
                        </span>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                      ✓
                    </div>
                    <Heading level="h3" className="text-lg font-bold text-ui-fg-base">
                      Inquiry Recorded!
                    </Heading>
                    <Text className="text-xs text-ui-fg-subtle mt-1 mb-5">
                      Your inquiry has been stored in our wholesale network.
                    </Text>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full h-11 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition"
                    >
                      Open WhatsApp Chat
                    </a>

                    <button
                      onClick={handleModalClose}
                      className="mt-3 text-xs text-ui-fg-muted hover:text-ui-fg-base underline"
                    >
                      Close
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
