import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export type LinkProductBrandStepInput = {
  product_id: string
  brand_id: string
}

export const linkProductBrandStepId = "link-product-brand"

export const linkProductBrandStep = createStep(
  linkProductBrandStepId,
  async (input: LinkProductBrandStepInput | undefined, { container }) => {
    if (!input?.product_id || !input?.brand_id) {
      return new StepResponse(undefined, null)
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const link = {
      [MercurModules.BRAND]: { brand_id: input.brand_id },
      [Modules.PRODUCT]: { product_id: input.product_id },
    }

    await remoteLink.create([link])
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

    await remoteLink.dismiss([link])
  }
)
