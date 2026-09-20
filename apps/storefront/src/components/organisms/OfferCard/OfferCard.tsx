"use client"

import Image from "next/image"

import { Button } from "@/components/atoms"
import { toast } from "@/lib/helpers/toast"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { useCartContext } from "@/components/providers"
import { getOfferAmount, getOfferStock, type StoreOffer } from "@/lib/helpers/buybox"
import { convertToLocale } from "@/lib/helpers/money"
import { cn } from "@/lib/utils"

export const OfferCard = ({
  offer,
  productOffers,
  locale,
  className,
}: {
  offer: StoreOffer
  productOffers?: StoreOffer[]
  locale: string
  className?: string
}) => {
  const { addToCart, onAddToCart, cart, isAddingItem } = useCartContext()

  const product = offer.product
  const productName = String(product?.title || "Product")

  const hasMultipleOffers = Boolean(productOffers && productOffers.length > 1)
  const offersList =
    productOffers && productOffers.length > 0 ? productOffers : [offer]

  const amounts = offersList
    .map(getOfferAmount)
    .filter((a): a is number => a !== null)
  const minAmount = amounts.length ? Math.min(...amounts) : getOfferAmount(offer)
  const maxAmount = amounts.length ? Math.max(...amounts) : getOfferAmount(offer)

  const currency =
    offer.calculated_price?.currency_code || cart?.currency_code || "eur"

  const totalStock = offersList.reduce((sum, o) => sum + getOfferStock(o), 0)
  const stock = getOfferStock(offer)

  const hasPrice = minAmount !== null
  const displayPrice = hasPrice
    ? (hasMultipleOffers && minAmount !== maxAmount ? "From " : "") +
      convertToLocale({ amount: minAmount as number, currency_code: currency })
    : null

  const quantityInCart =
    cart?.items?.find((item) => item.metadata?.offer_id === offer.id)?.quantity ?? 0
  const isStockMaxLimitReached = quantityInCart >= stock
  const singleAmount = getOfferAmount(offer)
  const isAddToCartDisabled = !hasPrice || !stock || isStockMaxLimitReached

  const handleAddToCart = async () => {
    if (isAddToCartDisabled || singleAmount === null) return

    const total = singleAmount
    const subtotal =
      offer.calculated_price?.calculated_amount_without_tax ?? total

    onAddToCart(
      {
        thumbnail: product?.thumbnail || "",
        product_title: product?.title,
        quantity: 1,
        subtotal,
        total,
        tax_total: total - subtotal,
        variant_id: offer.variant_id,
        product_id: offer.product_id,
        metadata: { offer_id: offer.id },
      },
      currency
    )

    try {
      await addToCart({ offerId: offer.id, quantity: 1, countryCode: locale })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "This offer does not have the required inventory",
      })
    }
  }

  return (
    <div
      className={cn(
        "relative group border rounded-sm flex flex-col justify-between p-1 w-full lg:w-[calc(25%-1rem)] min-w-[250px]",
        className
      )}
      data-testid="offer-card"
      data-offer-id={offer.id}
    >
      <div className="relative w-full h-full bg-primary aspect-square" data-testid="offer-card-image-container">
        <LocalizedClientLink
          href={`/products/${product?.handle}`}
          aria-label={`View ${productName}`}
          title={`View ${productName}`}
          data-testid="offer-card-link"
        >
          <div className="overflow-hidden rounded-sm w-full h-full flex justify-center align-center">
            <Image
              priority
              fetchPriority="high"
              src={product?.thumbnail ? decodeURIComponent(product.thumbnail) : "/images/placeholder.svg"}
              alt={`${productName} image`}
              width={100}
              height={100}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain aspect-square w-full object-center h-full rounded-xs"
              data-testid="offer-card-image"
            />
          </div>
        </LocalizedClientLink>
      </div>
      <div className="flex flex-col gap-3 p-4" data-testid="offer-card-info">
        <LocalizedClientLink
          href={`/products/${product?.handle}`}
          aria-label={`Go to ${productName} page`}
          title={`Go to ${productName} page`}
        >
          <h3 className="heading-sm truncate" data-testid="offer-card-title">
            {productName}
          </h3>
          <div className="flex items-center gap-2 mt-2" data-testid="offer-card-price">
            {displayPrice ? (
              <p className="font-medium" data-testid="offer-card-current-price">
                {displayPrice}
              </p>
            ) : (
              <p className="label-md text-secondary" data-testid="offer-card-price-unavailable">
                Not available in your region
              </p>
            )}
          </div>
        </LocalizedClientLink>
        {hasMultipleOffers ? (
          !hasPrice ? (
            <Button
              disabled
              className="w-full uppercase py-3 flex justify-center"
              data-testid="offer-card-not-available-button"
            >
              NOT AVAILABLE
            </Button>
          ) : totalStock <= 0 ? (
            <Button
              disabled
              className="w-full uppercase py-3 flex justify-center"
              data-testid="offer-card-out-of-stock-button"
            >
              OUT OF STOCK
            </Button>
          ) : (
            <LocalizedClientLink
              href={`/products/${product?.handle}`}
              className="w-full"
              data-testid="offer-card-view-options-link"
            >
              <Button
                className="w-full uppercase py-3 flex justify-center"
                data-testid="offer-card-view-options-button"
              >
                VIEW OPTIONS
              </Button>
            </LocalizedClientLink>
          )
        ) : (
          <Button
            onClick={handleAddToCart}
            disabled={isAddToCartDisabled}
            loading={isAddingItem}
            className="w-full uppercase py-3 flex justify-center"
            data-testid="offer-card-add-to-cart-button"
          >
            {!hasPrice ? "NOT AVAILABLE" : stock ? "ADD TO CART" : "OUT OF STOCK"}
          </Button>
        )}
      </div>
    </div>
  )
}
