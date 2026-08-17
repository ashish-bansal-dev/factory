import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"
import BrandModuleService from "../../../modules/brand/service"

export const deleteBrandStep = createStep(
  "delete-brand",
  async (id: string, { container }) => {
    const service = container.resolve<BrandModuleService>(MercurModules.BRAND)
    const prev = await service.retrieveBrand(id)
    await service.deleteBrands(id)
    return new StepResponse(id, prev)
  },
  async (prev: any, { container }) => {
    if (!prev) return
    const service = container.resolve<BrandModuleService>(MercurModules.BRAND)
    await service.createBrands(prev)
  }
)
