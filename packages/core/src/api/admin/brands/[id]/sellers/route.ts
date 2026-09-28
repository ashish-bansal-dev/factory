import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminBrandResponse, BrandDTO } from "@mercurjs/types"
import { manageBrandSellersWorkflow } from "../../../../../workflows/brand/workflows/manage-brand-sellers"
import { AdminManageBrandSellersType } from "../../validators"

export async function POST(
  req: MedusaRequest<AdminManageBrandSellersType>,
  res: MedusaResponse<AdminBrandResponse>
): Promise<void> {
  const brandId = req.params.id

  await manageBrandSellersWorkflow(req.scope).run({
    input: {
      brand_id: brandId,
      add: req.validatedBody.add,
      remove: req.validatedBody.remove,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [brand] } = await query.graph({
    entity: "brand",
    fields: req.queryConfig.fields,
    filters: { id: brandId },
  })

  res.status(200).json({
    brand: brand as unknown as BrandDTO,
  })
}
