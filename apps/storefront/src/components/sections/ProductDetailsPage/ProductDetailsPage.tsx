import { ProductDetails, ProductGallery } from "@/components/organisms"
import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@/lib/data/products"
import { listOffers } from "@/lib/data/offers"
import { StoreOffer } from "@/lib/helpers/buybox"
import { HomeProductSection } from "../HomeProductSection/HomeProductSection"
import NotFound from "@/app/not-found"

import { Product } from "@/types/product"

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])

  if (!prod) return NotFound()

  const prodSeller = (prod as HttpTypes.StoreProduct & { seller?: { store_status?: string; products?: HttpTypes.StoreProduct[] } }).seller

  if (prodSeller?.store_status === "SUSPENDED") {
    return NotFound()
  }

  const { offers } = await listOffers({
    productId: prod.id,
    countryCode: locale,
  })

  return (
    <>
      <div className="flex flex-col md:flex-row lg:gap-12" data-testid="product-details-page">
        <div className="md:w-1/2 md:px-2" data-testid="product-gallery-container">
          <ProductGallery images={prod?.images || []} />
        </div>
        <div className="md:w-1/2 md:px-2" data-testid="product-details-container">
          <ProductDetails
            product={prod}
            locale={locale}
            offers={offers as StoreOffer[]}
          />
        </div>
      </div>
      <div className="my-8">
        <HomeProductSection
          heading="Similar items"
          products={prodSeller?.products as unknown as Product[]}
          locale={locale}
        />
      </div>
    </>
  )
}
