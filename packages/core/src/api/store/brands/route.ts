import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BrandStatus } from "@mercurjs/types"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: brands, metadata } = await query.graph({
    entity: "brand",
    fields: req.queryConfig?.fields || [
      "id",
      "name",
      "handle",
      "description",
      "logo",
      "banner",
      "website_url",
      "status",
      "metadata",
    ],
    filters: {
      ...(req.filterableFields || {}),
      status: BrandStatus.APPROVED,
    },
    pagination: req.queryConfig?.pagination,
  })

  res.json({
    brands,
    count: metadata?.count ?? brands.length,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 50,
  })
}
