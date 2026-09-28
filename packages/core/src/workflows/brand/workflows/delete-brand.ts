import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteBrandStep } from "../steps/delete-brand"

type DeleteBrandWorkflowInput = {
  id: string
}

export const deleteBrandWorkflow = createWorkflow(
  "delete-brand",
  (input: DeleteBrandWorkflowInput) => {
    const deletedId = deleteBrandStep(input.id)
    return new WorkflowResponse(deletedId)
  }
)
