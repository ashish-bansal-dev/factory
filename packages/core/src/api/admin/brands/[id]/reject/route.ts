import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminBrandResponse, BrandDTO } from "@mercurjs/types"
import { rejectBrandWorkflow } from "../../../../../workflows/brand/workflows/reject-brand"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse<AdminBrandResponse>
): Promise<void> {
  await rejectBrandWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [brand] } = await query.graph({
    entity: "brand",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.status(200).json({
    brand: brand as unknown as BrandDTO,
  })
}
