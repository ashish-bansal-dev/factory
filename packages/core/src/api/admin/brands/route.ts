import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminBrandListResponse, AdminBrandResponse, BrandDTO } from "@mercurjs/types"
import { createBrandWorkflow } from "../../../workflows/brand/workflows/create-brand"
import { AdminCreateBrandType } from "./validators"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse<AdminBrandListResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: brands, metadata } = await query.graph({
    entity: "brand",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    brands: brands as unknown as BrandDTO[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export async function POST(
  req: MedusaRequest<AdminCreateBrandType>,
  res: MedusaResponse<AdminBrandResponse>
): Promise<void> {
  const { result: brand } = await createBrandWorkflow(req.scope).run({
    input: req.validatedBody,
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
