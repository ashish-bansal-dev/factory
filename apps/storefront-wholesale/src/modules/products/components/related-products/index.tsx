import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "../product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const seller = (product as any).seller
  const sellerId = seller?.id || (product as any).seller_id
  const sellerName = seller?.name

  let relatedProducts: HttpTypes.StoreProduct[] = []

  // 1. Try fetching more products from the same vendor/manufacturer
  if (sellerId) {
    try {
      const { response } = await listProducts({
        countryCode,
        queryParams: {
          seller_id: sellerId,
          limit: 8,
        },
      })
      relatedProducts = response.products.filter((p) => p.id !== product.id)
    } catch {
      // Fallback
    }
  }

  // 2. If fewer than 4 vendor products, complement with category or collection products
  if (relatedProducts.length < 4) {
    const categoryIds = (product.categories ?? []).map((c) => c.id).filter(Boolean)
    const fallbackParams: HttpTypes.StoreProductListParams = {
      limit: 8,
      is_giftcard: false,
    }
    if (categoryIds.length > 0) {
      fallbackParams.category_id = categoryIds
    } else if (product.collection_id) {
      fallbackParams.collection_id = [product.collection_id]
    }

    try {
      const { response } = await listProducts({
        countryCode,
        queryParams: fallbackParams,
      })
      const extraProducts = response.products.filter(
        (p) => p.id !== product.id && !relatedProducts.some((existing) => existing.id === p.id)
      )
      relatedProducts = [...relatedProducts, ...extraProducts].slice(0, 8)
    } catch {
      // Ignore
    }
  }

  // 3. Fallback to general catalog if still empty
  if (relatedProducts.length === 0) {
    try {
      const { response } = await listProducts({
        countryCode,
        queryParams: { limit: 8, is_giftcard: false },
      })
      relatedProducts = response.products.filter((p) => p.id !== product.id).slice(0, 8)
    } catch {
      return null
    }
  }

  if (relatedProducts.length === 0) {
    return null
  }

  const sectionTitle = sellerName ? `More from ${sellerName}` : "Related Wholesale Styles"
  const sectionSubtitle = sellerName
    ? `Explore additional manufacturer styles and pack curves from ${sellerName}.`
    : "Discover complementary wholesale articles and verified manufacturer collections."

  return (
    <div className="product-page-constraint font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-600 block mb-1">
            Wholesale Catalog
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            {sectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
            {sectionSubtitle}
          </p>
        </div>

        {seller?.handle && (
          <LocalizedClientLink
            href={`/sellers/${seller.handle}`}
            className="text-xs font-semibold text-terracotta-600 hover:text-terracotta-700 hover:underline shrink-0"
          >
            View Full Vendor Line Sheet &rarr;
          </LocalizedClientLink>
        )}
      </div>

      {/* Mobile Horizontal Swipe Rail / Desktop Grid */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 sm:pb-0">
        <ul className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 snap-x snap-mandatory">
          {relatedProducts.map((p) => (
            <li
              key={p.id}
              className="w-[260px] sm:w-auto shrink-0 snap-start"
            >
              <ProductPreview product={p} region={region} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
