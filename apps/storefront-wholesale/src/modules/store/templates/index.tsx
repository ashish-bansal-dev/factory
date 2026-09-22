import { Suspense } from "react"
import { headers as nextHeaders } from "next/headers"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getSellerByHandle } from "@lib/data/seller"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  let sellerName = ""
  try {
    const headersList = await nextHeaders()
    const isTenant = headersList.get("x-is-tenant") === "true"
    const tenantHandle = headersList.get("x-tenant-handle")
    if (isTenant && tenantHandle) {
      const seller = await getSellerByHandle(tenantHandle).catch(() => null)
      if (seller) {
        sellerName = seller.name
      }
    }
  } catch {}

  const pageTitle = sellerName ? `${sellerName} Wholesale Catalog` : "All products"

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">{pageTitle}</h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
