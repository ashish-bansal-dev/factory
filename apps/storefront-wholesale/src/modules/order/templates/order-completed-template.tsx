import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>Thank you!</span>
            <span>Your wholesale order was placed successfully.</span>
          </Heading>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-2">
            <div className="flex flex-col gap-y-1">
              <div className="font-semibold text-sm flex items-center gap-1.5 text-emerald-800">
                <span>Wholesale Quote / Order Submitted (Zero Upfront Payment)</span>
              </div>
              <p className="text-xs text-emerald-700">
                Your order has been recorded with zero upfront payment. The supplier will review your order details, generate your invoice, and coordinate payment and delivery terms.
              </p>
            </div>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_PHONE || "919782077711"}?text=${encodeURIComponent(
                `Hello! I just placed wholesale order #${order.display_id || order.id} on FactoryTribe. Let's connect regarding the invoice, GST details, and delivery schedule.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold whitespace-nowrap transition shadow-sm"
              data-testid="order-complete-whatsapp-button"
            >
              Connect with Seller on WhatsApp →
            </a>
          </div>

          <OrderDetails order={order} />
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Summary
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
