import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export type DismissProductBrandStepInput = {
  product_id: string
  brand_id?: string
}

export const dismissProductBrandStepId = "dismiss-product-brand"

export const dismissProductBrandStep = createStep(
  dismissProductBrandStepId,
  async (input: DismissProductBrandStepInput | undefined, { container }) => {
    if (!input?.product_id) {
      return new StepResponse(undefined, null)
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const link: Record<string, Record<string, string>> = {
      [MercurModules.BRAND]: input.brand_id ? { brand_id: input.brand_id } : {},
      [Modules.PRODUCT]: { product_id: input.product_id },
    }

    await remoteLink.dismiss([link as any])
    return new StepResponse(undefined, input)
  },
  async (input, { container }) => {
    if (!input?.product_id || !input?.brand_id) {
      return
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const link = {
      [MercurModules.BRAND]: { brand_id: input.brand_id },
      [Modules.PRODUCT]: { product_id: input.product_id },
    }

    await remoteLink.create([link])
  }
)
