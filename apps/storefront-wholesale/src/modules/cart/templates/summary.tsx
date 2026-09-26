"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

export default function Summary({ cart }: SummaryProps) {
  const step = getCheckoutStep(cart)

  const handleSendWhatsAppQuote = () => {
    const itemsList = (cart.items || [])
      .map((item, idx) => {
        const variantTitle = item.variant_title ? ` (${item.variant_title})` : ""
        return `${idx + 1}. ${item.title}${variantTitle} - Qty: ${item.quantity}`
      })
      .join("\n")

    const totalStr =
      cart.total != null
        ? convertToLocale({
            amount: cart.total,
            currency_code: cart.currency_code,
          })
        : ""

    const message = encodeURIComponent(
      `Hello! I would like to request a wholesale quote for the following items:\n\n${itemsList}\n\nEstimated Total: ${totalStr}\n\nPlease share your wholesale invoice, payment terms, and delivery timeline.`
    )

    const targetPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_PHONE || "919782077711"
    window.open(`https://wa.me/${targetPhone}?text=${message}`, "_blank")
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col gap-y-5 font-sans">
      <h2 className="font-serif text-2xl font-bold text-charcoal-900">
        Order Summary
      </h2>

      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />

      {/* Net 60 Terms / B2B Badge */}
      <div className="bg-sand-50 border border-stone-200/90 rounded-xl p-3.5 flex items-start gap-3 text-xs text-stone-600">
        <span className="w-2 h-2 rounded-full bg-forest-700 mt-1 shrink-0" />
        <div>
          <span className="font-semibold text-charcoal-900 block mb-0.5">
            Wholesale Net 60 Terms Eligible
          </span>
          <span>
            Pay on invoice with 60 days financing after delivery upon credit verification.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-y-3 pt-2">
        <LocalizedClientLink
          href={"/checkout?step=" + step}
          data-testid="checkout-button"
          className="w-full"
        >
          <button
            type="button"
            className="w-full h-12 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>Proceed to Wholesale Checkout &rarr;</span>
          </button>
        </LocalizedClientLink>

        <button
          type="button"
          className="w-full h-11 rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-sand-50 font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm"
          onClick={handleSendWhatsAppQuote}
          data-testid="send-quote-whatsapp-button"
        >
          <span>Request Invoice / Quote via WhatsApp &rarr;</span>
        </button>
      </div>
    </div>
  )
}
