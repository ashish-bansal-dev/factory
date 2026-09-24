"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
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

const Summary = ({ cart }: SummaryProps) => {
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

    const targetPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_PHONE || "919999999999"
    window.open(`https://wa.me/${targetPhone}?text=${message}`, "_blank")
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />

      <div className="flex flex-col gap-y-2 pt-2">
        <LocalizedClientLink
          href={"/checkout?step=" + step}
          data-testid="checkout-button"
          className="w-full"
        >
          <Button className="w-full h-11 text-sm font-semibold" size="large">
            Order / Submit Quote (No Payment Required) →
          </Button>
        </LocalizedClientLink>
        <p className="text-[11px] text-ui-fg-muted text-center">
          Zero upfront payment required. Place order directly under wholesale net terms.
        </p>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-ui-border-base"></div>
          <span className="flex-shrink mx-2 text-[10px] text-ui-fg-muted uppercase tracking-wider font-semibold">
            or
          </span>
          <div className="flex-grow border-t border-ui-border-base"></div>
        </div>

        <Button
          variant="secondary"
          className="w-full h-10 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-medium text-xs flex items-center justify-center gap-1.5"
          onClick={handleSendWhatsAppQuote}
          data-testid="send-quote-whatsapp-button"
        >
          <span>Send Quote to Seller via WhatsApp →</span>
        </Button>
      </div>
    </div>
  )
}

export default Summary
