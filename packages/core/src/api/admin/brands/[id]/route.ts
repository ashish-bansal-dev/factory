import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminBrandResponse, BrandDTO } from "@mercurjs/types"
import { updateBrandWorkflow } from "../../../../workflows/brand/workflows/update-brand"
import { deleteBrandWorkflow } from "../../../../workflows/brand/workflows/delete-brand"
import { AdminUpdateBrandType } from "../validators"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse<AdminBrandResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: [brand] } = await query.graph({
    entity: "brand",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!brand) {
    res.status(404).json({ message: `Brand with id ${req.params.id} not found` } as any)
    return
  }

  res.json({
    brand: brand as unknown as BrandDTO,
  })
}

export async function POST(
  req: MedusaRequest<AdminUpdateBrandType>,
  res: MedusaResponse<AdminBrandResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  let existingSellerIds: string[] | undefined
  if (req.validatedBody.seller_ids !== undefined) {
    const { data: [currentBrand] } = await query.graph({
      entity: "brand",
      fields: ["id", "sellers.id"],
      filters: { id: req.params.id },
    })
    existingSellerIds = (currentBrand as any)?.sellers?.map((s: any) => s.id) ?? []
  }

  await updateBrandWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
      existing_seller_ids: existingSellerIds,
    },
  })

  const { data: [updatedBrand] } = await query.graph({
    entity: "brand",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.status(200).json({
    brand: updatedBrand as unknown as BrandDTO,
  })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse<{ id: string; object: string; deleted: boolean }>
): Promise<void> {
  await deleteBrandWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json({
    id: req.params.id,
    object: "brand",
    deleted: true,
  })
}
