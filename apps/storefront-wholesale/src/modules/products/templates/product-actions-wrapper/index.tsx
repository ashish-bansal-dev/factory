import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"
import { headers } from "next/headers"
import { getTenantSeller } from "@lib/data/seller"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const headersList = await headers()
  const isTenant = headersList.get("x-is-tenant") === "true"
  const tenantHandle = headersList.get("x-tenant-handle")
  const customDomain = headersList.get("x-custom-domain")

  const [productRes, tenantSeller] = await Promise.all([
    listProducts({
      queryParams: { id: [id] },
      regionId: region.id,
    }),
    isTenant ? getTenantSeller(tenantHandle, customDomain) : Promise.resolve(null),
  ])

  const product = productRes.response.products[0]

  if (!product) {
    return null
  }

  return (
    <ProductActions
      product={product}
      region={region}
      isTenant={isTenant}
      seller={tenantSeller ?? undefined}
    />
  )
}
