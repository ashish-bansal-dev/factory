"use client"

import { useState } from "react"
import { Button } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"
import { ProductVariants } from "@/components/molecules"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { convertToLocale } from "@/lib/helpers/money"
import {
  getBuyboxWinner,
  getOfferAmount,
  getOfferStock,
  getVariantOffers,
  isPurchasable,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { Chat } from "@/components/organisms/Chat/Chat"
import { CompareOffersModal } from "@/components/organisms/CompareOffersModal/CompareOffersModal"
import { SellerDTO } from "@mercurjs/types"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce(
    (
      acc: Record<string, string>,
      varopt: HttpTypes.StoreProductOptionValue
    ) => {
      acc[varopt.option?.title.toLowerCase() || ""] = varopt.value

      return acc
    },
    {}
  )
}

export const ProductDetailsHeader = ({
  product,
  locale,
  user,
  offers = [],
  seller,
}: {
  product: HttpTypes.StoreProduct
  locale: string
  user: HttpTypes.StoreCustomer | null
  offers?: StoreOffer[]
  seller?: SellerDTO
}) => {
  const { addToCart, onAddToCart, cart, isAddingItem } = useCartContext()
  const { allSearchParams } = useGetAllSearchParams()
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product,
  })

  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  const selectedVariant = hasAnyPrice
    ? {
        ...optionsAsKeymap(cheapestVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  const variantId =
    product.variants?.find(({ options }: { options?: HttpTypes.StoreProductOptionValue[] | null }) =>
      options?.every((option: HttpTypes.StoreProductOptionValue) =>
        selectedVariant[option.option?.title?.toLowerCase() || ""]?.includes(
          option.value || ""
        )
      )
    )?.id || ""

  const { variantPrice } = getProductPrice({
    product,
    variantId,
  })

  // Buybox: the winning offer for the selected variant sets the price shown and
  // the offer that add-to-cart uses. Products are sold through offers, not the
  // variant's base price.
  const variantOffers = getVariantOffers(offers, variantId)
  const winnerOffer = getBuyboxWinner(variantOffers)
  const otherOffersCount = Math.max(variantOffers.length - 1, 0)

  const offerAmount = winnerOffer ? getOfferAmount(winnerOffer) : null
  const offerCurrency =
    winnerOffer?.calculated_price?.currency_code ||
    variantPrice?.currency_code ||
    "eur"
  const offerStock = winnerOffer ? getOfferStock(winnerOffer) : 0
  const hasOffer = !!winnerOffer && offerAmount !== null

  const displayPrice = hasOffer
    ? convertToLocale({ amount: offerAmount as number, currency_code: offerCurrency })
    : variantPrice?.calculated_price

  const offerMrp = winnerOffer?.mrp != null ? Number(winnerOffer.mrp) : null
  const hasSavings = offerMrp !== null && offerAmount !== null && offerMrp > offerAmount
  const savingsAmount = hasSavings ? offerMrp - offerAmount : 0
  const savingsPercent = hasSavings && offerMrp > 0 ? Math.round((savingsAmount / offerMrp) * 100) : 0

  const quantityInCart =
    cart?.items?.find((item) => item.metadata?.offer_id === winnerOffer?.id)
      ?.quantity ?? 0
  const isStockMaxLimitReached =
    !winnerOffer?.allow_backorder &&
    winnerOffer?.manage_inventory !== false &&
    quantityInCart >= offerStock

  const isPurchasableOffer = winnerOffer ? isPurchasable(winnerOffer) : false

  const isAddToCartDisabled =
    !hasOffer || !isPurchasableOffer || isStockMaxLimitReached

  const handleAddToCart = async () => {
    if (!winnerOffer || isAddToCartDisabled) return

    const total = offerAmount as number
    const subtotal =
      winnerOffer.calculated_price?.calculated_amount_without_tax ?? total

    const storeCartLineItem = {
      thumbnail: product.thumbnail || "",
      product_title: product.title,
      quantity: 1,
      subtotal,
      total,
      tax_total: total - subtotal,
      variant_id: variantId,
      product_id: product.id,
      variant: product.variants?.find(({ id }) => id === variantId),
      metadata: { offer_id: winnerOffer.id },
    }

    onAddToCart(storeCartLineItem, offerCurrency)

    try {
      await addToCart({
        offerId: winnerOffer.id,
        quantity: 1,
        countryCode: locale,
      })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "This offer does not have the required inventory",
      })
    }
  }

  return (
    <div className="border rounded-sm p-5" data-testid="product-details-header">
      <div className="flex justify-between">
        <div>
          <h1 className="heading-lg text-primary" data-testid="product-title">{product.title}</h1>
          <div className="mt-2 flex flex-col gap-1" data-testid="product-price-container">
            {hasOffer ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="heading-md text-primary" data-testid="product-price-current">
                    {displayPrice}
                  </span>
                  {hasSavings && (
                    <span
                      className="text-sm text-secondary line-through"
                      data-testid="product-price-mrp"
                    >
                      {convertToLocale({ amount: offerMrp, currency_code: offerCurrency })}
                    </span>
                  )}
                </div>
                {hasSavings && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded w-fit"
                    data-testid="product-price-savings"
                  >
                    <span>{savingsPercent}% OFF</span>
                    <span className="text-emerald-500 font-normal">·</span>
                    <span>Save {convertToLocale({ amount: savingsAmount, currency_code: offerCurrency })}</span>
                  </span>
                )}
              </div>
            ) : hasAnyPrice && variantPrice ? (
              <span className="heading-md text-primary" data-testid="product-price-current">
                {variantPrice.calculated_price}
              </span>
            ) : (
              <span className="label-md text-secondary pt-2 pb-4" data-testid="product-price-unavailable">
                Not available in your region
              </span>
            )}
          </div>
        </div>
      </div>
      {hasAnyPrice && (
        <ProductVariants product={product} selectedVariant={selectedVariant} />
      )}
      <Button
        onClick={handleAddToCart}
        disabled={isAddToCartDisabled}
        loading={isAddingItem}
        className="w-full uppercase mb-4 py-3 flex justify-center"
        size="large"
        data-testid="product-add-to-cart-button"
      >
        {!hasOffer
          ? "NOT AVAILABLE"
          : isPurchasableOffer
          ? "ADD TO CART"
          : "OUT OF STOCK"}
      </Button>
      {otherOffersCount > 0 && (
        <Button
          variant="tonal"
          onClick={() => setIsCompareOpen(true)}
          className="w-full uppercase mb-4"
          data-testid="compare-offers-button"
        >
          {`Compare ${otherOffersCount} other offer${otherOffersCount > 1 ? "s" : ""}`}
        </Button>
      )}
      {isCompareOpen && (
        <CompareOffersModal
          offers={variantOffers}
          locale={locale}
          variantLabel={
            product.variants?.find(({ id }) => id === variantId)?.title ||
            undefined
          }
          onClose={() => setIsCompareOpen(false)}
        />
      )}
      {user && seller && (
        <Chat
          user={user}
          seller={seller}
          buttonClassNames="w-full uppercase"
          product={product}
        />
      )}
    </div>
  )
}
