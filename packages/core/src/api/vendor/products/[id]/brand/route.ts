import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { linkProductBrandWorkflow } from "../../../../../workflows/brand/workflows/link-product-brand"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminBatchLink>,
  res: MedusaResponse
) => {
  const { add, remove } = req.validatedBody || {}

  await linkProductBrandWorkflow(req.scope).run({
    input: { id: req.params.id, add, remove },
  })

  res.status(200).json({ id: req.params.id, object: "product" })
}
