import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BrandDTO, VendorBrandResponse } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorBrandResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context?.seller_id

  const filters: Record<string, any> = {
    id: req.params.id,
    ...req.filterableFields,
  }
  delete filters.seller_id

  if (sellerId) {
    filters.sellers = { id: sellerId }
  }

  const { data: [brand] } = await query.graph({
    entity: "brand",
    fields: req.queryConfig.fields,
    filters,
  })

  if (!brand) {
    res.status(404).json({ message: `Brand with id ${req.params.id} not found` } as any)
    return
  }

  res.json({
    brand: brand as unknown as BrandDTO,
  })
}
