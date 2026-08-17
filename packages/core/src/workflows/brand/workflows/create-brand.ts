import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { AdminCreateBrandDTO, BrandDTO } from "@mercurjs/types"
import { createBrandStep } from "../steps/create-brand"
import { linkBrandSellersStep } from "../steps/link-brand-sellers"

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  (input: AdminCreateBrandDTO) => {
    const brandData = transform(input, (data) => {
      const { seller_ids, ...rest } = data
      return rest
    })

    const brand = createBrandStep(brandData)

    const linkInput = transform({ input, brand }, (data) => ({
      brand_id: data.brand.id,
      seller_ids: data.input.seller_ids ?? [],
    }))

    linkBrandSellersStep(linkInput)

    return new WorkflowResponse(brand as unknown as BrandDTO)
  }
)
