import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { kebabCase } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import { CreateBrandDTO } from "@mercurjs/types"
import BrandModuleService from "../../../modules/brand/service"

export const createBrandStep = createStep(
  "create-brand",
  async (input: CreateBrandDTO, { container }) => {
    const service = container.resolve<BrandModuleService>(MercurModules.BRAND)
    const brandData = {
      ...input,
      handle: input.handle?.trim() || kebabCase(input.name),
    }
    const [brand] = await service.createBrands([brandData as any])
    return new StepResponse(brand, brand.id)
  },
  async (brandId: string | undefined, { container }) => {
    if (!brandId) return
    const service = container.resolve<BrandModuleService>(MercurModules.BRAND)
    await service.deleteBrands(brandId)
  }
)
