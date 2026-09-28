import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { linkBrandSellersStep } from "../steps/link-brand-sellers"
import { dismissBrandSellersStep } from "../steps/dismiss-brand-sellers"

type ManageBrandSellersWorkflowInput = {
  brand_id: string
  add?: string[]
  remove?: string[]
}

export const manageBrandSellersWorkflow = createWorkflow(
  "manage-brand-sellers",
  (input: ManageBrandSellersWorkflowInput) => {
    const toAdd = transform(input, (data) => ({
      brand_id: data.brand_id,
      seller_ids: data.add ?? [],
    }))

    const toRemove = transform(input, (data) => ({
      brand_id: data.brand_id,
      seller_ids: data.remove ?? [],
    }))

    linkBrandSellersStep(toAdd)
    dismissBrandSellersStep(toRemove)

    return new WorkflowResponse(input.brand_id)
  }
)
