import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { BrandDTO, BrandStatus } from "@mercurjs/types"
import { updateBrandStep } from "../steps/update-brand"

type RejectBrandWorkflowInput = {
  id: string
}

export const rejectBrandWorkflow = createWorkflow(
  "reject-brand",
  (input: RejectBrandWorkflowInput) => {
    const updateInput = transform(input, (data) => ({
      id: data.id,
      status: BrandStatus.REJECTED,
    }))

    const brand = updateBrandStep(updateInput)

    return new WorkflowResponse(brand as unknown as BrandDTO)
  }
)
