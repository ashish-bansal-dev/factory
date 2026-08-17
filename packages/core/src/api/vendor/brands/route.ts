import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BrandDTO, BrandStatus, VendorBrandListResponse, VendorBrandResponse } from "@mercurjs/types"
import { createBrandWorkflow } from "../../../workflows/brand/workflows/create-brand"
import { VendorCreateBrandType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorBrandListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context?.seller_id

  const filters: Record<string, any> = {
    ...req.filterableFields,
  }
  delete filters.seller_id

  if (sellerId) {
    filters.sellers = { id: sellerId }
  }

  const { data: brands, metadata } = await query.graph({
    entity: "brand",
    fields: req.queryConfig.fields,
    filters,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    brands: brands as unknown as BrandDTO[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateBrandType>,
  res: MedusaResponse<VendorBrandResponse>
) => {
  const sellerId = req.seller_context?.seller_id

  const { result: brand } = await createBrandWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      status: BrandStatus.PENDING_APPROVAL,
      seller_ids: sellerId ? [sellerId] : [],
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [createdBrand] } = await query.graph({
    entity: "brand",
    fields: req.queryConfig.fields,
    filters: { id: brand.id },
  })

  res.status(200).json({
    brand: createdBrand as unknown as BrandDTO,
  })
}
