import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"
import { UpdateBrandDTO } from "@mercurjs/types"
import BrandModuleService from "../../../modules/brand/service"

type UpdateBrandStepInput = {
  id: string
} & UpdateBrandDTO

export const updateBrandStep = createStep(
  "update-brand",
  async (input: UpdateBrandStepInput, { container }) => {
    const service = container.resolve<BrandModuleService>(MercurModules.BRAND)
    const { id, ...data } = input
    const prev = await service.retrieveBrand(id)
    const updatePayload: any = {
      id,
      ...data,
    }
    if (data.handle !== undefined) {
      updatePayload.handle = data.handle?.trim() || prev.handle
    }
    const [brand] = await service.updateBrands([updatePayload])
    return new StepResponse(brand, prev)
  },
  async (prev: any, { container }) => {
    if (!prev) return
    const service = container.resolve<BrandModuleService>(MercurModules.BRAND)
    await service.updateBrands([
      {
        id: prev.id,
        name: prev.name,
        handle: prev.handle,
        description: prev.description,
        logo: prev.logo,
        banner: prev.banner,
        website_url: prev.website_url,
        status: prev.status,
        metadata: prev.metadata,
      } as any,
    ])
  }
)
