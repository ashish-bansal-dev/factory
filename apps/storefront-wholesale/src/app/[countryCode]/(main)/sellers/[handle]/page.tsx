import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getSellerByHandle } from "@lib/data/seller"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Heading, Text, Badge } from "@medusajs/ui"

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await props.params
  const seller = await getSellerByHandle(handle)

  if (!seller) {
    return { title: "Seller Not Found" }
  }

  return {
    title: `${seller.name} - Wholesale Store`,
    description: seller.description || `Browse wholesale products from ${seller.name}.`,
  }
}

export default async function SellerProfilePage(props: {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { countryCode, handle } = await props.params
  const { page } = await props.searchParams

  const seller = await getSellerByHandle(handle)
  if (!seller) {
    notFound()
  }

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const currentPage = page ? parseInt(page, 10) : 1
  const { response } = await listProducts({
    countryCode,
    pageParam: currentPage,
    queryParams: {
      seller_id: seller.id,
      limit: 24,
    },
  })

  const products = response.products
  const count = response.count

  const subdomain = `${seller.handle}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:8000"}`

  return (
    <div className="content-container py-8">
      {/* Seller Hero Card */}
      <div className="rounded-2xl border border-ui-border-base overflow-hidden bg-ui-bg-base mb-12 shadow-sm">
        <div className="h-44 bg-gradient-to-r from-ui-bg-subtle via-ui-bg-subtle-hover to-ui-bg-subtle relative">
          {seller.banner && (
            <img
              src={seller.banner}
              alt={seller.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-x-5">
              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center font-bold text-2xl text-ui-fg-base">
                {seller.logo ? (
                  <img
                    src={seller.logo}
                    alt={seller.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  seller.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-x-3">
                  <Heading level="h1" className="text-2xl font-bold">
                    {seller.name}
                  </Heading>
                  {seller.is_premium && (
                    <Badge color="orange">Verified Supplier</Badge>
                  )}
                </div>
                <Text className="text-xs text-ui-fg-muted">
                  Direct Storefront: <span className="font-mono text-ui-fg-interactive">{subdomain}</span>
                </Text>
              </div>
            </div>

            {seller.email && (
              <a
                href={`mailto:${seller.email}?subject=Wholesale%20Inquiry%20from%20Marketplace`}
                className="px-5 py-2.5 bg-ui-button-inverted text-ui-fg-on-inverted rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Inquire for Bulk Order
              </a>
            )}
          </div>

          {seller.description && (
            <div className="max-w-3xl mb-6">
              <Text className="text-sm text-ui-fg-subtle leading-relaxed">
                {seller.description}
              </Text>
            </div>
          )}

          <div className="flex items-center gap-x-6 text-xs text-ui-fg-muted border-t border-ui-border-base pt-4">
            {seller.phone && <div>Phone: <span className="font-medium text-ui-fg-base">{seller.phone}</span></div>}
            {seller.website_url && (
              <div>
                Website:{" "}
                <a
                  href={seller.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-ui-fg-interactive underline"
                >
                  {seller.website_url}
                </a>
              </div>
            )}
            <div>Active Wholesale Items: <span className="font-semibold text-ui-fg-base">{count}</span></div>
          </div>
        </div>
      </div>

      {/* Seller Products Catalog */}
      <div className="mb-6 flex justify-between items-center">
        <Heading level="h2" className="text-xl font-semibold">
          Wholesale Catalog ({count})
        </Heading>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-ui-bg-subtle rounded-xl">
          <Text className="text-ui-fg-muted">
            No products currently listed by this supplier.
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
