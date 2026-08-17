import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { AdminUpdateBrandDTO, BrandDTO } from "@mercurjs/types"
import { updateBrandStep } from "../steps/update-brand"
import { linkBrandSellersStep } from "../steps/link-brand-sellers"
import { dismissBrandSellersStep } from "../steps/dismiss-brand-sellers"

type UpdateBrandWorkflowInput = {
  id: string
  existing_seller_ids?: string[]
} & AdminUpdateBrandDTO

export const updateBrandWorkflow = createWorkflow(
  "update-brand",
  (input: UpdateBrandWorkflowInput) => {
    const updateData = transform(input, (data) => {
      const { seller_ids, existing_seller_ids, ...rest } = data
      return rest
    })

    const brand = updateBrandStep(updateData)

    // Sync sellers if seller_ids is provided
    const linkChanges = transform(input, (data) => {
      if (data.seller_ids === undefined) {
        return { toAdd: [], toRemove: [] }
      }
      const existing = data.existing_seller_ids ?? []
      const current = data.seller_ids ?? []
      const toAdd = current.filter((id) => !existing.includes(id))
      const toRemove = existing.filter((id) => !current.includes(id))
      return { toAdd, toRemove }
    })

    const toRemoveInput = transform({ input, linkChanges }, (data) => ({
      brand_id: data.input.id,
      seller_ids: data.linkChanges.toRemove,
    }))

    const toAddInput = transform({ input, linkChanges }, (data) => ({
      brand_id: data.input.id,
      seller_ids: data.linkChanges.toAdd,
    }))

    dismissBrandSellersStep(toRemoveInput)
    linkBrandSellersStep(toAddInput)

    return new WorkflowResponse(brand as unknown as BrandDTO)
  }
)
