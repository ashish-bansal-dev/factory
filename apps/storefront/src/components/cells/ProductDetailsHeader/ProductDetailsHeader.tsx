"use client"

import { useState } from "react"
import { Button } from '@/components/atoms/Button/Button';
import { HttpTypes } from "@medusajs/types"
import { ProductVariants } from '@/components/molecules/ProductVariants/ProductVariants';
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
import { useCartDrawer } from "@/components/providers/Cart/drawer"
import { filterRetailProduct, getVariantMrp } from "@/lib/helpers/variant-filter"
import { MinusThinIcon, PlusIcon } from "@/icons"

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
  const { addToCart, cart, isAddingItem } = useCartContext()
  const { allSearchParams } = useGetAllSearchParams()
  const { openDrawer } = useCartDrawer()
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const retailProduct = filterRetailProduct(product)

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product: retailProduct,
  })

  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  const selectedVariant = hasAnyPrice
    ? {
        ...optionsAsKeymap(cheapestVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  const currentVariant = retailProduct.variants?.find(({ options }: { options?: HttpTypes.StoreProductOptionValue[] | null }) =>
    options?.every((option: HttpTypes.StoreProductOptionValue) =>
      selectedVariant[option.option?.title?.toLowerCase() || ""]?.includes(
        option.value || ""
      )
    )
  )

  const variantId = currentVariant?.id || ""

  const { variantPrice } = getProductPrice({
    product: retailProduct,
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

  const variantMrp = getVariantMrp(currentVariant)
  const singleItemMrp =
    winnerOffer?.mrp != null ? Number(winnerOffer.mrp) : variantMrp
  const hasSavings =
    singleItemMrp !== null && offerAmount !== null && singleItemMrp > offerAmount
  const savingsAmount = hasSavings ? singleItemMrp - (offerAmount as number) : 0
  const savingsPercent =
    hasSavings && singleItemMrp > 0
      ? Math.round((savingsAmount / singleItemMrp) * 100)
      : 0

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

  const maxQuantity = Math.max(1, Math.min(99, offerStock - quantityInCart))
  const selectedQuantity = Math.min(quantity, maxQuantity)

  const handleAddToCart = async () => {
    if (!winnerOffer || isAddToCartDisabled) return

    const total = offerAmount as number
    const subtotal =
      winnerOffer.calculated_price?.calculated_amount_without_tax ?? total

    const storeCartLineItem = {
      thumbnail: product.thumbnail || "",
      product_title: product.title,
      quantity: selectedQuantity,
      subtotal: subtotal * selectedQuantity,
      total: total * selectedQuantity,
      tax_total: (total - subtotal) * selectedQuantity,
      variant_id: variantId,
      product_id: product.id,
      variant: retailProduct.variants?.find(({ id }) => id === variantId),
      metadata: { offer_id: winnerOffer.id },
    }

    openDrawer()
    setQuantity(1)

    try {
      await addToCart({
        offerId: winnerOffer.id,
        quantity: selectedQuantity,
        countryCode: locale,
        optimisticItem: { item: storeCartLineItem, currencyCode: offerCurrency },
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
                  {singleItemMrp !== null && (
                    <span
                      className="text-sm text-secondary line-through"
                      data-testid="product-price-mrp"
                    >
                      {convertToLocale({ amount: singleItemMrp, currency_code: offerCurrency })}
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
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="heading-md text-primary" data-testid="product-price-current">
                    {variantPrice.calculated_price}
                  </span>
                  {variantMrp !== null && (
                    <span
                      className="text-sm text-secondary line-through"
                      data-testid="product-price-mrp"
                    >
                      {convertToLocale({
                        amount: variantMrp,
                        currency_code: variantPrice.currency_code,
                      })}
                    </span>
                  )}
                </div>
                {variantMrp !== null &&
                  variantPrice.calculated_price_number !== undefined &&
                  variantMrp > variantPrice.calculated_price_number && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded w-fit"
                      data-testid="product-price-savings"
                    >
                      <span>
                        {Math.round(
                          ((variantMrp - variantPrice.calculated_price_number) /
                            variantMrp) *
                            100
                        )}
                        % OFF
                      </span>
                      <span className="text-emerald-500 font-normal">·</span>
                      <span>
                        Save{" "}
                        {convertToLocale({
                          amount: variantMrp - variantPrice.calculated_price_number,
                          currency_code: variantPrice.currency_code,
                        })}
                      </span>
                    </span>
                  )}
              </div>
            ) : (
              <span className="label-md text-secondary pt-2 pb-4" data-testid="product-price-unavailable">
                Not available in your region
              </span>
            )}
          </div>
        </div>
      </div>
      {hasAnyPrice && (
        <ProductVariants product={retailProduct} selectedVariant={selectedVariant} />
      )}
      <div className="mb-4 flex gap-2">
        <div
          aria-label="Item quantity"
          role="group"
          className="flex shrink-0 items-center rounded-sm border"
          data-testid="product-quantity-picker"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            className="flex h-full w-10 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isAddToCartDisabled || selectedQuantity <= 1}
            onClick={() => setQuantity(Math.max(1, selectedQuantity - 1))}
            data-testid="product-quantity-decrease"
          >
            <MinusThinIcon size={16} />
          </button>
          <span
            aria-live="polite"
            role="status"
            className="label-md w-8 text-center tabular-nums"
            data-testid="product-quantity-value"
          >
            {selectedQuantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="flex h-full w-10 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isAddToCartDisabled || selectedQuantity >= maxQuantity}
            onClick={() => setQuantity(Math.min(maxQuantity, selectedQuantity + 1))}
            data-testid="product-quantity-increase"
          >
            <PlusIcon size={16} />
          </button>
        </div>
      <Button
        onClick={handleAddToCart}
        disabled={isAddToCartDisabled}
        loading={isAddingItem}
        className="w-full uppercase py-3 flex justify-center"
        size="large"
        data-testid="product-add-to-cart-button"
      >
        {!hasOffer
          ? "NOT AVAILABLE"
          : isPurchasableOffer
          ? "ADD TO CART"
          : "OUT OF STOCK"}
      </Button>
      </div>
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
