import { Metadata } from "next"
import { headers } from "next/headers"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import WholesaleDiscovery from "@modules/home/components/wholesale-discovery"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { listSellers, getTenantSeller } from "@lib/data/seller"
import { listBrands } from "@lib/data/brand"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import { Heading, Text, Badge } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Wholesale B2B Marketplace & Supplier Direct Hub",
  description:
    "Direct wholesale B2B marketplace connecting verified suppliers, manufacturers, and buyers.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const headersList = await headers()
  const isTenant = headersList.get("x-is-tenant") === "true"
  const tenantHandle = headersList.get("x-tenant-handle")
  const customDomain = headersList.get("x-custom-domain")

  // --- TENANT SUBDOMAIN / CUSTOM DOMAIN MODE ---
  if (isTenant) {
    const seller = await getTenantSeller(tenantHandle, customDomain)

    if (seller) {
      const { response } = await listProducts({
        countryCode,
        queryParams: {
          seller_id: seller.id,
          limit: 24,
        },
      })

      const products = response.products
      const count = response.count

      return (
        <div className="content-container py-8">
          {/* Tenant Storefront Hero */}
          <div className="rounded-2xl border border-ui-border-base overflow-hidden bg-ui-bg-base mb-12 shadow-sm">
            <div className="h-52 bg-gradient-to-r from-ui-bg-subtle via-ui-bg-subtle-hover to-ui-bg-subtle relative">
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
                      Official Wholesale Storefront
                    </Text>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${(seller.phone || "919782077711").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hello! I am inquiring about wholesale orders from ${seller.name} on FactoryTribe Wholesale.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-charcoal-900 text-white rounded-full text-xs font-semibold hover:bg-stone-800 transition shadow-xs text-center"
                >
                  Direct Wholesale WhatsApp Inquiry &rarr;
                </a>
              </div>

              {seller.description && (
                <div className="max-w-3xl mb-4">
                  <Text className="text-sm text-ui-fg-subtle leading-relaxed">
                    {seller.description}
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* Seller Products Grid */}
          <div className="mb-6 flex justify-between items-center">
            <Heading level="h2" className="text-xl font-semibold">
              Wholesale Catalog ({count})
            </Heading>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-ui-bg-subtle rounded-xl text-ui-fg-muted">
              No products available in this seller catalog yet.
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
  }

  // --- CENTRAL MARKETPLACE HUB MODE ---
  const [{ collections }, { sellers }, { brands }, categories] = await Promise.all([
    listCollections({ fields: "id, handle, title" }).catch(() => ({ collections: [] })),
    listSellers({ limit: 6 }).catch(() => ({ sellers: [] })),
    listBrands({ limit: 12 }).catch(() => ({ brands: [] })),
    listCategories({ limit: 8 }).catch(() => []),
  ])

  return (
    <>
      <Hero />
      <div className="content-container">
        {/* Interactive Wholesale Discovery Section */}
        <WholesaleDiscovery sellers={sellers} brands={brands} categories={categories} />
      </div>

      {collections && collections.length > 0 && (
        <div className="py-12">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      )}
    </>
  )
}
