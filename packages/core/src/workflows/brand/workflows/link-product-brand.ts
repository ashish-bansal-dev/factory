import {
  createWorkflow,
  transform,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"
import { linkProductBrandStep } from "../steps/link-product-brand"
import { dismissProductBrandStep } from "../steps/dismiss-product-brand"

export type LinkProductBrandWorkflowInput = {
  id: string
  add?: string[]
  remove?: string[]
  brand_id?: string | null
}

export const linkProductBrandWorkflowId = "mercur-link-product-brand"

export const linkProductBrandWorkflow = createWorkflow(
  linkProductBrandWorkflowId,
  (input: WorkflowData<LinkProductBrandWorkflowInput>): WorkflowData<void> => {
    const toDismiss = transform(input, (data) => {
      const removeBrandId = data.remove?.[0]
      if (removeBrandId) {
        return { product_id: data.id, brand_id: removeBrandId }
      }
      if (data.brand_id === null || (data.brand_id && !removeBrandId)) {
        return { product_id: data.id }
      }
      return undefined
    })

    const toLink = transform(input, (data) => {
      const addBrandId = data.add?.[0] || data.brand_id
      if (addBrandId) {
        return { product_id: data.id, brand_id: addBrandId }
      }
      return undefined
    })

    dismissProductBrandStep(toDismiss)
    linkProductBrandStep(toLink)
  }
)
