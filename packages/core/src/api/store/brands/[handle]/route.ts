import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { BrandStatus } from "@mercurjs/types"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const identifier = req.params.handle

  const isId = identifier.startsWith("brand_")

  const filters = isId
    ? { id: identifier, status: BrandStatus.APPROVED }
    : { handle: identifier, status: BrandStatus.APPROVED }

  const {
    data: [brand],
  } = await query.graph({
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
      "sellers.*",
      "products.*",
    ],
    filters,
  })

  if (!brand) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with identifier ${identifier} was not found`
    )
  }

  res.json({ brand })
}
