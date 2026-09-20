import { OfferCard, ProductsPagination } from "@/components/organisms"
import { ProductListingNoResultsView } from "@/components/molecules"
import { PRODUCT_LIMIT } from "@/const"
import { listOffers } from "@/lib/data/offers"
import { rankOffers, type StoreOffer } from "@/lib/helpers/buybox"

export const SellerOffersListing = async ({
  seller_id,
  locale,
  page = 1,
}: {
  seller_id: string
  locale: string
  page?: number
}) => {
  const currentPage = Math.max(page, 1)

  const { offers, count } = await listOffers({
    sellerId: seller_id,
    countryCode: locale,
    limit: 100,
  })

  let allOffers: StoreOffer[] = (offers as StoreOffer[]) || []
  if (count > 100) {
    const additionalFetches = []
    for (let currentOffset = 100; currentOffset < count; currentOffset += 100) {
      additionalFetches.push(
        listOffers({
          sellerId: seller_id,
          countryCode: locale,
          limit: 100,
          offset: currentOffset,
        })
      )
    }
    const results = await Promise.all(additionalFetches)
    for (const res of results) {
      allOffers = allOffers.concat((res.offers as StoreOffer[]) || [])
    }
  }

  // Group offers by product
  const productOffersMap = new Map<string, StoreOffer[]>()
  for (const offer of allOffers) {
    const productId = offer.product?.id || offer.product_id
    if (!productId) continue
    if (!productOffersMap.has(productId)) {
      productOffersMap.set(productId, [])
    }
    productOffersMap.get(productId)!.push(offer)
  }

  const groupedProducts = Array.from(productOffersMap.values()).map(
    (productOffers) => {
      const sorted = rankOffers(productOffers)
      return {
        primaryOffer: sorted[0],
        allOffers: sorted,
      }
    }
  )

  const totalProducts = groupedProducts.length
  const offset = (currentPage - 1) * PRODUCT_LIMIT
  const pagedProducts = groupedProducts.slice(offset, offset + PRODUCT_LIMIT)
  const pages = Math.ceil(totalProducts / PRODUCT_LIMIT) || 1

  const countLabel =
    totalProducts === 1 ? "1 product" : `${totalProducts} products`

  return (
    <div className="py-4" data-testid="seller-offers-listing">
      <div className="my-4 label-md">{countLabel}</div>
      {groupedProducts.length === 0 ? (
        <ProductListingNoResultsView />
      ) : (
        <>
          <div className="flex flex-wrap gap-4" data-testid="seller-offers-list">
            {pagedProducts.map(({ primaryOffer, allOffers: offersForProduct }) => (
              <OfferCard
                key={primaryOffer.product?.id || primaryOffer.id}
                offer={primaryOffer}
                productOffers={offersForProduct}
                locale={locale}
              />
            ))}
          </div>
          {pages > 1 && <ProductsPagination pages={pages} />}
        </>
      )}
    </div>
  )
}
