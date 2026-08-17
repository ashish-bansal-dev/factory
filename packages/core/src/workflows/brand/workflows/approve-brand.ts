import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { BrandDTO, BrandStatus } from "@mercurjs/types"
import { updateBrandStep } from "../steps/update-brand"

type ApproveBrandWorkflowInput = {
  id: string
}

export const approveBrandWorkflow = createWorkflow(
  "approve-brand",
  (input: ApproveBrandWorkflowInput) => {
    const updateInput = transform(input, (data) => ({
      id: data.id,
      status: BrandStatus.APPROVED,
    }))

    const brand = updateBrandStep(updateInput)

    return new WorkflowResponse(brand as unknown as BrandDTO)
  }
)
