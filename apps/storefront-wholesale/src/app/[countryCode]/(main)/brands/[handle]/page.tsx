import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBrandByHandle } from "@lib/data/brand"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@medusajs/ui"

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await props.params
  const brand = await getBrandByHandle(handle)

  if (!brand) {
    return { title: "Brand Not Found" }
  }

  return {
    title: `${brand.name} - Wholesale Brand Catalog`,
    description: brand.description || `Browse wholesale products from ${brand.name}.`,
  }
}

export default async function BrandProfilePage(props: {
  params: Promise<{ countryCode: string; handle: string }>
}) {
  const { countryCode, handle } = await props.params

  const brand = await getBrandByHandle(handle)
  if (!brand) {
    notFound()
  }

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const { response } = await listProducts({
    countryCode,
    queryParams: {
      brand_id: brand.id,
      limit: 24,
    },
  })

  const products = response.products
  const count = response.count
  const authorizedSellers = brand.sellers || []

  return (
    <div className="content-container py-8">
      {/* Brand Header Banner */}
      <div className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-8 mb-12 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-28 h-28 rounded-2xl bg-ui-bg-subtle p-3 flex items-center justify-center border border-ui-border-base overflow-hidden">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="font-bold text-3xl text-ui-fg-muted">
                {brand.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <Heading level="h1" className="text-3xl font-bold">
              {brand.name}
            </Heading>
            {brand.description && (
              <Text className="text-sm text-ui-fg-subtle mt-2 max-w-2xl leading-relaxed">
                {brand.description}
              </Text>
            )}
            {brand.website_url && (
              <div className="mt-3 text-xs">
                Official Website:{" "}
                <a
                  href={brand.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-ui-fg-interactive underline"
                >
                  {brand.website_url}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authorized Wholesale Suppliers */}
      {authorizedSellers.length > 0 && (
        <div className="mb-12">
          <Heading level="h2" className="text-xl font-semibold mb-4">
            Authorized Wholesale Sellers for {brand.name}
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {authorizedSellers.map((seller) => (
              <LocalizedClientLink
                key={seller.id}
                href={`/sellers/${seller.handle}`}
                className="border border-ui-border-base rounded-xl p-4 flex items-center gap-x-4 hover:border-ui-fg-interactive transition bg-ui-bg-base"
              >
                <div className="w-12 h-12 rounded-full bg-ui-bg-subtle flex items-center justify-center font-semibold overflow-hidden border">
                  {seller.logo ? (
                    <img src={seller.logo} alt={seller.name} className="w-full h-full object-cover" />
                  ) : (
                    seller.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <Text className="font-medium text-ui-fg-base">{seller.name}</Text>
                  <Text className="text-xs text-ui-fg-interactive">View Seller Catalog &rarr;</Text>
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}

      {/* Brand Products Catalog */}
      <div className="mb-6 flex justify-between items-center">
        <Heading level="h2" className="text-xl font-semibold">
          Products by {brand.name} ({count})
        </Heading>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-ui-bg-subtle rounded-xl">
          <Text className="text-ui-fg-muted">
            No active wholesale products found for this brand yet.
          </Text>
        </div>
      ) : (
        <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
