"use client"

import { useCuratedQuote } from "@lib/context/curated-quote-context"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import CuratedQuoteBasket from "../components/curated-quote-basket"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import ItemsTemplate from "./items"
import Summary from "./summary"

interface CartContentProps {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}

export default function CartContent({ cart, customer }: CartContentProps) {
  const { totalItems: totalCuratedItems } = useCuratedQuote()
  const hasCartItems = Boolean(cart?.items && cart.items.length > 0)
  const hasCuratedItems = totalCuratedItems > 0

  if (!hasCartItems && !hasCuratedItems) {
    return <EmptyCartMessage />
  }

  return (
    <div className="flex flex-col gap-y-12">
      {/* 1. Standard Priced Orders (Zero Upfront Payment / Net Terms) */}
      {hasCartItems && (
        <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-12 lg:gap-x-24">
          <div className="flex flex-col bg-white py-6 gap-y-6">
            {!customer && (
              <>
                <SignInPrompt />
                <Divider />
              </>
            )}
            <ItemsTemplate cart={cart!} />
          </div>
          <div className="relative">
            <div className="flex flex-col gap-y-8 sticky top-12">
              {cart && cart.region && (
                <div className="bg-white py-6">
                  <Summary cart={cart as any} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Curated Quote & Catalog Inquiries */}
      {hasCuratedItems && (
        <div className="w-full">
          <CuratedQuoteBasket />
        </div>
      )}
    </div>
  )
}
