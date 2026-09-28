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

    let targetBrandId = input.brand_id
    if (!targetBrandId) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "brand.id"],
        filters: { id: input.product_id },
      })
      targetBrandId = (products?.[0] as { brand?: { id?: string } })?.brand?.id
    }

    if (!targetBrandId) {
      return new StepResponse(undefined, null)
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const link = {
      [MercurModules.BRAND]: { brand_id: targetBrandId },
      [Modules.PRODUCT]: { product_id: input.product_id },
    }

    await remoteLink.dismiss([link])
    return new StepResponse(undefined, {
      product_id: input.product_id,
      brand_id: targetBrandId,
    })
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
